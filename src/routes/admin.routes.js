const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const roleMiddleware = require(
  "../middleware/role.middleware"
);

const adminController = require(
  "../controllers/admin.controller"
);

const validationMiddleware = require(
  "../middleware/validation.middleware"
);

const {
  createAccountSchema,
  createCategorySchema,
} = require("../validators/admin.validator");

const ROLES = require("../constants/roles");

router.use(authMiddleware);

router.use(roleMiddleware(ROLES.ADMIN));

router.post(
  "/accounts",
  validationMiddleware(createAccountSchema),
  adminController.createAccount
);

router.post(
  "/categories",
  validationMiddleware(createCategorySchema),
  adminController.createCategory
);

router.get(
  "/dashboard",
  adminController.getDashboardMetrics
);

module.exports = router;