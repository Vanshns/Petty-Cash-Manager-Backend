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
  validationMiddleware(
    createTransactionSchema
  ),
  centreController.createTransaction
);

const upload = require(
  "../middleware/upload.middleware"
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

module.exports = router;