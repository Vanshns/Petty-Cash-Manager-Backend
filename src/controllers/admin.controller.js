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

      message:
        "Account created successfully",

      data: account,
    });
  }
);

const createCentre = asyncHandler(
  async (req, res) => {
    const centre =
      await adminService.createCentre(
        req.validatedData
      );

    return res.status(201).json({
      success: true,

      message:
        "Centre created successfully",

      data: centre,
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

      message:
        "Category created successfully",

      data: category,
    });
  }
);

const resetPassword =
  asyncHandler(async (req, res) => {
    const result =
      await adminService.resetPassword({
        accountId:
          req.params.accountId,

        newPassword:
          req.validatedData
            .newPassword,
      });

    return res.status(200).json({
      success: true,

      message:
        "Password reset successfully",

      data: result,
    });
  });

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

const getAccounts =
  asyncHandler(async (req, res) => {
    const accounts =
      await adminService.getAccounts();

    return res.status(200).json({
      success: true,

      message:
        "Accounts fetched successfully",

      data: accounts,
    });
  });

module.exports = {
  createAccount,

  createCentre,

  createCategory,

  resetPassword,

  getDashboardMetrics,

  getAccounts,
};