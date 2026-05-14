const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);
const accountantRoutes = require(
  "./routes/accountant.routes"
);
app.use("/api/accountant", accountantRoutes);
const centreRoutes = require(
  "./routes/centre.routes"
);
app.use("/api/centre", centreRoutes);

app.use(errorMiddleware);

module.exports = app;