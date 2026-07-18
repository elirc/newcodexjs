import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log("Team Project Management API listening on port " + env.port);
});
