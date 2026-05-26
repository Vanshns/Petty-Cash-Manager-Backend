// add functionality later for uploading image when funds added or deducted

const prisma = require("../config/db");

const AppError = require(
  "../utils/AppError"
);



const notificationService = require("./notification.service");


const addFunds = async ({ centreId, amount, note, accountantId }) => {
  return prisma.$transaction(async (tx) => {
    const centre = await tx.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new Error("Centre not found");
    }

    // 1. Atomically increment the balance inside the database
    const updatedCentre = await tx.centre.update({
      where: { id: centreId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    // 2. Log the transaction item to the wallet ledger
    await tx.walletledger.create({
      data: {
        
        centreId,
        amount,
        type: "CREDIT",
        note,
        createdById: accountantId,
      },
    });

    // 3. Check if the newly updated balance meets or exceeds the minimum threshold
    const currentBalance = Number(updatedCentre.balance);
    const thresholdBalance = Number(updatedCentre.minimumBalance);

    if (currentBalance >= thresholdBalance) {
      // Resolve ALL open LOW_BALANCE alerts for this specific center
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
      console.log(`✅ LOW_BALANCE alerts resolved for Centre: ${centreId}. Balance: ₹${currentBalance}`);
    }

    return updatedCentre;
  });
};


const deductFunds = async ({ centreId, amount, note, accountantId }) => {
  return prisma.$transaction(async (tx) => {
    const centre = await tx.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new Error("Centre not found");
    }

    const currentBalanceBefore = Number(centre.balance);
    const deductionAmount = Number(amount);

    /*
    |--------------------------------------------------------------------------
    | 1. HARD BLOCK ONLY ON OVERDRAFT (Negative Balance)
    |--------------------------------------------------------------------------
    | This allows the balance to drop below the minimum threshold safety zone,
    | but prevents the center's real wallet balance from going into the negative.
    */
    if (currentBalanceBefore < deductionAmount) {
      throw new Error(`Transaction blocked: Total overdraft. Current wallet balance is ₹${currentBalanceBefore}, cannot deduct ₹${deductionAmount}.`);
    }

    // 2. Atomically decrement the balance inside the database
    const updatedCentre = await tx.centre.update({
      where: { id: centreId },
      data: {
        balance: {
          decrement: deductionAmount,
        },
      },
    });

    // 3. Log the transaction item to the wallet ledger
    await tx.walletledger.create({
      data: {
        
        centreId,
        amount: deductionAmount,
        type: "DEBIT",
        note,
        createdById: accountantId,
      },
    });

    // 4. Check if the balance dropped below the minimum threshold (Passive Warning)
    const postDeductionBalance = Number(updatedCentre.balance);
    const thresholdBalance = Number(updatedCentre.minimumBalance);

    if (postDeductionBalance < thresholdBalance) {
      // Check if there's an active, unresolved alert already out there
      const existingAlert = await tx.alert.findFirst({
        where: {
          centreId,
          type: "LOW_BALANCE",
          isResolved: false,
        },
      });

      // Only create the warning record if one isn't already active
      if (!existingAlert) {
        await tx.alert.create({
          data: {
            centreId,
            type: "LOW_BALANCE",
            message: `Warning: Centre balance (₹${postDeductionBalance.toLocaleString()}) has fallen below the minimum threshold of ₹${thresholdBalance.toLocaleString()}.`,
            isResolved: false,
          },
        });
        console.log(`⚠️ LOW_BALANCE warning generated for Centre: ${centreId}`);
      }
    }

    return updatedCentre;
  });
};

// const getPendingTransactions =
//   async () => {
//     return prisma.transaction.findMany({
//       where: {
//         status: "PENDING_APPROVAL",
//       },

//       include: {
//         centre: true,
//         category: true,
//       },

//       orderBy: {
//         createdAt: "desc",
//       },
//     });
//   };

const getPendingTransactions =
  async () => {

    const transactions =
      await prisma.transaction.findMany({
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

    return transactions.map((transaction) => ({
      ...transaction,

      // billImageUrl:
      //   transaction.billImageUrl
      //     ? `${process.env.FILE_BASE_URL}/${transaction.billImageUrl}`
      //     : null,

      billImageUrl:
          transaction.billImageUrl
            ? transaction.billImageUrl.startsWith("http")
              ? transaction.billImageUrl
              : `${process.env.FILE_BASE_URL}/${transaction.billImageUrl}`
            : null,
    }));
  };


// const approveTransaction = async ({
//   transactionId,
//   accountantId,
// }) => {
//   return prisma.$transaction(async (tx) => {
//     /*
//     |--------------------------------------------------------------------------
//     | Fetch transaction - FIXED (Removed invalid include statement)
//     |--------------------------------------------------------------------------
//     */
//     const transaction =
//       await tx.transaction.findUnique({
//         where: {
//           id: transactionId,
//         },
//         include: {
//           centre: true,
//           // ❌ REMOVED "bill: true" since billImageUrl is an absolute string value, not a relation
//         },
//       });

//     /*
//     |--------------------------------------------------------------------------
//     | Validations
//     |--------------------------------------------------------------------------
//     */
//     if (!transaction) {
//       throw new AppError(
//         "Transaction not found",
//         404
//       );
//     }

//     if (
//       transaction.status !==
//       "PENDING_APPROVAL"
//     ) {
//       throw new AppError(
//         "Transaction is not pending approval",
//         400
//       );
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Check centre balance BEFORE approval
//     |--------------------------------------------------------------------------
//     */
//     if (
//       Number(
//         transaction.centre.balance
//       ) < Number(transaction.amount)
//     ) {
//       throw new AppError(
//         "Insufficient centre balance",
//         400
//       );
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Deduct balance
//     |--------------------------------------------------------------------------
//     */
//     const updatedCentre =
//       await tx.centre.update({
//         where: {
//           id: transaction.centre.id,
//         },
//         data: {
//           balance: {
//             decrement:
//               transaction.amount,
//           },
//         },
//       });

//     /*
//     |--------------------------------------------------------------------------
//     | Approve transaction - FIXED Status Routing
//     |--------------------------------------------------------------------------
//     */
//     // Check if billImageUrl contains an existing uploaded string path
//     const finalStatus = (transaction.billImageUrl && transaction.billImageUrl.trim() !== "")
//       ? "APPROVED_COMPLETED" 
//       : "APPROVED_PENDING_BILL";

//     const updatedTransaction =
//       await tx.transaction.update({
//         where: {
//           id: transactionId,
//         },
//         data: {
//           status: finalStatus, // Applied dynamically

//           approvedById:
//             accountantId,

//           approvedAt:
//             new Date(),
//         },
//       });

//     /*
//     |--------------------------------------------------------------------------
//     | Create low balance alert
//     |--------------------------------------------------------------------------
//     */
//     if (
//       Number(updatedCentre.balance) <
//       Number(
//         updatedCentre.minimumBalance
//       )
//     ) {
//       const existingAlert =
//         await tx.alert.findFirst({
//           where: {
//             centreId:
//               updatedCentre.id,
//             type:
//               "LOW_BALANCE",
//             isResolved: false,
//           },
//         });

//       if (!existingAlert) {
//         await tx.alert.create({
//           data: {
//             centreId:
//               updatedCentre.id,
//             type:
//               "LOW_BALANCE",
//             message:
//               "Centre balance below minimum threshold",
//             isResolved: false,
//           },
//         });
//       }
//     }

//     return updatedTransaction;
//   });
// };



const approveTransaction =
  async ({
    transactionId,
    accountantId,
  }) => {

    const updatedTransaction =
      await prisma.$transaction(
        async (tx) => {

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
                centre: {
                  include: {
                    account: true,
                  },
                },
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
          | Check centre balance
          |--------------------------------------------------------------------------
          */

          if (
            Number(
              transaction.centre.balance
            ) <
            Number(transaction.amount)
          ) {
            throw new AppError(
              "Insufficient centre balance",
              400
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Deduct centre balance
          |--------------------------------------------------------------------------
          */

          const updatedCentre =
            await tx.centre.update({
              where: {
                id:
                  transaction.centre.id,
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
          | Determine final status
          |--------------------------------------------------------------------------
          */

          const finalStatus =
            (
              transaction.billImageUrl &&
              transaction.billImageUrl.trim() !==
                ""
            )
              ? "APPROVED_COMPLETED"
              : "APPROVED_PENDING_BILL";

          /*
          |--------------------------------------------------------------------------
          | Update transaction
          |--------------------------------------------------------------------------
          */

          const updatedTransaction =
            await tx.transaction.update({
              where: {
                id: transactionId,
              },

              data: {
                status: finalStatus,

                approvedById:
                  accountantId,

                approvedAt:
                  new Date(),
              },
            });

          /*
          |--------------------------------------------------------------------------
          | Low balance alert
          |--------------------------------------------------------------------------
          */

          if (
            Number(
              updatedCentre.balance
            ) <
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

          return {
            updatedTransaction,

            centreAccountId:
              transaction.centre
                .account.id,
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Send notification AFTER transaction completes
    |--------------------------------------------------------------------------
    */

    await notificationService
      .createAndSendNotification({

        accountId:
          updatedTransaction
            .centreAccountId,

        type:
          "TRANSACTION_APPROVED",

        title:
          "Transaction Approved",

        message:
          `Your transaction has been approved.`,

        metadata: {
          screen:"Transactions",
          transactionId,
        },
      });

    return updatedTransaction
      .updatedTransaction;
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

//   /*
//   |--------------------------------------------------------------------------
//   | Validations
//   |--------------------------------------------------------------------------
//   */

//   if (!transaction) {
//     throw new AppError(
//       "Transaction not found",
//       404
//     );
//   }

//   if (
//     transaction.status !==
//     "PENDING_APPROVAL"
//   ) {
//     throw new AppError(
//       "Transaction is not pending approval",
//       400
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Reject transaction
//   |--------------------------------------------------------------------------
//   */

//   return prisma.transaction.update({
//     where: {
//       id: transactionId,
//     },

//     data: {
//       status: "REJECTED",

//       approvedById:
//         accountantId,

//       approvedAt:
//         new Date(),

//       rejectionReason,
//     },
//   });
// };


const rejectTransaction =
  async ({
    transactionId,
    rejectionReason,
    accountantId,
  }) => {

    const transaction =
      await prisma.transaction.findUnique({
        where: {
          id: transactionId,
        },

        include: {
          centre: {
            include: {
              account: true,
            },
          },
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

    const updatedTransaction =
      await prisma.transaction.update({
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

    /*
    |--------------------------------------------------------------------------
    | Send notification
    |--------------------------------------------------------------------------
    */

    await notificationService
      .createAndSendNotification({

        accountId:
          transaction.centre
            .account.id,

        type:
          "TRANSACTION_REJECTED",

        title:
          "Transaction Rejected",

        message:
          `Your transaction was rejected.`,

        metadata: {
          screen:"TransactionHistory",
          transactionId,
        },
      });

    return updatedTransaction;
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

    // return prisma.transaction.findMany({
    //   where,

    //   include: {
    //     centre: true,
    //     category: true,
    //     approvedBy: true,
    //   },

    //   orderBy: {
    //     createdAt: "desc",
    //   },

    //   skip,

    //   take: limit,
    // });

    const transactions =
      await prisma.transaction.findMany({
        where,

        include: {
          centre: true,
          category: true,
          account: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,

        take: limit,
      });

    return transactions.map((transaction) => ({
      ...transaction,

      billImageUrl:
        transaction.billImageUrl
          ? `${process.env.FILE_BASE_URL}/${transaction.billImageUrl}`
          : null,
    }));
  };

  const getWalletLedgerHistory =
  async ({
    startDate,
    endDate,
    centreId,
  }) => {
    const where = {};

    if (centreId) {
      where.centreId = centreId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
    }

    if (startDate) {
      where.createdAt.gte =
        new Date(startDate);
    }

    if (endDate) {
      where.createdAt.lte =
        new Date(endDate);
    }
    console.log(Object.keys(prisma));
    return prisma.walletledger.findMany({
      where,

      include: {
        centre: true,
        createdBy: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };

  const ExcelJS = require("exceljs");

  // const exportTransactionsToCSV =
  // async (filters = {}) => {
  //   const transactions =
  //     await getTransactionHistory(
  //       filters
  //     );

  //   return transactions.map(
  //     (t) => ({
  //       id: t.id,

  //       centre:
  //         t.centre?.name || "",

  //       amount:
  //         Number(
  //           t.amount
  //         ).toFixed(2),

  //       status: t.status,

  //       category:
  //         t.category?.name ||
  //         "",

  //       approvedBy:
  //         t.approvedBy
  //           ?.username || "",

  //       createdAt:
  //         t.createdAt,

  //       approvedAt:
  //         t.approvedAt ||
  //         "",

  //       description:
  //         t.description || "",
  //     })
  //   );
  // };


const exportTransactionsWorkbook =
  async (filters = {}) => {
    // =========================================================================
    // FETCH DATASETS
    // =========================================================================

    const transactions =
      await getTransactionHistory({
        ...filters,

        // Export should fetch ALL rows
        page: 1,

        limit: 100000,
      });

    const walletLedger =
      await getWalletLedgerHistory(
        filters,
      );

    // =========================================================================
    // CREATE WORKBOOK
    // =========================================================================

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Pravaayu Petty Cash Manager";

    workbook.created =
      new Date();

    // =========================================================================
    // SHEET 1 — TRANSACTIONS
    // =========================================================================

    const transactionSheet =
      workbook.addWorksheet(
        "Transactions",
      );

    transactionSheet.columns = [
      {
        header: "Transaction ID",
        key: "id",
        width: 28,
      },

      {
        header: "Centre",
        key: "centre",
        width: 24,
      },

      {
        header: "Amount",
        key: "amount",
        width: 16,
      },

      {
        header: "Status",
        key: "status",
        width: 28,
      },

      {
        header: "Category",
        key: "category",
        width: 20,
      },

      {
        header: "Approved By",
        key: "approvedBy",
        width: 22,
      },

      {
        header: "Created At",
        key: "createdAt",
        width: 24,
      },

      {
        header: "Approved At",
        key: "approvedAt",
        width: 24,
      },

      {
        header: "Description",
        key: "description",
        width: 40,
      },
    ];

    // =========================================================================
    // HEADER STYLING
    // =========================================================================

    transactionSheet.getRow(1).font = {
      bold: true,
    };

    transactions.forEach((t) => {
      transactionSheet.addRow({
        id: t.id,

        centre:
          t.centre?.name || "",

        amount: Number(
          t.amount,
        ).toFixed(2),

        status: t.status,

        category:
          t.category?.name || "",

        approvedBy:
          t.approvedBy
            ?.username || "",

        createdAt:
          t.createdAt
            ? new Date(
                t.createdAt,
              ).toLocaleString(
                "en-IN",
              )
            : "",

        approvedAt:
          t.approvedAt
            ? new Date(
                t.approvedAt,
              ).toLocaleString(
                "en-IN",
              )
            : "",

        description:
          t.description || "",
      });
    });

    // =========================================================================
    // SHEET 2 — WALLET LEDGER
    // =========================================================================

    const ledgerSheet =
      workbook.addWorksheet(
        "Wallet Ledger",
      );

    ledgerSheet.columns = [
      {
        header: "Date",
        key: "createdAt",
        width: 24,
      },

      {
        header: "Centre",
        key: "centre",
        width: 24,
      },

      {
        header: "Type",
        key: "type",
        width: 14,
      },

      {
        header: "Amount",
        key: "amount",
        width: 16,
      },

      {
        header: "Note",
        key: "note",
        width: 40,
      },

      {
        header: "Accountant",
        key: "accountant",
        width: 24,
      },
    ];

    // =========================================================================
    // HEADER STYLING
    // =========================================================================

    ledgerSheet.getRow(1).font = {
      bold: true,
    };

    walletLedger.forEach((l) => {
      ledgerSheet.addRow({
        createdAt:
          l.createdAt
            ? new Date(
                l.createdAt,
              ).toLocaleString(
                "en-IN",
              )
            : "",

        centre:
          l.centre?.name || "",

        type: l.type,

        amount: Number(
          l.amount,
        ).toFixed(2),

        note: l.note || "",

        accountant:
          l.createdBy
            ?.username || "",
      });
    });

    // =========================================================================
    // FREEZE HEADER ROWS
    // =========================================================================

    transactionSheet.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    ledgerSheet.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    return workbook;
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

  

  const updateCentreConfig = async ({ centreId, minimumBalance, transactionLimit }) => {
  // 1. Perform the boundary update update inside Prisma
  const updatedCentre = await prisma.centre.update({
    where: { id: centreId },
    data: { 
      minimumBalance, 
      transactionLimit 
    },
  });

  // 2. Proactively run an audit check: Is the current balance ALREADY violating the new floor?
  if (Number(updatedCentre.balance) < Number(updatedCentre.minimumBalance)) {
    
    // 3. Avoid duplicate alerts: Check if an unresolved low-balance flag already exists for this centre
    const existingAlert = await prisma.alert.findFirst({
      where: {
        centreId: centreId,
        type: "LOW_BALANCE", // or whatever string literal matching your system enum
        isResolved: false,
      },
    });

    // 4. If no alert row exists yet, write it to the database immediately
    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          centreId: centreId,
          type: "LOW_BALANCE",
          message: `Centre "${updatedCentre.name}" balance (₹${Number(updatedCentre.balance).toLocaleString('en-IN')}) has dropped below the updated minimum boundary ceiling of ₹${Number(updatedCentre.minimumBalance).toLocaleString('en-IN')}.`,
          isResolved: false,
        },
      });
    }
  } else {
    // OPTIONAL: If they adjusted the floor downwards and the center is now safe,
    // automatically resolve any existing lingering low-balance flags.
    await prisma.alert.updateMany({
      where: {
        centreId: centreId,
        type: "LOW_BALANCE",
        isResolved: false,
      },
      data: {
        isResolved: true,
      },
    });
  }

  return updatedCentre;
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
  // exportTransactionsToCSV,
  exportTransactionsWorkbook,
  getDashboardMetrics,
  updateCentreConfig,
};