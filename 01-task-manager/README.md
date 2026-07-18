# Personal Task Manager

Project 1 is a full-stack task manager for learning the basic shape of a React, Express, PostgreSQL, and Knex application. It is intentionally small, but it should still feel like a real app: users can create, edit, filter, sort, complete, and delete tasks.

## Learning Objectives

- Set up an Express server with route modules and middleware.
- Configure Knex for PostgreSQL migrations, seeds, and queries.
- Design a basic REST API with consistent response envelopes.
- Separate backend controllers, services, and models.
- Build React components around `useState`, `useEffect`, and a custom `useTasks` hook.
- Fetch data from an API with Axios.
- Use CSS Modules for component-scoped styling.
- Handle validation, empty states, loading states, and API errors.

## Expected Stack

| Layer | Tool |
| --- | --- |
| Runtime | Node.js 20+ |
| Backend | Express, Knex, PostgreSQL 16 |
| Frontend | React 18, Vite, Axios |
| Styling | CSS Modules |
| Language | JavaScript |

## Expected Ports

| Service | URL |
| --- | --- |
| Client | `http://localhost:5173` |
| Server | `http://localhost:4000` |
| PostgreSQL | `localhost:5432` |

The frontend should call the API at `http://localhost:4000/api`.

## Install Dependencies

From the workspace root:

```bash
npm install
npm --prefix 01-task-manager/server install
npm --prefix 01-task-manager/client install
```

The root install is for convenience scripts. The server and client installs are the important project installs.

## Environment Variables

Create backend env values for the server. A typical local file is `01-task-manager/server/.env`:

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/task_manager_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager_dev
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=http://localhost:5173
```

Create frontend env values in `01-task-manager/client/.env`:

```bash
VITE_API_URL=http://localhost:4000/api
```

Prefer `DATABASE_URL` when available. The `DB_*` values are useful for a Knex config that builds the connection object manually.

## Database Setup

Create the development database:

```bash
createdb task_manager_dev
```

Run migrations and seeds from the workspace root:

```bash
npm --prefix 01-task-manager/server run migrate
npm --prefix 01-task-manager/server run seed
```

If package scripts have not been added yet, run Knex directly from the server folder:

```bash
cd 01-task-manager/server
npx knex migrate:latest --knexfile knexfile.js
npx knex seed:run --knexfile knexfile.js
```

The seed data should create 12 tasks across all statuses and priorities, including overdue tasks, tasks due today, future tasks, and tasks with no due date.

## Run the App

From the workspace root, run the API and client in separate terminals:

```bash
npm run dev:project1:server
npm run dev:project1:client
```

Equivalent direct commands:

```bash
npm --prefix 01-task-manager/server run dev
npm --prefix 01-task-manager/client run dev
```

Open `http://localhost:5173` in the browser.

## API Overview

All API responses should use a consistent envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "Title is required", "code": "VALIDATION_ERROR" } }
```

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks with optional filters and sorting |
| `GET` | `/api/tasks/:id` | Get one task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle completion status |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/tasks/stats` | Count tasks by status |

Supported list query params:

| Query param | Values |
| --- | --- |
| `status` | `todo`, `in_progress`, `done` |
| `priority` | `low`, `medium`, `high` |
| `sort` | `due_date`, `priority`, `created_at` |
| `order` | `asc`, `desc` |

Example:

```bash
curl "http://localhost:4000/api/tasks?status=todo&priority=high&sort=due_date&order=asc"
```

## Core Task Fields

| Field | Rules |
| --- | --- |
| `title` | Required, trimmed, max 255 characters |
| `description` | Optional text |
| `priority` | `low`, `medium`, or `high`; default `medium` |
| `status` | `todo`, `in_progress`, or `done`; default `todo` |
| `due_date` | Optional date; new due dates must be today or in the future |
| `completed_at` | Set when a task moves to `done`; cleared when reopened |

## Useful Checks

```bash
npm --prefix 01-task-manager/server run lint --if-present
npm --prefix 01-task-manager/client run lint --if-present
```

Manual smoke test:

1. Start PostgreSQL, the server, and the client.
2. Load the task list.
3. Create a task with a future due date.
4. Try submitting a blank title and confirm validation appears.
5. Filter by status and priority.
6. Toggle a task complete and confirm the visual strike-through.
7. Delete a task and confirm the list updates.

## More Detail

See `docs/architecture.md` for the request flow, database schema, validation patterns, frontend state flow, and decision notes.
