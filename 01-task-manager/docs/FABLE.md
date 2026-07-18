# FABLE Guide — Personal Task Manager

**One doc to take you from "I can read this code" to "I could have designed this code."**

This is Project 1 of the curriculum, and it teaches the single most reusable skill in
full-stack work: the **layered CRUD app**. Every project after this one is a variation
on the shape you learn here. Master this project slowly and every later project gets faster.

> The older docs (`architecture.md`, the `upskill/` folder) are still valid references.
> This guide is the recommended path *through* them: shorter, ordered, and hands-on.

---

## 1. What you are looking at

A task manager with create, edit, filter, sort, complete, and delete. Nothing exotic —
and that is the point. The value is in *how* it is built:

```
Browser (React)                    Server (Express)                 Database
─────────────────                  ────────────────                 ────────
TasksPage                          taskRoutes.js      ─ URLs only
  └─ useTasks (hook)     HTTP      taskController.js  ─ HTTP in/out
       └─ tasksApi.js  ────────►   taskService.js     ─ rules & validation
                                   taskModel.js       ─ Knex queries  ──►  tasks table
```

Each layer has exactly one job. When you can say **why** a piece of logic belongs in one
layer and not another, you are thinking at mid level. When you can argue about the cost
of moving it, you are thinking at senior level.

**Stack:** React 18 + Vite + Axios + CSS Modules / Express + Knex + PostgreSQL 16 / plain JavaScript.

---

## 2. Run it (10 minutes)

```bash
# from the workspace root
createdb task_manager_dev
npm --prefix 01-task-manager/server install
npm --prefix 01-task-manager/client install
npm --prefix 01-task-manager/server run migrate
npm --prefix 01-task-manager/server run seed
npm --prefix 01-task-manager/server run dev     # API on :4000
npm --prefix 01-task-manager/client run dev     # UI on :5173
```

Server env lives in `server/.env` (copy from `.env.example`; the important value is
`DATABASE_URL`). Client env is `client/.env` with `VITE_API_URL=http://localhost:4000/api`.

**Prove it works before reading any code:**

```bash
curl "http://localhost:4000/api/tasks?status=todo&sort=due_date&order=asc"
curl -X POST http://localhost:4000/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Learn the layers","priority":"high"}'
```

Notice every response has the same envelope: `{ "success": true, "data": ... }` on success,
`{ "success": false, "error": { "message", "code" } }` on failure. That consistency is a
design decision, not an accident — the frontend only needs one error-handling path.

---

## 3. Guided code tour (read in this order)

