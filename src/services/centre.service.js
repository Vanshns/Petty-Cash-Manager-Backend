const prisma = require("../config/db");
// const uploadFile = require("../utils/uploadFile");

// const createTransaction = async ({ accountId, amount, categoryId, description, file }) => {
//   return prisma.$transaction(async (tx) => {
//     const centre = await tx.centre.findUnique({ where: { accountId } });
//     if (!centre) throw new Error("Centre not found");

//     const category = await tx.category.findUnique({ where: { id: categoryId } });
//     if (!category) throw new Error("Category not found");

//     const requiresApproval = amount > Number(centre.transactionLimit);

//     // let billImageUrl = null;
//     // if (file) {
//     //   billImageUrl = await uploadFile(file);
//     // }

//     let billImageUrl = null;
//     if (file) {
//       billImageUrl = file.generatedName;
//     }

//     if (!requiresApproval && !billImageUrl) {
//       throw new Error("Bill image required for standard transactions");
//     }

//     if (!requiresApproval && Number(centre.balance) < amount) {
//       throw new Error("Insufficient balance");
//     }

//     const status = requiresApproval ? "PENDING_APPROVAL" : "STANDARD";

//     const transaction = await tx.transaction.create({
//       data: {

//         amount,

//         description,

//         status,

//         billImageUrl,

//         categoryId,

//         centreId:
//           centre.id,
//       },
//     });

//     if (!requiresApproval) {
//       await tx.centre.update({
//         where: { id: centre.id },
//         data: { balance: { decrement: amount } },
//       });

//       const updatedCentre = await tx.centre.findUnique({ where: { id: centre.id } });
//       if (Number(updatedCentre.balance) < Number(updatedCentre.minimumBalance)) {
//         const existingAlert = await tx.alert.findFirst({
//           where: { centreId: centre.id, type: "LOW_BALANCE", isResolved: false },
//         });
//         if (!existingAlert) {
//           await tx.alert.create({
//             data: { centreId: centre.id, type: "LOW_BALANCE", message: "Centre balance below minimum threshold" },
//           });
//         }
//       }
//     }
//     return transaction;
//   });
// };

const {
  createAndSendNotification,
} = require("./notification.service");

