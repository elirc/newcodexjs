const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Reads an environment variable with an optional fallback so configuration stays centralized.
 *
 * @param {string} name - Name of the environment variable to read.
 * @param {string|undefined} fallback - Value to use when the variable is not defined.
 * @returns {string|undefined} The configured value or fallback.
 */
function readEnv(name, fallback) {
  if (process.env[name] === undefined || process.env[name] === '') {
    return fallback;
  }

  return process.env[name];
}

/**
 * Requires a non-empty environment variable so startup fails before serving invalid configuration.
 *
 * @param {string} name - Name of the required environment variable.
 * @returns {string} The configured value.
 * @throws {Error} When the value is missing.
 */
function requireEnv(name) {
  const value = readEnv(name);

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Parses an integer environment variable so ports and numeric settings are validated early.
 *
 * @param {string} name - Name of the variable, used in error messages.
 * @param {string|undefined} value - Raw environment value.
 * @returns {number} Parsed integer value.
 * @throws {Error} When the value is not an integer.
 */
function parseInteger(name, value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer.`);
  }

  return parsed;
}

/**
 * Parses a boolean-style environment value so optional flags can be expressed in .env files.
 *
 * @param {string|undefined} value - Raw environment value.
 * @returns {boolean} True only when the value is the string "true".
 */
function parseBoolean(value) {
  return value === 'true';
}

/**
 * Builds the PostgreSQL connection object shared by the app and Knex CLI.
 *
 * @returns {object} Knex-compatible PostgreSQL connection configuration.
 */
function buildDatabaseConfig() {
  const sslEnabled = parseBoolean(readEnv('DB_SSL', 'false'));
  const databaseConfig = {
    host: readEnv('DB_HOST', 'localhost'),
    port: parseInteger('DB_PORT', readEnv('DB_PORT', '5432')),
    database: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD')
  };

  if (sslEnabled) {
    databaseConfig.ssl = { rejectUnauthorized: false };
  }

  return databaseConfig;
}

/**
 * Validates and returns all runtime configuration so the rest of the app can trust it.
 *
 * @returns {object} Normalized application configuration.
 */
function buildEnv() {
  const nodeEnv = readEnv('NODE_ENV', 'development');

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: parseInteger('PORT', readEnv('PORT', '4000')),
    clientOrigin: readEnv('CLIENT_ORIGIN', 'http://localhost:5173'),
    database: buildDatabaseConfig()
  };
}

const env = buildEnv();

module.exports = {
  buildEnv,
  env
};
