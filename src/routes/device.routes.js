const express = require("express");

const router = express.Router();

const {
  registerDevice,
  unregisterDevice,
} = require("../controllers/device.controller");

const authenticate = require("../middleware/auth.middleware");

router.post(
  "/register",
  authenticate,
  registerDevice
);

router.post(
  "/unregister",
  authenticate,
  unregisterDevice
);

module.exports = router;