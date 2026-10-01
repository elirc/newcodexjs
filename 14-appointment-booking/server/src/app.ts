import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { appointmentRouter } from "./routes/appointmentRoutes.js";
import { providerRouter } from "./routes/providerRoutes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
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
app.use(attachRequestContext);

app.get("/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api", providerRouter);
app.use("/api", appointmentRouter);
app.use(errorMiddleware);