Read each file for 5–15 minutes. The "notice" column is the thing that separates skimming
from learning.

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/server.js` → `server/src/app.js` | Startup vs. app-wiring are separate files. Why? (Hint: tests import `app` without opening a port.) |
| 2 | `server/src/routes/taskRoutes.js` | Routes contain **zero logic** — just URL → controller mapping. Also note `/stats` is declared *before* `/:id`. Swap them mentally: what breaks? |
| 3 | `server/src/controllers/taskController.js` | Controllers only translate HTTP: read params/body, call the service, shape the response. Every handler is wrapped in `asyncHandler` (see `utils/asyncHandler.js`) so thrown errors reach middleware. |
| 4 | `server/src/services/taskService.js` | **The most important file in the project.** All validation and business rules live here: allowed enums, due-date rules, the toggle logic. Note `hasOwn()` — it distinguishes "field omitted" from "field set to null", a subtlety juniors miss. |
| 5 | `server/src/models/taskModel.js` | Only Knex queries. No validation, no HTTP. It trusts the service completely. |
| 6 | `server/src/middleware/errorMiddleware.js` + `utils/errors.js` | One place converts thrown errors (`ValidationError`, `NotFoundError`) into status codes and the error envelope. |
| 7 | `server/db/migrations/` + `server/db/seeds/01_tasks.js` | The schema as code. Check the constraints on `priority`/`status` — the DB is the last line of defense. |
| 8 | `client/src/services/tasksApi.js` | The *only* file that knows Axios or URLs. The rest of the app calls named functions. |
| 9 | `client/src/features/tasks/hooks/useTasks.js` | API state (`tasks`, `loading`, `error`) and mutations in one hook. Mutations **refetch** rather than patching local state — deliberate simplicity. |
| 10 | `client/src/pages/TasksPage.jsx` | Page owns UI state (filters, modal, selected task); the hook owns server state. That split is the whole frontend architecture. |
| 11 | `client/src/features/tasks/components/` | `TaskForm` (local form state + client validation), `TaskCard` (emits events up), `TaskFilters`, `TaskStats`. Dumb components, smart page. |

---

## 4. Trace one request end-to-end (do not skip)

Take **"toggle a task complete"** and write down every hop yourself, with file and function
names, before checking below:

1. `TaskCard` click → callback prop up to the page/hook
2. `useTasks` → `tasksApi.toggleTask(id)` → `PATCH /api/tasks/:id/toggle`
3. `taskRoutes` matches → `taskController.toggleTask` → `taskService.toggleTask`
4. Service loads the row, decides: `done` → back to `todo` (clear `completed_at`), else → `done` (set `completed_at`)
5. `taskModel` updates the row → controller wraps it in the envelope → hook refetches list + stats

If you can narrate this without looking, you understand the app. Now do the same for
**"submit an empty title"** — follow the error instead of the data.

---

## 5. The challenge ladder

Do these in order. Each level is a real skill gate.

### Level 1 — Junior (modify existing behavior)
1. **Add a "due today" filter.** Touch every layer: query param → controller → service
   validation → model query → API service → filter UI. This is the canonical exercise;
   time yourself, then ask which file you were unsure about.
2. **Add a max length (2000) to `description`** with a friendly message on both client
   and server. Then answer: why is server validation still required when the client
   already checks?

### Level 2 — Mid (extend the design)
3. **Add an `archived` status without breaking existing filters.** You must decide:
   new enum value or new boolean column? Write 5 lines justifying your choice before coding.
4. **Add tests.** There are none — that is your opening. Start with `taskService` unit
   tests (validation rules, toggle logic) using any runner; the service layer is testable
   precisely *because* it does not touch HTTP or Knex directly (mock the model).
5. **Replace refetch-after-mutation with an optimistic toggle** for the complete button
   only. Handle the failure rollback. Then write down why the project *chose* refetch —
   both answers matter.

### Level 3 — Senior (critique and design)
6. **Write an architecture critique (1 page):** What breaks first at 10,000 tasks?
   (Look at `GET /api/tasks` — no pagination.) What would multi-user support force you
   to change in every layer? Where would you introduce caching, and what would it corrupt?
7. **Constraint audit:** list every rule enforced in the service and check whether the
   database also enforces it. For each gap (e.g., due-date rule), decide: should the DB
   enforce it, and what is the cost?

---

## 6. Questions you should be able to answer afterward

These are also fair interview questions — practice saying the answers out loud.

- Why do controllers not talk to the database directly? What concretely goes wrong at scale if they do?
- Why does the model layer contain no validation?
- What is the difference between a `PUT` update and the `PATCH /toggle` endpoint, and why does toggle deserve its own route?
- Why refetch after mutations instead of optimistic updates — and when does that stop being the right answer?
- Why is `parseTaskId` in the service instead of trusting Express params?
- What is the purpose of a consistent response envelope, and what does the frontend code look like without one?

## 7. Common traps

- **Route order:** `/stats` after `/:id` means "stats" gets parsed as an id. This bug appears in every Express project ever.
- **Timezone drift on dates:** see `toDateOnly()` in `taskService.js` — date-only comparison via ISO strings avoids off-by-one-day bugs.
- **Forgetting `asyncHandler`:** an async controller that throws without it hangs the request instead of returning 500.
- **Editing `dist/`:** the client `dist/` folder is build output; source lives in `client/src`.

When you finish Level 2, move to Project 2 (`02-contact-book`) — same skeleton, plus
pagination, search, and many-to-many relationships.
