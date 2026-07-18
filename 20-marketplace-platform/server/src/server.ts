import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log("Multi-Vendor Marketplace API listening on port " + env.port);
});
