const jwt = require("jsonwebtoken");

const prisma = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    const account = await prisma.account.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    req.user = account;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;