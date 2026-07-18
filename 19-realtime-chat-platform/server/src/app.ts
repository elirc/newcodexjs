import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { db } from "./config/db";
import { env } from "./config/env";
import { requestContext } from "./middleware/requestContext";
import routes from "./routes/routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(requestContext);
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :req[x-request-id]"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ success: true, data: { service: "19-realtime-chat-platform", status: "ok" } }));
app.get("/ready", async (_req, res, next) => {
  try {
    await db.raw("select 1 as ready");
    res.json({ success: true, data: { service: "19-realtime-chat-platform", database: "ready" } });
  } catch (error) {
    next(error);
  }
});

app.use("/api/conversations", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
