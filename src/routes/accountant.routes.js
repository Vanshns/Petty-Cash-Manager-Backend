const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const roleMiddleware = require(
  "../middleware/role.middleware"
);


const ROLES = require("../constants/roles");

router.use(authMiddleware);

router.use(roleMiddleware(ROLES.ACCOUNTANT));

const accountantController = require(
  "../controllers/accountant.controller"
);

const validationMiddleware = require(
  "../middleware/validation.middleware"
);

const {
  updateBalanceSchema,
} = require("../validators/accountant.validator");

const {
  historyQuerySchema,
} = require("../validators/accountant.validator");

const {
  updateCentreConfigSchema,
} = require(
  "../validators/accountant.validator"
);

router.post(
  "/centres/:centreId/add-funds",
  validationMiddleware(updateBalanceSchema),
  accountantController.addFunds
);

router.post(
  "/centres/:centreId/deduct-funds",
  validationMiddleware(updateBalanceSchema),
  accountantController.deductFunds
);

const {
  approveRejectSchema,
} = require(
  "../validators/accountant.validator"
);
router.get(
  "/transactions/pending",
  accountantController.getPendingTransactions
);

router.post(
  "/transactions/:transactionId/approve",
  accountantController.approveTransaction
);

router.post(
  "/transactions/:transactionId/reject",
  validationMiddleware(
    approveRejectSchema
  ),
  accountantController.rejectTransaction
);

router.get(
  "/alerts",
  accountantController.getAlerts
);

router.get(
  "/centres",
  accountantController.getCentres
);
const queryValidationMiddleware =
  require(
    "../middleware/queryValidation.middleware"
);
router.get(
  "/transactions/history",
  queryValidationMiddleware(
    historyQuerySchema
  ),
  accountantController.getTransactionHistory
);

router.get(
  "/transactions/export",
  queryValidationMiddleware(
    historyQuerySchema
  ),
  accountantController.exportTransactions
);

router.get(
  "/dashboard",
  accountantController.getDashboardMetrics
);

router.patch(
  "/centres/:centreId",

  validationMiddleware(
    updateCentreConfigSchema
  ),

  accountantController.updateCentreConfig
);

module.exports = router;