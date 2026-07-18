import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { attachRequestContext } from "./middleware/requestContext";
import { appointmentRouter } from "./routes/appointmentRoutes";
import { providerRouter } from "./routes/providerRoutes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(morgan("dev"));
app.use(attachRequestContext);

app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api", providerRouter);
app.use("/api", appointmentRouter);
app.use(errorMiddleware);
