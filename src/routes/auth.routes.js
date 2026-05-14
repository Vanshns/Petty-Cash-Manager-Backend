const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

const validationMiddleware = require(
  "../middleware/validation.middleware"
);

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const {
  loginSchema,
} = require("../validators/auth.validator");

router.post(
  "/login",
  validationMiddleware(loginSchema),
  authController.login
);
router.get(
  "/me",
  authMiddleware,
  authController.me
);
router.post(
  "/refresh",
  authController.refreshAccessToken
);
router.post(
  "/logout",
  authController.logout
);

module.exports = router;