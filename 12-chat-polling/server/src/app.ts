import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errors.js";
import { chatRouter } from "./routes/chatRoutes.js";

/** Builds the Express app for the polling chat API. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
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
  app.use(morgan("dev"));
  app.get("/health", (_req, res) =>
    res.json({ success: true, data: { status: "ok" } }),
  );
  app.use("/api", chatRouter);
  app.use(errorMiddleware);
  return app;
}
