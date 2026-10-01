import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ success: true, data: { service: "06-bookmark-manager", status: "ok" } }));
app.use("/api/bookmarks", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
export default app;
