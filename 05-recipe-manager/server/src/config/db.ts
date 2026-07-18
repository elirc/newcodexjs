import knex from 'knex';
import config from '../../knexfile.js';
import { env } from './env.js';

/** Creates the singleton Knex connection for model functions. */
export const db = knex(config[env.nodeEnv] ?? config.development);
