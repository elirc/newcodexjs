import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/routes.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/errorMiddleware.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
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
    data: { service: "09-job-application-tracker", status: "ok" },
  }),
);
app.use("/api/applications", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
export default app;
