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



const ROLES = require(
  "../constants/roles"
);

router.use(authMiddleware);

router.use(
  roleMiddleware(ROLES.ADMIN)
);

/*
|--------------------------------------------------------------------------
| Get Dashboard Metrics 
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  adminController.getDashboardMetrics
);

/*
|--------------------------------------------------------------------------
| Get Accounts
|--------------------------------------------------------------------------
*/

router.get(
  "/accounts",
  adminController.getAccounts
);

/*
|--------------------------------------------------------------------------
| Creating different types of Accounts
|--------------------------------------------------------------------------
*/

const {
  createAdminSchema,
  createAccountantSchema,
  createCentreSchema,
  createCategorySchema,
  resetPasswordSchema,
} = require(
  "../validators/admin.validator"
);

router.post(
  "/admins",
  validationMiddleware(
    createAdminSchema
  ),
  adminController.createAdmin
);

router.post(
  "/accountants",
  validationMiddleware(
    createAccountantSchema
  ),
  adminController.createAccountant
);

router.post(
  "/centres",
  validationMiddleware(
    createCentreSchema
  ),
  adminController.createCentre
);

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/
router.patch(
  "/accounts/:accountId/reset-password",

  validationMiddleware(
    resetPasswordSchema
  ),

  adminController.resetPassword
);



/*
|--------------------------------------------------------------------------
| create Categories
|--------------------------------------------------------------------------
*/

router.post(
  "/categories",

  validationMiddleware(
    createCategorySchema
  ),

  adminController.createCategory
);

router.get(
  "/categories",
  adminController.getCategories
);

router.patch(
  "/categories/:categoryId/archive",

  adminController.archiveCategory
);

/*
|--------------------------------------------------------------------------
| Get Wallet Ledger
|--------------------------------------------------------------------------
*/
router.get(
  '/wallet-ledgers',  
  adminController.getWalletLedgers
);

module.exports = router;