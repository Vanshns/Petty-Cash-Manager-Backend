const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const roleMiddleware = require(
  "../middleware/role.middleware"
);

const upload = require(
  "../middleware/upload.middleware"
);

const ROLES = require("../constants/roles");

router.use(authMiddleware);

router.use(roleMiddleware(ROLES.CENTRE));

const centreController = require(
  "../controllers/centre.controller"
);

const validationMiddleware = require(
  "../middleware/validation.middleware"
);

const {
  createTransactionSchema,
} = require("../validators/centre.validator");

router.post(
  "/transactions",

  upload.single("bill"),

  validationMiddleware(
    createTransactionSchema
  ),

  centreController.createTransaction
);


router.post(
  "/transactions/:transactionId/upload-bill",
  upload.single("bill"),
  centreController.uploadBill
);

router.get(
  "/dashboard",
  centreController.getDashboardMetrics
);

router.get(
  "/transactions",
  centreController.getTransactions
);

router.get("/profile", centreController.getCentreProfile);

// Fetch the list of items to show in the UI
router.get(
  '/transactions/pending-actions', 
  centreController.getPendingActions
);

router.post(
  '/transactions/:transactionId/upload-bill-complete',
  upload.single('bill'),
  centreController.completeTransaction
);

module.exports = router;