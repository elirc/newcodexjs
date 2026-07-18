import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  getTaskStats,
  listTasks,
  toggleTask as toggleTaskRequest,
  updateTask as updateTaskRequest,
} from "../../../services/tasksApi.js";
import { calculateTaskStats, normalizeTask } from "../utils/taskHelpers.js";

export const DEFAULT_TASK_FILTERS = {
  status: "all",
  priority: "all",
  sort: "due_date",
  order: "asc",
};

/**
 * Converts an unknown request failure into a readable message.
 *
 * @param {unknown} error - Error thrown by Axios or application code.
 * @returns {string} User-facing error message.
 */
function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
}

/**
 * Normalizes a collection of raw API tasks.
 *
 * @param {Array} items - Raw tasks.
 * @returns {object[]} Normalized tasks.
 */
function normalizeTasks(items) {
  return items.map((task) => normalizeTask(task));
}

/**
 * Manages task API state, mutations, filters, and derived statistics.
 *
 * @returns {object} Task state and actions for task pages.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS);
  const [remoteStats, setRemoteStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  /** Loads the complete task list from the API. */
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const items = await listTasks();
      setTasks(normalizeTasks(items));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Loads status counts from the API when that endpoint is available. */
  const fetchStats = useCallback(async () => {
    try {
      const stats = await getTaskStats();
      setRemoteStats(stats);
    } catch {
      setRemoteStats(null);
    }
  }, []);

  /** Refreshes list and aggregate data after mutations. */
  const refreshTasks = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchStats()]);
  }, [fetchStats, fetchTasks]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const stats = useMemo(() => {
    if (remoteStats) {
      const todo = Number(remoteStats.todo || 0);
      const inProgress = Number(remoteStats.in_progress || 0);
      const done = Number(remoteStats.done || 0);

      return {
        todo,
        in_progress: inProgress,
        done,
        total: Number(remoteStats.total ?? todo + inProgress + done),
      };
    }

    return calculateTaskStats(tasks);
  }, [remoteStats, tasks]);

  /** Creates a task and reloads the task collection. */
  const createTask = useCallback(
    async (payload) => {
      setIsSaving(true);
      setError("");

      try {
        await createTaskRequest(payload);
        await refreshTasks();
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refreshTasks],
  );

  /** Updates a task and reloads the task collection. */
  const updateTask = useCallback(
    async (taskId, payload) => {
      setIsSaving(true);
      setError("");

      try {
        await updateTaskRequest(taskId, payload);
        await refreshTasks();
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refreshTasks],
  );

  /** Toggles completion state for a task and reloads the task collection. */
  const toggleTask = useCallback(
    async (taskId) => {
      setError("");

      try {
        await toggleTaskRequest(taskId);
        await refreshTasks();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    },
    [refreshTasks],
  );

  /** Deletes a task and reloads the task collection. */
  const deleteTask = useCallback(
    async (taskId) => {
      setError("");

      try {
        await deleteTaskRequest(taskId);
        await refreshTasks();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    },
    [refreshTasks],
  );

  /** Applies a single filter value while preserving the rest. */
  const updateFilter = useCallback((name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }, []);

  /** Restores the default filter and sort settings. */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_TASK_FILTERS);
  }, []);

  return {
    tasks,
    stats,
    filters,
    isLoading,
    isSaving,
    error,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    updateFilter,
    resetFilters,
    refreshTasks,
  };
}
