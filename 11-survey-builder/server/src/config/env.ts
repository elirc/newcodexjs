import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4111),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  DEMO_USER_ID: z.coerce.number().default(1)
});

/** Validates process environment once at application startup. */
export const env = envSchema.parse(process.env);

