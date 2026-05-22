require("dotenv").config();

const app = require("./app");
const logger = require("./config/logger");

const prisma = require("./config/db");

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   logger.info(`Server running on port ${PORT}`);
// });

app.listen(PORT, "0.0.0.0", async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    logger.info("Database connected successfully!");
  } catch (error) {
    logger.error("Database connection failed:", error);
  }
});