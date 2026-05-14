const asyncHandler = require(
  "../utils/asyncHandler"
);

const adminService = require(
  "../services/admin.service"
);

const createAccount = asyncHandler(
  async (req, res) => {
    const account =
      await adminService.createAccount(
        req.validatedData
      );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  }
);

const createCategory = asyncHandler(
  async (req, res) => {
    const category =
      await adminService.createCategory(
        req.validatedData.name
      );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }
);
const getDashboardMetrics =
  asyncHandler(async (req, res) => {
    const metrics =
      await adminService.getDashboardMetrics();

    return res.status(200).json({
      success: true,
      message:
        "Dashboard metrics fetched successfully",

      data: metrics,
    });
  });

module.exports = {
  createAccount,
  createCategory,
  getDashboardMetrics,
};