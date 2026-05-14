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

        billImageUrl: req.body.billImageUrl,
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

const uploadFile = require(
  "../utils/uploadFile"
);
const AppError = require("../utils/AppError");

const uploadBill = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new AppErrorError("File is required");
    }

    const transaction =
      await prisma.transaction.findUnique({
        where: {
          id: req.params.transactionId,
        },

        include: {
          centre: true,
        },
      });

    if (!transaction) {
      throw new AppError(
        "Transaction not found"
      );
    }

    if (
      transaction.centre.accountId !==
      req.user.id
    ) {
      throw new AppError(
        "Unauthorized transaction access"
      );
    }

    if (transaction.status !== "APPROVED_PENDING_BILL") {
        throw new Error("Bill upload not allowed for this transaction");
    }

    const imageUrl = await uploadFile(
      req.file
    );

    const updatedTransaction =
      await prisma.transaction.update({
        where: {
          id: transaction.id,
        },

        data: {
          billImageUrl: imageUrl,

          status:
            "APPROVED_COMPLETED",
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Bill uploaded successfully",

      data: updatedTransaction,
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

module.exports = {
  createTransaction,
  uploadBill,
  getDashboardMetrics,
};