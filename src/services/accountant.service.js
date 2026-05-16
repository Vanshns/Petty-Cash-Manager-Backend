// add functionality later for uploading image when funds added or deducted

const prisma = require("../config/db");

const addFunds = async ({
  centreId,
  amount,
  note,
  accountantId,
}) => {
  return prisma.$transaction(async (tx) => {
    const centre = await tx.centre.findUnique({
      where: {
        id: centreId,
      },
    });

    if (!centre) {
      throw new Error("Centre not found");
    }

    const updatedCentre =
      await tx.centre.update({
        where: {
          id: centreId,
        },

        data: {
          balance: {
            increment: amount,
          },
        },
      });

    await tx.walletLedger.create({
      data: {
        centreId,

        amount,

        type: "CREDIT",

        note,

        createdById: accountantId,
      },
    });

    if (
      Number(updatedCentre.balance) >=
      Number(updatedCentre.minimumBalance)
    ) {
      await tx.alert.updateMany({
        where: {
          centreId,

          type: "LOW_BALANCE",

          isResolved: false,
        },

        data: {
          isResolved: true,
        },
      });
    }

    return updatedCentre;
  });
};

const deductFunds = async ({
  centreId,
  amount,
  note,
  accountantId,
}) => {
  return prisma.$transaction(
    async (tx) => {
      const centre =
        await tx.centre.findUnique({
          where: {
            id: centreId,
          },
        });

      if (!centre) {
        throw new Error(
          "Centre not found"
        );
      }

      if (
        parseFloat(
          centre.balance
        ) < amount
      ) {
        throw new Error(
          "Insufficient centre balance"
        );
      }

      const updatedCentre =
        await tx.centre.update({
          where: {
            id: centreId,
          },

          data: {
            balance: {
              decrement:
                amount,
            },
          },
        });

      await tx.walletLedger.create({
        data: {
          centreId,

          amount,

          type: "DEBIT",

          note,

          createdById:
            accountantId,
        },
      });

      console.log(
        "Updated Balance:",
        parseFloat(
          updatedCentre.balance
        )
      );

      console.log(
        "Minimum Balance:",
        parseFloat(
          updatedCentre.minimumBalance
        )
      );

      if (
        parseFloat(
          updatedCentre.balance
        ) <=
        parseFloat(
          updatedCentre.minimumBalance
        )
      ) {
        const existingAlert =
          await tx.alert.findFirst({
            where: {
              centreId,

              type:
                "LOW_BALANCE",

              isResolved: false,
            },
          });

        if (!existingAlert) {
          await tx.alert.create({
            data: {
              centreId,

              type:
                "LOW_BALANCE",

              message:
                "Centre balance below minimum threshold",

              isResolved: false,
            },
          });

          console.log(
            "LOW_BALANCE alert created"
          );
        }
      }

      return updatedCentre;
    }
  );
};

