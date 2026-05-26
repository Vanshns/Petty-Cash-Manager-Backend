const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());


// Auth Routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Admin Routes
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

// Accountant Routes
const accountantRoutes = require("./routes/accountant.routes");
app.use("/api/accountant", accountantRoutes);

// Centre Routes
const centreRoutes = require("./routes/centre.routes");
app.use("/api/centre", centreRoutes);

const categoryRoutes = require("./routes/category.routes");
app.use("/api/categories",categoryRoutes);

const deviceRoutes = require("./routes/device.routes");
app.use("/api/devices", deviceRoutes);

app.use(errorMiddleware);

module.exports = app;