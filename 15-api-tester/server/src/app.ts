import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "5mb" }));

app.use(morgan("dev"));
app.use(attachRequestContext);

app.get("/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api", apiRouter);
app.use(errorMiddleware);
