import { env } from "./src/config/env";
const config = {
    development: {
        client: "pg",
        connection: env.database,
        migrations: { directory: "./db/migrations", extension: "ts" },
        seeds: { directory: "./db/seeds", extension: "ts" }
    }
};
export default config;
