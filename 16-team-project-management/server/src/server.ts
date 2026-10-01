import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log("Team Project Management API listening on port " + env.port);
});
