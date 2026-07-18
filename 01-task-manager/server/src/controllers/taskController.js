const taskService = require('../services/taskService');
const { sendSuccess } = require('../utils/response');

/**
 * Handles task list requests by passing query parameters to the service layer.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with tasks.
 */
async function listTasks(req, res) {
  const tasks = await taskService.listTasks(req.query);

  return sendSuccess(res, tasks);
}

/**
 * Handles task stats requests while keeping aggregation details in the service layer.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with task counts.
 */
async function getTaskStats(req, res) {
  const stats = await taskService.getTaskStats();

  return sendSuccess(res, stats);
}

/**
 * Handles a single task lookup using the id route parameter.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with a task.
 */
async function getTask(req, res) {
  const task = await taskService.getTaskById(req.params.id);

  return sendSuccess(res, task);
}

/**
 * Handles task creation and returns the created row with generated fields.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with the created task.
 */
async function createTask(req, res) {
  const task = await taskService.createTask(req.body);

  return sendSuccess(res, task, 201);
}

/**
 * Handles task updates by delegating validation and persistence to the service layer.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with the updated task.
 */
async function updateTask(req, res) {
  const task = await taskService.updateTask(req.params.id, req.body);

  return sendSuccess(res, task);
}

/**
 * Handles completion toggles without putting business rules in the route handler.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with the updated task.
 */
async function toggleTask(req, res) {
  const task = await taskService.toggleTask(req.params.id);

  return sendSuccess(res, task);
}

/**
 * Handles task deletion and returns the removed id for client-side cleanup.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<object>} JSON response with the deleted task id.
 */
async function deleteTask(req, res) {
  const task = await taskService.deleteTask(req.params.id);

  return sendSuccess(res, { id: task.id });
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  getTaskStats,
  listTasks,
  toggleTask,
  updateTask
};
