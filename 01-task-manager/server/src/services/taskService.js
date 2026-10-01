const taskModel = require('../models/taskModel');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { sanitizeString } = require('../utils/sanitize');

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_SORTS = ['due_date', 'priority', 'created_at'];
const VALID_ORDERS = ['asc', 'desc'];

/**
 * Checks whether an object owns a field so omitted values can be distinguished from null.
 *
 * @param {object} source - Object to inspect.
 * @param {string} key - Field name to check.
 * @returns {boolean} True when the key is present on the object itself.
 */
function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

/**
 * Converts a Date to YYYY-MM-DD so date-only validation avoids timezone drift.
 *
 * @param {Date} date - Date object to format.
 * @returns {string} Date formatted as YYYY-MM-DD.
 */
function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Validates a positive integer id so route parameters cannot reach Knex as unsafe values.
 *
 * @param {string|number} value - Raw id from the route.
 * @returns {number} Parsed positive integer id.
 * @throws {ValidationError} When the id is not a positive integer.
 */
function parseTaskId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new ValidationError('Task id must be a positive integer.');
  }

  return id;
}

/**
 * Ensures an enum-like value is within the allowed list before persistence or filtering.
 *
 * @param {string} fieldName - Request field being validated.
 * @param {string} value - Value supplied by the client.
 * @param {string[]} allowedValues - Supported values.
 * @returns {string} The original value when valid.
 * @throws {ValidationError} When the value is not supported.
 */
