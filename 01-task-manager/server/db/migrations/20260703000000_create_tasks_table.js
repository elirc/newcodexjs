/**
 * Defines the tasks table columns exactly as the Project 1 schema requires.
 *
 * @param {object} table - Knex table builder.
 * @param {object} knex - Knex instance used for database defaults.
 * @returns {void}
 */
function addTaskColumns(table, knex) {
  table.increments('id').primary();
  table.string('title', 255).notNullable();
  table.text('description').nullable();
  table.specificType('priority', 'varchar(20)').notNullable().defaultTo('medium');
  table.specificType('status', 'varchar(20)').notNullable().defaultTo('todo');
  table.date('due_date').nullable();
  table.timestamp('completed_at').nullable();
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
}

/**
 * Creates a table callback with access to Knex helpers for portable timestamp defaults.
 *
 * @param {object} knex - Knex instance supplied by the migration runner.
 * @returns {Function} Table-builder callback for creating the tasks table.
 */
function createTasksTableWith(knex) {
  /**
   * Applies task columns to the table builder during schema creation.
   *
   * @param {object} table - Knex table builder.
   * @returns {void}
   */
  return function createTasksTable(table) {
    addTaskColumns(table, knex);
  };
}

/**
 * Creates the tasks table, enum-like check constraints, and indexes for common filters.
 *
 * @param {object} knex - Knex instance supplied by the migration runner.
 * @returns {Promise<void>} Resolves when the schema has been created.
 */
async function up(knex) {
  await knex.schema.createTable('tasks', createTasksTableWith(knex));
  await knex.schema.raw("ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'))");
  await knex.schema.raw("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done'))");
  await knex.schema.alterTable('tasks', addTaskIndexes);
}

/**
 * Adds indexes for the filters and sorts used by the task list endpoint.
 *
 * @param {object} table - Knex table builder.
 * @returns {void}
 */
function addTaskIndexes(table) {
  table.index(['status'], 'tasks_status_idx');
  table.index(['priority'], 'tasks_priority_idx');
  table.index(['due_date'], 'tasks_due_date_idx');
  table.index(['created_at'], 'tasks_created_at_idx');
}

/**
 * Drops the tasks table so the migration is fully reversible.
 *
 * @param {object} knex - Knex instance supplied by the migration runner.
 * @returns {Promise<void>} Resolves when the schema has been removed.
 */
function down(knex) {
  return knex.schema.dropTableIfExists('tasks');
}

module.exports = {
  down,
  up
};
