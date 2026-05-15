const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const roleMiddleware = require(
  "../middleware/role.middleware"
);

const validationMiddleware = require(
  "../middleware/validation.middleware"
);

const adminController = require(
  "../controllers/admin.controller"
);

const {
  createAccountSchema,
  createCentreSchema,
  createCategorySchema,
  resetPasswordSchema,
} = require(
  "../validators/admin.validator"
);

const ROLES = require(
  "../constants/roles"
);

router.use(authMiddleware);

router.use(
  roleMiddleware(ROLES.ADMIN)
);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  adminController.getDashboardMetrics
);

/*
|--------------------------------------------------------------------------
| Accounts
|--------------------------------------------------------------------------
*/

router.get(
  "/accounts",
  adminController.getAccounts
);

router.post(
  "/accounts",

  validationMiddleware(
    createAccountSchema
  ),

  adminController.createAccount
);

router.patch(
  "/accounts/:accountId/reset-password",

  validationMiddleware(
    resetPasswordSchema
  ),

  adminController.resetPassword
);

/*
|--------------------------------------------------------------------------
| Centres
|--------------------------------------------------------------------------
*/

router.post(
  "/centres",

  validationMiddleware(
    createCentreSchema
  ),

  adminController.createCentre
);

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

router.post(
  "/categories",

  validationMiddleware(
    createCategorySchema
  ),

  adminController.createCategory
);

module.exports = router;