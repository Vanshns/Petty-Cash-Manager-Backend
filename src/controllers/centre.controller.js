const asyncHandler = require(
  "../utils/asyncHandler"
);

const centreService = require(
  "../services/centre.service"
);

const createTransaction = asyncHandler(
  async (req, res) => {
    const transaction =
      await centreService.createTransaction({
        accountId: req.user.id,

        ...req.validatedData,

        file: req.file,
    });

    return res.status(201).json({
      success: true,
      message:
        "Transaction created successfully",
      data: transaction,
    });
  }
);

const prisma = require("../config/db");


const AppError = require("../utils/AppError");

const uploadBill = asyncHandler(
  async (req, res) => {
    const transaction =
      await centreService.uploadBill({
        transactionId:
          req.params.transactionId,

        accountId:
          req.user.id,

        file: req.file,
      });

    return res.status(200).json({
      success: true,

      message:
        "Bill uploaded successfully",

      data: transaction,
    });
  }
);

const getDashboardMetrics =
  asyncHandler(async (req, res) => {
    const metrics =
      await centreService.getDashboardMetrics(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Dashboard metrics fetched successfully",

      data: metrics,
    });
  });

  const getTransactions =
  asyncHandler(async (req, res) => {
    const transactions =
      await centreService.getTransactions(
        req.user.id
      );

    return res.status(200).json({
      success: true,

      message:
        "Transactions fetched successfully",

      data: transactions,
    });
  });

module.exports = {
  createTransaction,
  uploadBill,
  getDashboardMetrics,
  getTransactions,
};