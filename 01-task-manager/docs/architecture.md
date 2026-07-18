# Project 1 Architecture

This document explains the intended structure of the Personal Task Manager. It is written for learners who are seeing a full-stack CRUD app as a set of connected layers for the first time.

## Folder Structure

Target structure:

```text
01-task-manager/
  client/
    public/
    src/
      components/
        ui/
          Button.jsx
          Input.jsx
          Select.jsx
          Badge.jsx
          Modal.jsx
          EmptyState.jsx
      features/
        tasks/
          components/
            TaskList.jsx
            TaskCard.jsx
            TaskForm.jsx
            TaskFilters.jsx
            TaskStats.jsx
          hooks/
            useTasks.js
          utils/
            taskHelpers.js
      pages/
        TasksPage.jsx
      services/
        tasksApi.js
      App.jsx
      main.jsx
      index.css
  server/
    src/
      config/
        db.js
        env.js
      controllers/
        taskController.js
      services/
        taskService.js
      models/
        taskModel.js
      middleware/
        errorHandler.js
        notFoundHandler.js
      routes/
        taskRoutes.js
      utils/
        errors.js
        sanitize.js
      app.js
      server.js
    db/
      migrations/
      seeds/
    knexfile.js
    package.json
  docs/
    architecture.md
  README.md
```

The exact filenames can vary slightly, but the boundaries should not: routes wire URLs, controllers translate HTTP, services make decisions, models talk to the database, and React components render the user interface.

## Request Flow

### List Tasks

1. The browser opens `TasksPage`.
2. `TasksPage` stores the current filters and sort settings.
3. `useTasks` calls `tasksApi.listTasks({ status, priority, sort, order })`.
4. `tasksApi` sends `GET /api/tasks` with query params.
5. Express matches the request in `taskRoutes`.
6. `taskController.listTasks` reads and normalizes query params.
7. `taskService.listTasks` validates allowed filters and sort fields.
8. `taskModel.findAll` builds the Knex query.
9. The controller returns `{ success: true, data: { tasks } }`.
10. React stores the tasks and renders `TaskStats`, `TaskFilters`, and `TaskList`.

### Create or Update a Task

1. The user opens `TaskForm` in a modal.
2. Client validation checks title and due date before submitting.
3. The API receives `POST /api/tasks` or `PUT /api/tasks/:id`.
4. The controller passes the body to the service.
5. The service trims strings, checks required fields, checks allowed `priority` and `status` values, and checks due date rules.
6. The model inserts or updates the row with Knex.
7. The frontend closes the modal and refetches the list.

### Toggle Completion

1. The user clicks the completion control on a `TaskCard`.
2. The frontend sends `PATCH /api/tasks/:id/toggle`.
3. The service loads the existing task.
4. If the task is already `done`, it moves back to `todo` and clears `completed_at`.
5. Otherwise, it moves to `done` and sets `completed_at`.
6. The updated task returns to the client and the list refreshes.

### Error Flow

1. A service throws `ValidationError`, `NotFoundError`, or `AppError`.
2. Express forwards the error to centralized error middleware.
3. The middleware selects the status code and public error code.
4. The response uses `{ success: false, error: { message, code } }`.
5. The frontend shows the message near the form or list area.

## Database Schema

Table: `tasks`

| Column | Type | Rules |
| --- | --- | --- |
| `id` | `serial` | Primary key |
| `title` | `varchar(255)` | Required |
| `description` | `text` | Optional |
| `priority` | `varchar(20)` | Required, default `medium`, allowed `low`, `medium`, `high` |
| `status` | `varchar(20)` | Required, default `todo`, allowed `todo`, `in_progress`, `done` |
| `due_date` | `date` | Optional |
| `completed_at` | `timestamp` | Optional |
| `created_at` | `timestamp` | Required, default current time |
| `updated_at` | `timestamp` | Required, default current time |

Recommended constraints:

- Check constraint for `priority`.
- Check constraint for `status`.
- `updated_at` should change whenever a row is updated.
- Sorting should support `due_date`, `priority`, and `created_at`.

## Validation and Error Patterns

Project 1 uses JavaScript and simple custom validation. Zod begins later in Tier 1, so this project should keep validation readable and explicit.

Server-side validation should check:

- `title` exists after trimming.
- `title` is no longer than 255 characters.
- `priority` is one of `low`, `medium`, `high`.
- `status` is one of `todo`, `in_progress`, `done`.
- `due_date`, when provided for a new or changed task, is today or in the future.
- Query params only use supported filter, sort, and order values.

Client-side validation should check:

- Required title.
- Future or current due date.
- Friendly messages before the request is sent.

Sanitization should trim strings and store empty optional strings as `null` when that makes the database cleaner.

Suggested error classes:

```js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

`ValidationError` should normally return `400`. `NotFoundError` should return `404`.

## Frontend State Flow

Keep Project 1 state simple:

- `TasksPage` owns page-level state: filters, sort, modal open/closed, and selected task for editing.
- `useTasks` owns API state: `tasks`, `stats`, `loading`, `error`, and mutation functions.
- `TaskFilters` receives current filters and calls callbacks when they change.
- `TaskForm` owns local form fields until submit.
- `TaskList` receives already-fetched tasks and renders cards.
- `TaskCard` emits actions: edit, delete, toggle.

Use refetch-after-mutation for the first project. It is easier to reason about than optimistic updates and prepares learners to understand React Query in later projects.

Useful helper functions belong in `features/tasks/utils/taskHelpers.js`:

- `isOverdue(task)`
- `formatDueDate(date)`
- `getPriorityLabel(priority)`
- `getStatusLabel(status)`

## API Decisions

| Decision | Rationale |
| --- | --- |
| REST routes under `/api/tasks` | Matches the CRUD learning goal and keeps browser/API boundaries clear. |
| Controllers, services, and models | Teaches separation of HTTP concerns, business rules, and database access. |
| Knex instead of an ORM | Keeps SQL concepts visible while avoiding handwritten SQL for every query. |
| Manual validation | Project 1 should expose the basic mechanics before introducing Zod in later projects. |
| Hard delete tasks | The spec does not include `deleted_at` for tasks, so delete removes the row. |
| Refetch after mutations | Simpler and more reliable for a first React data-flow project. |
| CSS Modules | Gives component-level styling without introducing a larger styling framework. |

## API Endpoint Notes

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/tasks` | Applies optional filters and sorting. |
| `GET` | `/api/tasks/:id` | Returns 404 when the task does not exist. |
| `POST` | `/api/tasks` | Creates a task with defaults for missing `priority` and `status`. |
| `PUT` | `/api/tasks/:id` | Updates allowed task fields and refreshes `updated_at`. |
| `PATCH` | `/api/tasks/:id/toggle` | Moves to or from `done` and updates `completed_at`. |
| `DELETE` | `/api/tasks/:id` | Deletes the row and returns a success envelope. |
| `GET` | `/api/tasks/stats` | Returns counts for `todo`, `in_progress`, and `done`. |

## Learning Review Prompts

Use these questions after implementation or during code review:

1. What work happens in the controller, and what work belongs in the service?
2. Why is it useful for the model layer to contain only Knex queries?
3. What would break if the frontend allowed a status value the database rejects?
4. Why does the API use the same success/error envelope for every endpoint?
5. How does `useTasks` keep component code smaller?
6. Why is refetching after create/update/delete easier than optimistic updates in Project 1?
7. Where would you add a new filter, such as "due today"?
8. Which validation rules are duplicated on the client and server, and why is server validation still required?
