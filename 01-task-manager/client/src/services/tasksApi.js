import { apiClient } from "./apiClient.js";

/**
 * Extracts useful data from the project's standard response envelope.
 *
 * @param {unknown} payload - Raw response payload from Axios.
 * @returns {unknown} The response data payload.
 */
function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && payload.success === false) {
    throw new Error(payload.error?.message || "Request failed");
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload;
}

/**
 * Reads an array from common list response shapes.
 *
 * @param {unknown} payload - Raw or enveloped response payload.
 * @param {string} key - Preferred collection key.
 * @returns {Array} Normalized collection.
 */
function unwrapCollection(payload, key) {
  const data = unwrapEnvelope(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data[key])) {
    return data[key];
  }

  return [];
}

/**
 * Reads a single task from common entity response shapes.
 *
 * @param {unknown} payload - Raw or enveloped response payload.
 * @returns {object | null} Normalized task object.
 */
function unwrapTask(payload) {
  const data = unwrapEnvelope(payload);

  if (data && typeof data === "object" && data.task) {
    return data.task;
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}

/**
 * Removes empty filter values before sending query params.
 *
 * @param {object} params - Potential query params.
 * @returns {object} Query params accepted by the API.
 */
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value && value !== "all"),
  );
}

/**
 * Fetches tasks from the API.
 *
 * @param {object} [params] - Optional task filters and sort options.
 * @returns {Promise<Array>} Task list.
 */
export async function listTasks(params = {}) {
  const response = await apiClient.get("/tasks", { params: cleanParams(params) });
  return unwrapCollection(response.data, "tasks");
}

/**
 * Fetches a single task by id.
 *
 * @param {number | string} taskId - Task identifier.
 * @returns {Promise<object | null>} Task data.
 */
export async function getTask(taskId) {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return unwrapTask(response.data);
}

/**
 * Creates a task through the API.
 *
 * @param {object} task - Task payload.
 * @returns {Promise<object | null>} Created task.
 */
export async function createTask(task) {
  const response = await apiClient.post("/tasks", task);
  return unwrapTask(response.data);
}

/**
 * Updates a task through the API.
 *
 * @param {number | string} taskId - Task identifier.
 * @param {object} task - Task payload.
 * @returns {Promise<object | null>} Updated task.
 */
export async function updateTask(taskId, task) {
  const response = await apiClient.put(`/tasks/${taskId}`, task);
  return unwrapTask(response.data);
}

/**
 * Toggles task completion through the API.
 *
 * @param {number | string} taskId - Task identifier.
 * @returns {Promise<object | null>} Updated task.
 */
export async function toggleTask(taskId) {
  const response = await apiClient.patch(`/tasks/${taskId}/toggle`);
  return unwrapTask(response.data);
}

/**
 * Deletes a task through the API.
 *
 * @param {number | string} taskId - Task identifier.
 * @returns {Promise<boolean>} Whether the request completed.
 */
export async function deleteTask(taskId) {
  await apiClient.delete(`/tasks/${taskId}`);
  return true;
}

/**
 * Fetches aggregate task counts from the API.
 *
 * @returns {Promise<object | null>} Task statistics.
 */
export async function getTaskStats() {
  const response = await apiClient.get("/tasks/stats");
  const data = unwrapEnvelope(response.data);

  if (data && typeof data === "object" && data.stats) {
    return data.stats;
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}
