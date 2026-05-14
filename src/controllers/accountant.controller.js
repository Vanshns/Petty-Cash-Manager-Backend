const asyncHandler = require(
  "../utils/asyncHandler"
);

const accountantService = require(
  "../services/accountant.service"
);

const addFunds = asyncHandler(
  async (req, res) => {
    const result =
      await accountantService.addFunds({
        centreId: req.params.centreId,

        ...req.validatedData,

        accountantId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message: "Funds added successfully",
      data: result,
    });
  }
);

const deductFunds = asyncHandler(
  async (req, res) => {
    const result =
      await accountantService.deductFunds({
        centreId: req.params.centreId,

        ...req.validatedData,

        accountantId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message: "Funds deducted successfully",
      data: result,
    });
  }
);

const getPendingTransactions =
  asyncHandler(async (req, res) => {
    const transactions =
      await accountantService.getPendingTransactions();

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  });

const approveTransaction =
  asyncHandler(async (req, res) => {
    const transaction =
      await accountantService.approveTransaction({
        transactionId:
          req.params.transactionId,

        accountantId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message:
        "Transaction approved successfully",

      data: transaction,
    });
  });



const rejectTransaction =
  asyncHandler(async (req, res) => {
    const transaction =
      await accountantService.rejectTransaction({
        transactionId:
          req.params.transactionId,

        rejectionReason:
          req.validatedData
            .rejectionReason,

        accountantId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message:
        "Transaction rejected successfully",

      data: transaction,
    });
  });

const getAlerts = asyncHandler(
  async (req, res) => {
    const alerts =
      await accountantService.getAlerts();

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  }
);

const getCentres = asyncHandler(
  async (req, res) => {
    const centres =
      await accountantService.getCentres();

    return res.status(200).json({
      success: true,
      data: centres,
    });
  }
);

const getTransactionHistory =
  asyncHandler(async (req, res) => {
    const transactions =
      await accountantService.getTransactionHistory(
        req.validatedQuery
      );

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  });

  const { generateCSV } = require(
  "../utils/csv"
);

const exportTransactions =
  asyncHandler(async (req, res) => {
    const transactions =
      await accountantService.exportTransactionsToCSV(
        req.validatedQuery
      );

    const csv =
      generateCSV(transactions);

    const startDate =
      req.validatedQuery.startDate ||
      "all";

    const endDate =
      req.validatedQuery.endDate ||
      "all";

    const fileName =
      `transactions_${startDate}_${endDate}.csv`;

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment(fileName);

    return res.send(csv);
  });

  const getDashboardMetrics =
  asyncHandler(async (req, res) => {
    const metrics =
      await accountantService.getDashboardMetrics();

    return res.status(200).json({
      success: true,
      message:
        "Dashboard metrics fetched successfully",

      data: metrics,
    });
  });

module.exports = {
  addFunds,
  deductFunds,
  getPendingTransactions,
  approveTransaction,
  rejectTransaction,
  getAlerts,
  getCentres,
  getTransactionHistory,
  exportTransactions,
  getDashboardMetrics,
};