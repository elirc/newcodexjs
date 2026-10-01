import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log("Learning Management System API listening on port " + env.port);
});