const createTransaction = async ({
  accountId,
  amount,
  categoryId,
  description,
  file,
}) => {
  return prisma.$transaction(
    async (tx) => {

      const centre =
        await tx.centre.findUnique({
          where: { accountId },
        });

      if (!centre) {
        throw new Error(
          "Centre not found",
        );
      }

      const category =
        await tx.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        throw new Error(
          "Category not found",
        );
      }

      const requiresApproval =
        amount >
        Number(
          centre.transactionLimit,
        );

      let billImageUrl = null;

      if (file) {
        billImageUrl =
          file.generatedName;
      }

      if (
        !requiresApproval &&
        !billImageUrl
      ) {
        throw new Error(
          "Bill image required for standard transactions",
        );
      }

      if (
        !requiresApproval &&
        Number(centre.balance) <
          amount
      ) {
        throw new Error(
          "Insufficient balance",
        );
      }

      const status =
        requiresApproval
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

            centreId:
              centre.id,
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Notify accountants if approval required
      |--------------------------------------------------------------------------
      */

      if (requiresApproval) {

        const accountants =
          await tx.account.findMany({
            where: {
              role:
                "ACCOUNTANT",
            },
          });

        await Promise.all(
          accountants.map(
            async (
              accountant,
            ) => {

              await createAndSendNotification(
                {
                  accountId:
                    accountant.id,

                  type:
                    "TRANSACTION_PENDING_APPROVAL",

                  title:
                    "New Approval Request",

                  message:
                    `${centre.name} submitted ₹${Number(amount).toLocaleString()} for approval.`,

                  metadata: {

                    screen:
                      "PendingTransactions",

                    transactionId:
                      transaction.id,

                    centreId:
                      centre.id,
                  },
                },
              );
            },
          ),
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Direct standard transaction handling
      |--------------------------------------------------------------------------
      */

      if (!requiresApproval) {

        await tx.centre.update({
          where: {
            id: centre.id,
          },

          data: {
            balance: {
              decrement:
                amount,
            },
          },
        });

        const updatedCentre =
          await tx.centre.findUnique(
            {
              where: {
                id: centre.id,
              },
            },
          );

        if (
          Number(
            updatedCentre.balance,
          ) <
          Number(
            updatedCentre.minimumBalance,
          )
        ) {

          const existingAlert =
            await tx.alert.findFirst(
              {
                where: {
                  centreId:
                    centre.id,

                  type:
                    "LOW_BALANCE",

                  isResolved:
                    false,
                },
              },
            );

          if (!existingAlert) {

            await tx.alert.create({
              data: {
                centreId:
                  centre.id,

                type:
                  "LOW_BALANCE",

                message:
                  "Centre balance below minimum threshold",
              },
            });
          }
        }
      }

      return transaction;
    },
  );
};

const getDashboardMetrics = async (accountId) => {
  const centre = await prisma.centre.findUnique({ where: { accountId } });
  if (!centre) throw new Error("Centre not found");

  const [pendingApprovalsCount, approvedTransactionsCount] = await Promise.all([
    prisma.transaction.count({ where: { centreId: centre.id, status: "PENDING_APPROVAL" } }),
    prisma.transaction.count({ 
      where: { centreId: centre.id, status: { in: ["STANDARD", "APPROVED_COMPLETED"] } } 
    }),
  ]);

  return { remainingBalance: centre.balance, pendingApprovalsCount, approvedTransactionsCount };
};

// const getTransactions = async (accountId) => {
//   const centre = await prisma.centre.findUnique({ where: { accountId } });
//   if (!centre) throw new Error("Centre not found");

//   return prisma.transaction.findMany({
//     where: { centreId: centre.id },
//     include: { category: true },
//     orderBy: { createdAt: "desc" },
//   });
// };

const getTransactions = async (accountId) => {
  const centre = await prisma.centre.findUnique({
    where: { accountId },
  });

  if (!centre) {
    throw new Error("Centre not found");
  }

  const transactions =
    await prisma.transaction.findMany({
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

  return transactions.map((transaction) => ({
    ...transaction,

    billImageUrl:
      transaction.billImageUrl
        ? `${process.env.FILE_BASE_URL}/${transaction.billImageUrl}`
        : null,
  }));
};

const uploadBill = async ({ transactionId, accountId, file }) => {
  if (!file) throw new Error("File is required");

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { centre: true },
  });

  if (!transaction) throw new Error("Transaction not found");
  if (transaction.centre.accountId !== accountId) throw new Error("Unauthorized transaction access");
  if (transaction.status !== "APPROVED_PENDING_BILL") {
    throw new Error("Bill upload not allowed for this transaction");
  }

  // Changing from minio to S3 Bucket

  // const imageUrl = await uploadFile(file);
  // return prisma.transaction.update({
  //   where: { id: transaction.id },
  //   data: { billImageUrl: imageUrl, status: "APPROVED_COMPLETED" },
  // });
  return prisma.transaction.update({
  where: { id: transaction.id },

  data: {
    billImageUrl: file.generatedName,
    status: "APPROVED_COMPLETED",
  },

});
};

const getCentreProfile = async (accountId) => {
  const centre = await prisma.centre.findUnique({
    where: { accountId },
    select: { id: true, name: true, balance: true, transactionLimit: true },
  });
  if (!centre) throw new Error("Centre not found");
  return centre;
};

// const getPendingActions = async (accountId) => {
//   const centre = await prisma.centre.findUnique({ where: { accountId } });
//   if (!centre) throw new Error("Centre not found");

//   return prisma.transaction.findMany({
//     where: {
//       centreId: centre.id,
//       status: { in: ["PENDING_APPROVAL", "APPROVED_PENDING_BILL"] },
//     },
//     orderBy: { createdAt: "desc" },
//     include: { category: true },
//   });
// };

const getPendingActions = async (accountId) => {
  const centre =
    await prisma.centre.findUnique({
      where: { accountId },
    });

  if (!centre) {
    throw new Error("Centre not found");
  }

  const transactions =
    await prisma.transaction.findMany({
      where: {
        centreId: centre.id,

        status: {
          in: [
            "PENDING_APPROVAL",
            "APPROVED_PENDING_BILL",
          ],
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        category: true,
      },
    });

  return transactions.map((transaction) => ({
    ...transaction,

    billImageUrl:
      transaction.billImageUrl
        ? `${process.env.FILE_BASE_URL}/${transaction.billImageUrl}`
        : null,
  }));
};

// const uploadBillAndComplete = async ({ transactionId, accountId, file }) => {
//   if (!file) throw new Error("File is required");

//   const transaction = await prisma.transaction.findUnique({
//     where: { id: transactionId },
//     include: { centre: true },
//   });

//   if (!transaction) throw new Error("Transaction not found");
//   if (transaction.centre.accountId !== accountId) throw new Error("Unauthorized");

//   const allowedStatuses = ["PENDING_APPROVAL", "APPROVED_PENDING_BILL"];
//   if (!allowedStatuses.includes(transaction.status)) {
//     throw new Error("Action not allowed for this transaction status");
//   }

//   const imageUrl = await uploadFile(file);
//   return prisma.transaction.update({
//     where: { id: transaction.id },
//     data: {
//       // billImageUrl: imageUrl,
//       billImageUrl: file.generatedName, // Changing from minio to S3 bucket
//       status: "APPROVED_COMPLETED",
//       updatedAt: new Date(),
//     },
//   });
// };

const uploadBillAndComplete = async ({
  transactionId,
  accountId,
  file,
}) => {
  if (!file)
    throw new Error("File is required");

  const transaction =
    await prisma.transaction.findUnique({
      where: { id: transactionId },

      include: {
        centre: true,
      },
    });

  if (!transaction)
    throw new Error(
      "Transaction not found",
    );

  if (
    transaction.centre.accountId !==
    accountId
  ) {
    throw new Error("Unauthorized");
  }

  const allowedStatuses = [
    "PENDING_APPROVAL",
    "APPROVED_PENDING_BILL",
  ];

  if (
    !allowedStatuses.includes(
      transaction.status,
    )
  ) {
    throw new Error(
      "Action not allowed for this transaction status",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | multer-s3 already uploaded the file
  |--------------------------------------------------------------------------
  |
  | file.generatedName contains:
  | abc123.jpg
  |
  */

  return prisma.transaction.update({
    where: {
      id: transaction.id,
    },

    data: {
      billImageUrl:
        file.generatedName,

      status:
        "APPROVED_COMPLETED",

      updatedAt: new Date(),
    },
  });
};

module.exports = {
  createTransaction,
  getDashboardMetrics,
  getTransactions,
  uploadBill,
  getCentreProfile,
  getPendingActions,
  uploadBillAndComplete,
};