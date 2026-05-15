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
  return prisma.$transaction(async (tx) => {
    const centre = await tx.centre.findUnique({
      where: {
        id: centreId,
      },
    });

    if (!centre) {
      throw new Error("Centre not found");
    }

    if (Number(centre.balance) < amount) {
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
            decrement: amount,
          },
        },
      });

    await tx.walletLedger.create({
      data: {
        centreId,

        amount,

        type: "DEBIT",

        note,

        createdById: accountantId,
      },
    });

    return updatedCentre;
  });
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

const approveTransaction = async ({
  transactionId,
  accountantId,
}) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await tx.transaction.findUnique({
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
      transaction.status !==
      "PENDING_APPROVAL"
    ) {
      throw new Error(
        "Transaction is not pending approval"
      );
    }

    if (
    Number(updatedCentre.balance) <
    Number(updatedCentre.minimumBalance)
    ) {
    const existingAlert =
        await tx.alert.findFirst({
        where: {
            centreId: updatedCentre.id,

            type: "LOW_BALANCE",

            isResolved: false,
        },
        });

    if (!existingAlert) {
        await tx.alert.create({
        data: {
            centreId: updatedCentre.id,

            type: "LOW_BALANCE",

            message:
            "Centre balance below minimum threshold",
        },
        });
    }
    }

    const updatedTransaction =
      await tx.transaction.update({
        where: {
          id: transactionId,
        },

        data: {
          status:
            "APPROVED_PENDING_BILL",

          approvedById: accountantId,

          approvedAt: new Date(),
        },
      });

    const updatedCentre =
      await tx.centre.findUnique({
        where: {
          id: transaction.centre.id,
        },
      });

    if (
      Number(updatedCentre.balance) <
      Number(updatedCentre.minimumBalance)
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

    return updatedTransaction;
  });
};

// const rejectTransaction = async ({
//   transactionId,
//   rejectionReason,
//   accountantId,
// }) => {
//   const transaction =
//     await prisma.transaction.findUnique({
//       where: {
//         id: transactionId,
//       },
//     });

//   if (!transaction) {
//     throw new Error(
//       "Transaction not found"
//     );
//   }

//   if (
//     transaction.status !==
//     "PENDING_APPROVAL"
//   ) {
//     throw new Error(
//       "Transaction is not pending approval"
//     );
//   }

//   return prisma.transaction.update({
//     where: {
//       id: transactionId,
//     },

//     data: {
//       status: "REJECTED",

//       approvedById: accountantId,

//       approvedAt: new Date(),

//       rejectedReason,
//     },
//   });
// };

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

  if (!transaction) {
    throw new Error(
      "Transaction not found"
    );
  }

  if (
    transaction.status !==
    "PENDING_APPROVAL"
  ) {
    throw new Error(
      "Transaction is not pending approval"
    );
  }

  return prisma.transaction.update({
    where: {
      id: transactionId,
    },

    data: {
      status: "REJECTED",

      approvedById: accountantId,

      approvedAt: new Date(),

      rejectedReason: rejectionReason,
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
  async (filters) => {
    const transactions =
      await getTransactionHistory(filters);

    return transactions.map((t) => ({
      id: t.id,

      centre: t.centre.name,

      amount: t.amount,

      status: t.status,

      category: t.category.name,

      approvedBy:
        t.approvedBy?.username || "",

      createdAt: t.createdAt,

      approvedAt: t.approvedAt,

      description: t.description,
    }));
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