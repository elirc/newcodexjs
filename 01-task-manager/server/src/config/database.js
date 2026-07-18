const knex = require('knex');
const { env } = require('./env');

/**
 * Creates a Knex PostgreSQL connection so the database dependency is configured in one place.
 *
 * @param {object} databaseConfig - PostgreSQL connection configuration.
 * @returns {object} Configured Knex instance.
 */
function createDatabaseConnection(databaseConfig) {
  return knex({
    client: 'pg',
    connection: databaseConfig,
    pool: {
      min: 0,
      max: 10
    }
  });
}

const db = createDatabaseConnection(env.database);

module.exports = {
  createDatabaseConnection,
  db
};
