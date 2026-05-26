const asyncHandler = require("../utils/asyncHandler");
const prisma =
  require("../config/db");
const registerDevice = asyncHandler(async (req, res) => {
  const { pushToken, platform } = req.body;

  const device = await prisma.device.upsert({
    where: {
      pushToken,
    },

    update: {
      accountId: req.user.id,
      platform,
      isActive: true,
    },

    create: {
      pushToken,
      accountId: req.user.id,
      platform,
      provider: "EXPO",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Device registered successfully",
    data: device,
  });
});

const unregisterDevice = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;

  await prisma.device.updateMany({
    where: {
      pushToken,
      accountId: req.user.id,
    },

    data: {
      isActive: false,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Device unregistered successfully",
  });
});

module.exports = {
  registerDevice,
  unregisterDevice,
};