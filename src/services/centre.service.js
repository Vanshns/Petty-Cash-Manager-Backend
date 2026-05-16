const prisma = require("../config/db");

const uploadFile = require(
  "../utils/uploadFile"
);

const createTransaction = async ({
  accountId,
  amount,
  categoryId,
  description,
  file,
}) => {
  return prisma.$transaction(async (tx) => {
    const centre = await tx.centre.findUnique({
      where: {
        accountId,
      },
    });

    if (!centre) {
      throw new Error("Centre not found");
    }

    const category =
      await tx.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      throw new Error("Category not found");
    }

    const requiresApproval =
      amount >
      Number(centre.transactionLimit);

    let billImageUrl = null;

    if (file) {
      billImageUrl =
        await uploadFile(file);
    }

    if (
      !requiresApproval &&
      !billImageUrl
    ) {
      throw new Error(
        "Bill image required for standard transactions"
      );
    }

    if (
      !requiresApproval &&
      Number(centre.balance) < amount
    ) {
      throw new Error(
        "Insufficient balance"
      );
    }

    const status = requiresApproval
      ? "PENDING_APPROVAL"
      : "STANDARD";

    const transaction =
      await tx.transaction.create({
        data: {
          amount,

          description,

          status,

          billImageUrl,

          categoryId,

          centreId: centre.id,
        },
      });

    if (!requiresApproval) {
      await tx.centre.update({
        where: {
          id: centre.id,
        },

        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      const updatedCentre =
        await tx.centre.findUnique({
          where: {
            id: centre.id,
          },
        });

      if (
        Number(updatedCentre.balance) <
        Number(
          updatedCentre.minimumBalance
        )
      ) {
        const existingAlert =
          await tx.alert.findFirst({
            where: {
              centreId: centre.id,

              type: "LOW_BALANCE",

              isResolved: false,
            },
          });

        if (!existingAlert) {
          await tx.alert.create({
            data: {
              centreId: centre.id,

              type: "LOW_BALANCE",

              message:
                "Centre balance below minimum threshold",
            },
          });
        }
      }
    }

    return transaction;
  });
};

const getDashboardMetrics =
  async (accountId) => {
    const centre =
      await prisma.centre.findUnique({
        where: {
          accountId,
        },
      });

    if (!centre) {
      throw new Error(
        "Centre not found"
      );
    }

    const [
      pendingApprovalsCount,

      approvedTransactionsCount,
    ] = await Promise.all([
      prisma.transaction.count({
        where: {
          centreId: centre.id,

          status:
            "PENDING_APPROVAL",
        },
      }),

      prisma.transaction.count({
        where: {
          centreId: centre.id,

          status: {
            in: [
              "STANDARD",
              "APPROVED_COMPLETED",
            ],
          },
        },
      }),
    ]);

    return {
      remainingBalance:
        centre.balance,

      pendingApprovalsCount,

      approvedTransactionsCount,
    };
  };

  const getTransactions = async (
  accountId
) => {
  const centre =
    await prisma.centre.findUnique({
      where: {
        accountId,
      },
    });

  if (!centre) {
    throw new Error(
      "Centre not found"
    );
  }

  return prisma.transaction.findMany({
    where: {
      centreId: centre.id,
    },

    include: {
      category: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

const uploadBill = async ({
  transactionId,
  accountId,
  file,
}) => {
  if (!file) {
    throw new Error(
      "File is required"
    );
  }

  const transaction =
    await prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },

      include: {
        centre: true,
      },
    });

  if (!transaction) {
    throw new Error(
      "Transaction not found"
    );
  }

  if (
    transaction.centre.accountId !==
    accountId
  ) {
    throw new Error(
      "Unauthorized transaction access"
    );
  }

  if (
    transaction.status !==
    "APPROVED_PENDING_BILL"
  ) {
    throw new Error(
      "Bill upload not allowed for this transaction"
    );
  }

  const imageUrl =
    await uploadFile(file);

  return prisma.transaction.update({
    where: {
      id: transaction.id,
    },

    data: {
      billImageUrl: imageUrl,

      status:
        "APPROVED_COMPLETED",
    },
  });
};

module.exports = {
  createTransaction,
  getDashboardMetrics,
  getTransactions,
  uploadBill,
};