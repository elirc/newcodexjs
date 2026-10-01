import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { db } from "./config/db.js";
import { env } from "./config/env.js";
import { requestContext } from "./middleware/requestContext.js";
import routes from "./routes/routes.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/errorMiddleware.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(requestContext);
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :req[x-request-id]",
  ),
);
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
  )
    return res
      .status(400)
      .json({ success: false, error: "Send a JSON object." });
  next();
});

app.get("/health", (_req, res) =>
  res.json({
    success: true,
    data: { service: "20-marketplace-platform", status: "ok" },
  }),
);
app.get("/ready", async (_req, res, next) => {
  try {
    await db.raw("select 1 as ready");
    res.json({
      success: true,
      data: { service: "20-marketplace-platform", database: "ready" },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/listings", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
