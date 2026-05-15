const asyncHandler = require(
  "../utils/asyncHandler"
);

const adminService = require(
  "../services/admin.service"
);

/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

const createAdmin =
  asyncHandler(
    async (req, res) => {
      const admin =
        await adminService.createAdmin(
          req.validatedData
        );

      return res.status(201).json({
        success: true,

        message:
          "Admin created successfully",

        data: admin,
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Create Accountant
|--------------------------------------------------------------------------
*/

const createAccountant =
  asyncHandler(
    async (req, res) => {
      const accountant =
        await adminService.createAccountant(
          req.validatedData
        );

      return res.status(201).json({
        success: true,

        message:
          "Accountant created successfully",

        data: accountant,
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Create Centre
|--------------------------------------------------------------------------
*/

const createCentre =
  asyncHandler(
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

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

const createCategory =
  asyncHandler(
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

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

const resetPassword =
  asyncHandler(
    async (req, res) => {
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
    }
  );

/*
|--------------------------------------------------------------------------
| Dashboard Metrics
|--------------------------------------------------------------------------
*/

const getDashboardMetrics =
  asyncHandler(
    async (req, res) => {
      const metrics =
        await adminService.getDashboardMetrics();

      return res.status(200).json({
        success: true,

        message:
          "Dashboard metrics fetched successfully",

        data: metrics,
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Accounts
|--------------------------------------------------------------------------
*/

const getAccounts =
  asyncHandler(
    async (req, res) => {
      const accounts =
        await adminService.getAccounts();

      return res.status(200).json({
        success: true,

        message:
          "Accounts fetched successfully",

        data: accounts,
      });
    }
  );

const getCategories =
  asyncHandler(
    async (req, res) => {
      const categories =
        await adminService.getCategories();

      return res.status(200).json({
        success: true,

        message:
          "Categories fetched successfully",

        data: categories,
      });
    }
  );

module.exports = {
  createAdmin,

  createAccountant,

  createCentre,

  createCategory,

  resetPassword,

  getDashboardMetrics,

  getAccounts,

  getCategories,
};