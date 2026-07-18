import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4215),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5175"),
  PROXY_TIMEOUT_MS: z.coerce.number().int().positive().default(20000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  proxyTimeoutMs: parsed.data.PROXY_TIMEOUT_MS
};
