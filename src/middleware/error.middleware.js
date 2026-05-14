const logger = require("../config/logger");

const errorMiddleware = (err, req, res, next) => {
  logger.error(err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorMiddleware;