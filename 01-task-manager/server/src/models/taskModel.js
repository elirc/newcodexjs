const { db } = require('../config/database');

/**
 * Builds a base tasks query so every model function reads from the same table consistently.
 *
 * @returns {object} Knex query builder for the tasks table.
 */
function tasksTable() {
  return db('tasks');
}

/**
 * Lists tasks using already-validated filters and ordering supplied by the service layer.
 *
 * @param {object} filters - Validated status, priority, sort, and order values.
 * @returns {Promise<object[]>} Matching task rows.
 */
function listTasks(filters) {
  const query = tasksTable().select('*');

  if (filters.status) {
    query.where('status', filters.status);
  }

  if (filters.priority) {
    query.where('priority', filters.priority);
  }

  if (filters.sort === 'priority') {
    query.orderByRaw(`CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END ${filters.order}`);
  } else if (filters.sort === 'due_date') {
    query.orderByRaw(`due_date ${filters.order} NULLS LAST`);
  } else {
    query.orderBy(filters.sort, filters.order);
  }

  query.orderBy('id', 'asc');

  return query;
}

/**
 * Finds a single task by primary key for read, update, toggle, and delete workflows.
 *
 * @param {number} id - Task id to find.
 * @returns {Promise<object|undefined>} Task row when found.
 */
function findTaskById(id) {
  return tasksTable().where({ id }).first();
}

/**
 * Inserts a task row and returns the database version including generated timestamps.
 *
 * @param {object} task - Validated task fields to insert.
 * @returns {Promise<object>} Created task row.
 */
async function createTask(task) {
  const rows = await tasksTable().insert(task).returning('*');

  return rows[0];
}

/**
 * Updates a task row and returns the database version after modification.
 *
 * @param {number} id - Task id to update.
 * @param {object} updates - Validated task fields to persist.
 * @returns {Promise<object|undefined>} Updated task row when found.
 */
async function updateTask(id, updates) {
  const rows = await tasksTable()
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now()
    })
    .returning('*');

  return rows[0];
}

/**
 * Deletes a task row and returns it so services can report what was removed.
 *
 * @param {number} id - Task id to delete.
 * @returns {Promise<object|undefined>} Deleted task row when found.
 */
async function deleteTask(id) {
  const rows = await tasksTable().where({ id }).returning('*').del();

  return rows[0];
}

/**
 * Counts tasks by status so the service can shape dashboard-friendly statistics.
 *
 * @returns {Promise<object[]>} Rows with status and count fields.
 */
function countTasksByStatus() {
  return tasksTable()
    .select('status')
    .count({ count: '*' })
    .groupBy('status');
}

module.exports = {
  countTasksByStatus,
  createTask,
  deleteTask,
  findTaskById,
  listTasks,
  updateTask
};
