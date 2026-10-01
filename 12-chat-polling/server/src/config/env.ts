import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4112),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5174"),
  DEMO_USER_ID: z.coerce.number().default(1),
});

/** Validates and exports environment configuration. */
export const env = envSchema.parse(process.env);
