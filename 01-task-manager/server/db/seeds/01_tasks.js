/**
 * Converts a Date to YYYY-MM-DD because the seed targets a PostgreSQL date column.
 *
 * @param {Date} date - Date object to format.
 * @returns {string} Date formatted as YYYY-MM-DD.
 */
function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns a date string offset from today so overdue, today, and future examples stay current.
 *
 * @param {number} days - Number of days to offset from today.
 * @returns {string} Date formatted as YYYY-MM-DD.
 */
function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return toDateOnly(date);
}

/**
 * Builds sample tasks across statuses, priorities, and due-date states for the learning UI.
 *
 * @returns {object[]} Seed task rows.
 */
function buildTasks() {
  const completedAt = new Date();

  return [
    {
      title: 'Pay electricity bill',
      description: 'Confirm autopay failed before paying manually.',
      priority: 'high',
      status: 'todo',
      due_date: addDays(-3),
      completed_at: null
    },
    {
      title: 'Draft weekly planning notes',
      description: 'Capture wins, blockers, and next actions.',
      priority: 'medium',
      status: 'in_progress',
      due_date: addDays(-1),
      completed_at: null
    },
    {
      title: 'Return library book',
      description: 'Use the after-hours drop box.',
      priority: 'low',
      status: 'todo',
      due_date: addDays(-7),
      completed_at: null
    },
    {
      title: 'Buy groceries',
      description: 'Restock lunches and pantry basics.',
      priority: 'medium',
      status: 'todo',
      due_date: addDays(0),
      completed_at: null
    },
    {
      title: 'Prepare demo checklist',
      description: 'Make sure the sample data and talking points are ready.',
      priority: 'high',
      status: 'in_progress',
      due_date: addDays(0),
      completed_at: null
    },
    {
      title: 'Schedule dentist appointment',
      description: 'Find a morning slot next week.',
      priority: 'high',
      status: 'todo',
      due_date: addDays(1),
      completed_at: null
    },
    {
      title: 'Clean desk',
      description: 'Clear cables, notebooks, and old receipts.',
      priority: 'low',
      status: 'in_progress',
      due_date: addDays(3),
      completed_at: null
    },
    {
      title: 'Submit reimbursement form',
      description: 'Attach meal and transit receipts.',
      priority: 'medium',
      status: 'done',
      due_date: addDays(5),
      completed_at: completedAt
    },
    {
      title: 'Book weekend hike',
      description: 'Check weather before choosing the trail.',
      priority: 'medium',
      status: 'todo',
      due_date: addDays(14),
      completed_at: null
    },
    {
      title: 'Archive old project notes',
      description: 'Move finished project notes into the archive folder.',
      priority: 'high',
      status: 'done',
      due_date: null,
      completed_at: completedAt
    },
    {
      title: 'Read PostgreSQL indexing article',
      description: 'Focus on practical examples for small tables.',
      priority: 'medium',
      status: 'in_progress',
      due_date: null,
      completed_at: null
    },
    {
      title: 'Water houseplants',
      description: null,
      priority: 'low',
      status: 'done',
      due_date: null,
      completed_at: completedAt
    }
  ];
}

/**
 * Replaces existing sample tasks with 12 representative records for local development.
 *
 * @param {object} knex - Knex instance supplied by the seed runner.
 * @returns {Promise<void>} Resolves when seed data has been inserted.
 */
async function seed(knex) {
  await knex.raw('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE');
  await knex('tasks').insert(buildTasks());
}

module.exports = {
  seed
};
