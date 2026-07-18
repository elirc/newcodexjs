const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const expenseRoutes = require("./routes/expenseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const statsRoutes = require("./routes/statsRoutes");
const { errorHandler } = require("./middleware/errors");

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(morgan("dev"));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/stats", statsRoutes);
app.use(errorHandler);

module.exports = app;
