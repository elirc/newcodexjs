import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

type Env = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  clientOrigin: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  cookieSecret: string;
};

/** Reads a required environment variable and fails fast with a clear setup error. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Parses the server environment into typed configuration used across the app. */
function loadEnv(): Env {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.SERVER_PORT ?? 4005),
    databaseUrl: required('DATABASE_URL'),
    clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5175',
    jwtAccessSecret: required('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
    cookieSecret: required('COOKIE_SECRET')
  };
}

export const env = loadEnv();
