export const TASK_STATUSES = {
  todo: "todo",
  inProgress: "in_progress",
  done: "done",
};

export const TASK_PRIORITIES = {
  low: "low",
  medium: "medium",
  high: "high",
};

export const STATUS_OPTIONS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUS_OPTIONS,
];

export const PRIORITY_FILTER_OPTIONS = [
  { value: "all", label: "All priorities" },
  ...PRIORITY_OPTIONS,
];

export const SORT_OPTIONS = [
  { value: "due_date", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created date" },
];

const PRIORITY_RANK = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Converts API task field aliases into the client shape.
 *
 * @param {object} task - Task from API or optimistic update.
 * @returns {object} Normalized task.
 */
export function normalizeTask(task) {
  return {
    ...task,
    due_date: task.due_date ?? task.dueDate ?? null,
    completed_at: task.completed_at ?? task.completedAt ?? null,
    created_at: task.created_at ?? task.createdAt ?? new Date().toISOString(),
    updated_at: task.updated_at ?? task.updatedAt ?? null,
    priority: task.priority || TASK_PRIORITIES.medium,
    status: task.status || TASK_STATUSES.todo,
  };
}

/**
 * Prepares form values for the task API.
 *
 * @param {object} values - Raw form values.
 * @returns {object} API payload.
 */
export function buildTaskPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    status: values.status,
    due_date: values.due_date || null,
  };
}

/**
 * Parses a date-like value as a local date.
 *
 * @param {string | null | undefined} value - Date value from the task.
 * @returns {Date | null} Parsed date.
 */
export function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Returns today's local date at midnight for date-only comparisons.
 *
 * @returns {Date} Local start of today.
 */
export function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Checks whether a date input is strictly in the future.
 *
 * @param {string | null | undefined} value - Date input value.
 * @returns {boolean} Whether the date is after today.
 */
export function isFutureDate(value) {
  const date = parseDateOnly(value);

  if (!date) {
    return true;
  }

  return date > getTodayStart();
}

/**
 * Determines whether a task is completed.
 *
 * @param {object} task - Task to inspect.
 * @returns {boolean} Whether the task is done.
 */
export function isTaskComplete(task) {
  return task.status === TASK_STATUSES.done || Boolean(task.completed_at);
}

/**
 * Determines whether a task due date has passed while unfinished.
 *
 * @param {object} task - Task to inspect.
 * @returns {boolean} Whether the task is overdue.
 */
export function isOverdue(task) {
  const dueDate = parseDateOnly(task.due_date);

  if (!dueDate || isTaskComplete(task)) {
    return false;
  }

  return dueDate < getTodayStart();
}

/**
 * Formats a task due date for compact task cards.
 *
 * @param {string | null | undefined} value - Task due date.
 * @returns {string} Human-readable due date.
 */
export function formatDueDate(value) {
  const date = parseDateOnly(value);

  if (!date) {
    return "No due date";
  }

  const today = getTodayStart();
  const dayOffset = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (dayOffset === 0) {
    return "Today";
  }

  if (dayOffset === 1) {
    return "Tomorrow";
  }

  if (dayOffset === -1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

/**
 * Formats an API timestamp for secondary card metadata.
 *
 * @param {string | null | undefined} value - Timestamp value.
 * @returns {string} Human-readable created date.
 */
export function formatCreatedDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Converts a task status value to display text.
 *
 * @param {string} status - Task status value.
 * @returns {string} Display label.
 */
export function getStatusLabel(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || "Todo";
}

/**
 * Converts a task priority value to display text.
 *
 * @param {string} priority - Task priority value.
 * @returns {string} Display label.
 */
export function getPriorityLabel(priority) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority)?.label || "Medium";
}

/**
 * Converts priority to a numeric rank for sorting.
 *
 * @param {string} priority - Task priority value.
 * @returns {number} Sort rank.
 */
export function getPriorityRank(priority) {
  return PRIORITY_RANK[priority] || PRIORITY_RANK.medium;
}

/**
 * Validates task form values before sending them to the API.
 *
 * @param {object} values - Form values.
 * @returns {object} Field-level validation errors.
 */
export function validateTaskInput(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  }

  if (values.due_date && !isFutureDate(values.due_date)) {
    errors.due_date = "Due date must be in the future";
  }

  return errors;
}

/**
 * Applies the active task filters and sort order to a task collection.
 *
 * @param {object[]} tasks - Tasks to process.
 * @param {object} filters - Active filter state.
 * @returns {object[]} Filtered and sorted tasks.
 */
export function applyTaskFilters(tasks, filters) {
  const orderMultiplier = filters.order === "desc" ? -1 : 1;

  return tasks
    .filter((task) => filters.status === "all" || task.status === filters.status)
    .filter((task) => filters.priority === "all" || task.priority === filters.priority)
    .slice()
    .sort((first, second) => compareTasks(first, second, filters.sort, orderMultiplier));
}

/**
 * Compares two tasks for the requested sort field.
 *
 * @param {object} first - First task.
 * @param {object} second - Second task.
 * @param {string} sort - Sort field.
 * @param {number} orderMultiplier - Sort direction multiplier.
 * @returns {number} Sort comparison value.
 */
function compareTasks(first, second, sort, orderMultiplier) {
  if (sort === "priority") {
    return (getPriorityRank(second.priority) - getPriorityRank(first.priority)) * orderMultiplier;
  }

  if (sort === "created_at") {
    return (toTime(first.created_at) - toTime(second.created_at)) * orderMultiplier;
  }

  return compareDueDates(first.due_date, second.due_date, orderMultiplier);
}

/**
 * Compares nullable due dates with empty values last for ascending order.
 *
 * @param {string | null | undefined} firstValue - First due date.
 * @param {string | null | undefined} secondValue - Second due date.
 * @param {number} orderMultiplier - Sort direction multiplier.
 * @returns {number} Sort comparison value.
 */
function compareDueDates(firstValue, secondValue, orderMultiplier) {
  const firstDate = parseDateOnly(firstValue);
  const secondDate = parseDateOnly(secondValue);

  if (!firstDate && !secondDate) {
    return 0;
  }

  if (!firstDate) {
    return 1;
  }

  if (!secondDate) {
    return -1;
  }

  return (firstDate.getTime() - secondDate.getTime()) * orderMultiplier;
}

/**
 * Converts a timestamp to milliseconds for sorting.
 *
 * @param {string | null | undefined} value - Timestamp value.
 * @returns {number} Milliseconds since epoch.
 */
function toTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

/**
 * Counts tasks by status for the stats bar.
 *
 * @param {object[]} tasks - Tasks to count.
 * @returns {{ todo: number, in_progress: number, done: number, total: number }} Task counts.
 */
export function calculateTaskStats(tasks) {
  return tasks.reduce(
    (stats, task) => {
      const status = task.status || TASK_STATUSES.todo;
      stats[status] = (stats[status] || 0) + 1;
      stats.total += 1;
      return stats;
    },
    { todo: 0, in_progress: 0, done: 0, total: 0 },
  );
}
