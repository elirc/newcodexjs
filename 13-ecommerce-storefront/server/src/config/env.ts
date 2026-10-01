import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4113),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5175"),
  DEMO_USER_ID: z.coerce.number().default(2),
  DEMO_SESSION_ID: z.string().default("guest-demo-session"),
});

/** Validates environment variables at startup. */
export const env = envSchema.parse(process.env);