function validateAllowedValue(fieldName, value, allowedValues) {
  for (let index = 0; index < allowedValues.length; index += 1) {
    if (allowedValues[index] === value) {
      return value;
    }
  }

  throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}.`);
}

/**
 * Normalizes optional query filters so model code receives trusted values only.
 *
 * @param {object} query - Express query object.
 * @returns {object} Validated filters for task listing.
 */
function normalizeListFilters(query) {
  const filters = {
    status: undefined,
    priority: undefined,
    sort: 'created_at',
    order: 'desc'
  };

  if (query.status) {
    filters.status = validateAllowedValue('status', String(query.status), VALID_STATUSES);
  }

  if (query.priority) {
    filters.priority = validateAllowedValue('priority', String(query.priority), VALID_PRIORITIES);
  }

  if (query.sort) {
    const requestedSort = String(query.sort) === 'created_date' ? 'created_at' : String(query.sort);
    filters.sort = validateAllowedValue('sort', requestedSort, VALID_SORTS);
  }

  if (query.order) {
    filters.order = validateAllowedValue('order', String(query.order).toLowerCase(), VALID_ORDERS);
  }

  return filters;
}

/**
 * Validates and sanitizes a title because tasks need a meaningful required label.
 *
 * @param {unknown} value - Raw title from the request body.
 * @returns {string} Sanitized non-empty title.
 * @throws {ValidationError} When title is missing, not text, or empty after sanitizing.
 */
function normalizeTitle(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('Title is required and must be a string.');
  }

  const title = sanitizeString(value);

  if (title.length > 255) throw new ValidationError('Title must be 255 characters or fewer.');

  if (title.length === 0) {
    throw new ValidationError('Title is required.');
  }

  return title;
}

/**
 * Validates and sanitizes optional long text without forcing clients to provide it.
 *
 * @param {unknown} value - Raw description from the request body.
 * @returns {string|null} Sanitized description or null.
 * @throws {ValidationError} When description is neither text nor null, or is too long.
 */
function normalizeDescription(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ValidationError('Description must be a string.');
  }

  const description = sanitizeString(value);

  // The column is `text`, so PostgreSQL will not stop an unbounded value; the bound
  // is a product decision about what the API accepts, not a column-width match.
  if (description.length > 5000) {
    throw new ValidationError('Description must be 5000 characters or fewer.');
  }

  if (description.length === 0) {
    return null;
  }

  return description;
}

/**
 * Validates an optional due date as a future YYYY-MM-DD value before storing it in a date column.
 *
 * @param {unknown} value - Raw due date from the request body.
 * @returns {string|null} Valid future date string or null.
 * @throws {ValidationError} When the date is invalid or not in the future.
 */
function normalizeDueDate(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('Due date must use YYYY-MM-DD format.');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || toDateOnly(parsed) !== value) {
    throw new ValidationError('Due date must be a valid calendar date.');
  }

  if (value <= toDateOnly(new Date())) {
    throw new ValidationError('Due date must be in the future.');
  }

  return value;
}

/**
 * Normalizes a priority field so tasks always use the supported priority vocabulary.
 *
 * @param {unknown} value - Raw priority from the request body.
 * @returns {string} Valid priority value.
 * @throws {ValidationError} When priority is not supported.
 */
function normalizePriority(value) {
  if (value === undefined || value === null || value === '') {
    return 'medium';
  }

  if (typeof value !== 'string') {
    throw new ValidationError('Priority must be a string.');
  }

  return validateAllowedValue('priority', sanitizeString(value).toLowerCase(), VALID_PRIORITIES);
}

/**
 * Normalizes a status field so completion logic can rely on one of the known states.
 *
 * @param {unknown} value - Raw status from the request body.
 * @returns {string} Valid task status.
 * @throws {ValidationError} When status is not supported.
 */
function normalizeStatus(value) {
  if (value === undefined || value === null || value === '') {
    return 'todo';
  }

  if (typeof value !== 'string') {
    throw new ValidationError('Status must be a string.');
  }

  return validateAllowedValue('status', sanitizeString(value).toLowerCase(), VALID_STATUSES);
}

/**
 * Builds a sanitized task payload for create operations while applying default values.
 *
 * @param {object} payload - Raw request body.
 * @returns {object} Validated fields ready for insertion.
 */
function buildCreatePayload(payload) {
  const task = {
    title: normalizeTitle(payload.title),
    description: normalizeDescription(payload.description),
    priority: normalizePriority(payload.priority),
    status: normalizeStatus(payload.status),
    due_date: normalizeDueDate(payload.due_date)
  };

  task.completed_at = task.status === 'done' ? new Date() : null;

  return task;
}

/**
 * Builds a sanitized task payload for update operations without overwriting omitted fields.
 *
 * @param {object} payload - Raw request body.
 * @param {object} existingTask - Current database row used for completion timestamp rules.
 * @returns {object} Validated fields ready for update.
 */
function buildUpdatePayload(payload, existingTask) {
  const updates = {};

  if (hasOwn(payload, 'title')) {
    updates.title = normalizeTitle(payload.title);
  }

  if (hasOwn(payload, 'description')) {
    updates.description = normalizeDescription(payload.description);
  }

  if (hasOwn(payload, 'priority')) {
    updates.priority = normalizePriority(payload.priority);
  }

  if (hasOwn(payload, 'status')) {
    updates.status = normalizeStatus(payload.status);

    if (updates.status === 'done') {
      updates.completed_at = existingTask.completed_at || new Date();
    } else {
      updates.completed_at = null;
    }
  }

  if (hasOwn(payload, 'due_date')) {
    // An overdue task must remain editable when its existing date is submitted.
    const existingDate = existingTask.due_date ? toDateOnly(new Date(existingTask.due_date)) : null;
    updates.due_date = payload.due_date === existingDate ? existingDate : normalizeDueDate(payload.due_date);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('At least one task field must be provided.');
  }

  return updates;
}

/**
 * Lists tasks after validating filter and sort query parameters.
 *
 * @param {object} query - Express query object.
 * @returns {Promise<object[]>} Tasks matching the requested filters.
 */
function listTasks(query) {
  return taskModel.listTasks(normalizeListFilters(query));
}

/**
 * Fetches one task by id and turns a missing row into a consistent NotFoundError.
 *
 * @param {string|number} idValue - Raw route id.
 * @returns {Promise<object>} Found task row.
 * @throws {NotFoundError} When no task exists for the id.
 */
async function getTaskById(idValue) {
  const id = parseTaskId(idValue);
  const task = await taskModel.findTaskById(id);

  if (!task) {
    throw new NotFoundError('Task not found.');
  }

  return task;
}

/**
 * Creates a task after enforcing required title, enum values, future due date, and sanitization.
 *
 * @param {object} payload - Raw request body.
 * @returns {Promise<object>} Created task row.
 */
function createTask(payload) {
  return taskModel.createTask(buildCreatePayload(payload || {}));
}

/**
 * Updates an existing task after validating the id and supplied task fields.
 *
 * @param {string|number} idValue - Raw route id.
 * @param {object} payload - Raw request body.
 * @returns {Promise<object>} Updated task row.
 */
async function updateTask(idValue, payload) {
  const existingTask = await getTaskById(idValue);
  const updates = buildUpdatePayload(payload || {}, existingTask);

  return taskModel.updateTask(existingTask.id, updates);
}

/**
 * Toggles task completion between done and todo while maintaining completed_at.
 *
 * @param {string|number} idValue - Raw route id.
 * @returns {Promise<object>} Updated task row.
 */
async function toggleTask(idValue) {
  const existingTask = await getTaskById(idValue);
  const nextStatus = existingTask.status === 'done' ? 'todo' : 'done';
  const updates = {
    status: nextStatus,
    completed_at: nextStatus === 'done' ? new Date() : null
  };

  return taskModel.updateTask(existingTask.id, updates);
}

/**
 * Deletes an existing task after validating it exists.
 *
 * @param {string|number} idValue - Raw route id.
 * @returns {Promise<object>} Deleted task row.
 */
async function deleteTask(idValue) {
  const existingTask = await getTaskById(idValue);

  return taskModel.deleteTask(existingTask.id);
}

/**
 * Returns task counts by status with zero-filled buckets for stable frontend rendering.
 *
 * @returns {Promise<object>} Total and per-status counts.
 */
async function getTaskStats() {
  const rows = await taskModel.countTasksByStatus();
  const stats = {
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const count = Number(row.count);
    stats[row.status] = count;
    stats.total += count;
  }

  return stats;
}

module.exports = {
  createTask,
  deleteTask,
  getTaskById,
  getTaskStats,
  listTasks,
  toggleTask,
  updateTask
};
