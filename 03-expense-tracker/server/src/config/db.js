const knex = require("knex");
const knexConfig = require("../../knexfile");
const env = require("./env");

module.exports = knex(knexConfig[env.nodeEnv] || knexConfig.development);
