import type { Knex } from 'knex';
import { env } from './src/config/env.js';

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: env.databaseUrl,
    migrations: { directory: './db/migrations', extension: 'ts' },
    seeds: { directory: './db/seeds', extension: 'ts' }
  },
  production: {
    client: 'pg',
    connection: env.databaseUrl,
    migrations: { directory: './db/migrations', extension: 'ts' },
    seeds: { directory: './db/seeds', extension: 'ts' },
    pool: { min: 2, max: 10 }
  }
};

export default config;