const getPendingTransactions =
  async () => {
    return prisma.transaction.findMany({
      where: {
        status: "PENDING_APPROVAL",
      },

      include: {
        centre: true,
        category: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };

// const AppError = require(
//   "../utils/AppError"
// );

const approveTransaction = async ({
  transactionId,
  accountantId,
}) => {
  return prisma.$transaction(async (tx) => {
    /*
    |--------------------------------------------------------------------------
    | Fetch transaction
    |--------------------------------------------------------------------------
    */

    const transaction =
      await tx.transaction.findUnique({
        where: {
          id: transactionId,
        },

        include: {
          centre: true,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Validations
    |--------------------------------------------------------------------------
    */

    if (!transaction) {
      throw new AppError(
        "Transaction not found",
        404
      );
    }

    if (
      transaction.status !==
      "PENDING_APPROVAL"
    ) {
      throw new AppError(
        "Transaction is not pending approval",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check centre balance BEFORE approval
    |--------------------------------------------------------------------------
    */

    if (
      Number(
        transaction.centre.balance
      ) < Number(transaction.amount)
    ) {
      throw new AppError(
        "Insufficient centre balance",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Deduct balance
    |--------------------------------------------------------------------------
    */

    const updatedCentre =
      await tx.centre.update({
        where: {
          id: transaction.centre.id,
        },

        data: {
          balance: {
            decrement:
              transaction.amount,
          },
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Approve transaction
    |--------------------------------------------------------------------------
    */

    const updatedTransaction =
      await tx.transaction.update({
        where: {
          id: transactionId,
        },

        data: {
          status:
            "APPROVED_PENDING_BILL",

          approvedById:
            accountantId,

          approvedAt:
            new Date(),
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Create low balance alert
    |--------------------------------------------------------------------------
    */

    if (
      Number(updatedCentre.balance) <
      Number(
        updatedCentre.minimumBalance
      )
    ) {
      const existingAlert =
        await tx.alert.findFirst({
          where: {
            centreId:
              updatedCentre.id,

            type:
              "LOW_BALANCE",

            isResolved: false,
          },
        });

      if (!existingAlert) {
        await tx.alert.create({
          data: {
            centreId:
              updatedCentre.id,

            type:
              "LOW_BALANCE",

            message:
              "Centre balance below minimum threshold",

            isResolved: false,
          },
        });
      }
    }

    return updatedTransaction;
  });
};


const AppError = require(
  "../utils/AppError"
);

const rejectTransaction = async ({
  transactionId,
  rejectionReason,
  accountantId,
}) => {
  const transaction =
    await prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | Validations
  |--------------------------------------------------------------------------
  */

  if (!transaction) {
    throw new AppError(
      "Transaction not found",
      404
    );
  }

  if (
    transaction.status !==
    "PENDING_APPROVAL"
  ) {
    throw new AppError(
      "Transaction is not pending approval",
      400
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Reject transaction
  |--------------------------------------------------------------------------
  */

  return prisma.transaction.update({
    where: {
      id: transactionId,
    },

    data: {
      status: "REJECTED",

      approvedById:
        accountantId,

      approvedAt:
        new Date(),

      rejectionReason,
    },
  });
};

const getAlerts = async () => {
  return prisma.alert.findMany({
    where: {
      isResolved: false,
    },

    include: {
      centre: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

const getCentres = async () => {
  return prisma.centre.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getTransactionHistory =
  async ({
    status,
    startDate,
    endDate,
    centreId,
    page = 1,
    limit = 10,
  }) => {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (centreId) {
      where.centreId = centreId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
    }

    if (startDate) {
      where.createdAt.gte = new Date(
        startDate
      );
    }

    if (endDate) {
      where.createdAt.lte = new Date(
        endDate
      );
    }

    const skip = (page - 1) * limit;

    return prisma.transaction.findMany({
      where,

      include: {
        centre: true,
        category: true,
        approvedBy: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,

      take: limit,
    });
  };

  const exportTransactionsToCSV =
  async (filters = {}) => {
    const transactions =
      await getTransactionHistory(
        filters
      );

    return transactions.map(
      (t) => ({
        id: t.id,

        centre:
          t.centre?.name || "",

        amount:
          Number(
            t.amount
          ).toFixed(2),

        status: t.status,

        category:
          t.category?.name ||
          "",

        approvedBy:
          t.approvedBy
            ?.username || "",

        createdAt:
          t.createdAt,

        approvedAt:
          t.approvedAt ||
          "",

        description:
          t.description || "",
      })
    );
  };

  const getDashboardMetrics =
  async () => {
    const [
      pendingApprovalsCount,

      lowBalanceCentresCount,

      walletAggregate,
    ] = await Promise.all([
      prisma.transaction.count({
        where: {
          status:
            "PENDING_APPROVAL",
        },
      }),

      prisma.alert.count({
        where: {
          type: "LOW_BALANCE",

          isResolved: false,
        },
      }),

      prisma.centre.aggregate({
        _sum: {
          balance: true,
        },
      }),
    ]);

    return {
      pendingApprovalsCount,

      lowBalanceCentresCount,

      totalWalletBalance:
        walletAggregate._sum.balance || 0,
    };
  };

  const updateCentreConfig =
  async ({
    centreId,
    minimumBalance,
    transactionLimit,
  }) => {
    const centre =
      await prisma.centre.findUnique({
        where: {
          id: centreId,
        },
      });

    if (!centre) {
      throw new Error(
        "Centre not found"
      );
    }

    return prisma.centre.update({
      where: {
        id: centreId,
      },

      data: {
        minimumBalance,

        transactionLimit,
      },
    });
  };

module.exports = {
  addFunds,
  deductFunds,
  getPendingTransactions,
  approveTransaction,
  rejectTransaction,
  getAlerts,
  getCentres,
  getTransactionHistory,
  exportTransactionsToCSV,
  getDashboardMetrics,
  updateCentreConfig,
};