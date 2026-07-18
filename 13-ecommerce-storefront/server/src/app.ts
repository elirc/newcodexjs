import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errors.js";
import { storeRouter } from "./routes/storeRoutes.js";

/** Builds the Express app for the storefront API. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api", storeRouter);
  app.use(errorMiddleware);
  return app;
}

