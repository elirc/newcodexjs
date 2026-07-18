const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const contactRoutes = require("./routes/contactRoutes");
const tagRoutes = require("./routes/tagRoutes");
const { errorHandler } = require("./middleware/errors");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: "text/csv" }));

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/contacts", contactRoutes);
app.use("/api/tags", tagRoutes);
app.use(errorHandler);

module.exports = app;
