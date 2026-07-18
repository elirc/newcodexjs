import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const projects = [
  "01-task-manager",
  "02-contact-book",
  "03-expense-tracker",
  "04-notes-app",
  "05-recipe-manager",
  "06-bookmark-manager",
  "07-blog-platform",
  "08-kanban-board",
  "09-job-application-tracker",
  "10-inventory-management",
];

const tree = [
  "README.md",
  "00-fast-track.md",
  "01-codebase-cartography/README.md",
  "01-codebase-cartography/01-system-map.md",
  "01-codebase-cartography/02-file-reading-order.md",
  "01-codebase-cartography/03-domain-glossary.md",
  "01-codebase-cartography/04-runtime-and-tooling-map.md",
  "01-codebase-cartography/05-key-flows.md",
  "02-stack-and-language-mastery/README.md",
  "02-stack-and-language-mastery/01-language-runtime-model.md",
  "02-stack-and-language-mastery/02-framework-mental-models.md",
  "02-stack-and-language-mastery/03-type-system-and-contracts.md",
  "02-stack-and-language-mastery/04-tooling-and-build-system.md",
  "03-architecture-and-patterns/README.md",
  "03-architecture-and-patterns/01-boundaries-and-layers.md",
  "03-architecture-and-patterns/02-data-model-and-persistence.md",
  "03-architecture-and-patterns/03-validation-auth-and-permissions.md",
  "03-architecture-and-patterns/04-side-effects-async-and-reliability.md",
  "03-architecture-and-patterns/05-pattern-catalog.md",
  "03-architecture-and-patterns/06-architecture-critique.md",
  "04-code-reading-gym/README.md",
  "04-code-reading-gym/01-annotation-drills.md",
  "04-code-reading-gym/02-trace-tables.md",
  "04-code-reading-gym/03-fake-code-contrasts.md",
  "04-code-reading-gym/04-review-katas.md",
  "05-quality-engineering/README.md",
  "05-quality-engineering/01-testing-strategy.md",
  "05-quality-engineering/02-writing-tests-here.md",
  "05-quality-engineering/03-systematic-debugging.md",
  "05-quality-engineering/04-performance-thinking.md",
  "05-quality-engineering/05-security-checklist.md",
  "05-quality-engineering/06-observability-and-operations.md",
  "06-contribution-practice/README.md",
  "06-contribution-practice/01-good-first-tickets.md",
  "06-contribution-practice/02-mid-level-feature-tickets.md",
  "06-contribution-practice/03-senior-build-projects.md",
  "06-contribution-practice/04-refactor-and-design-katas.md",
  "07-career-and-collaboration/README.md",
  "07-career-and-collaboration/01-code-review-mindset.md",
  "07-career-and-collaboration/02-writing-prs-and-rfcs.md",
  "07-career-and-collaboration/03-maintainer-communication.md",
  "07-career-and-collaboration/04-interview-prep-from-this-repo.md",
  "08-reference/command-cheatsheet.md",
  "08-reference/risk-register.md",
  "08-reference/learning-rubrics.md",
  "08-reference/verification-log.md",
];

const projectMeta = {
  "01-task-manager": {
    title: "Personal Task Manager",
    nouns: ["task", "priority", "status", "due date", "completed_at"],
    feature: "task CRUD, filtering, completion toggles, overdue highlighting",
  },
  "02-contact-book": {
    title: "Contact Book / Address Manager",
    nouns: ["contact", "tag", "contact_tags", "pagination", "CSV import/export"],
    feature: "contacts, tags, search, pagination, CSV workflows",
  },
  "03-expense-tracker": {
    title: "Personal Expense Tracker",
    nouns: ["expense", "category", "budget", "monthly summary", "CSV export"],
    feature: "expense CRUD, aggregation, dashboards, budgets",
  },
  "04-notes-app": {
    title: "Notes App",
    nouns: ["note", "folder", "tag", "markdown", "full-text search"],
    feature: "markdown notes, folders, tags, searchable knowledge capture",
  },
  "05-recipe-manager": {
    title: "Recipe Manager",
    nouns: ["user", "recipe", "ingredient", "step", "favorite", "JWT"],
    feature: "auth, protected recipes, public/private recipes, favorites",
  },
  "06-bookmark-manager": {
    title: "Bookmark Manager",
    nouns: ["bookmark", "collection", "tag", "URL metadata", "API version"],
    feature: "bookmark organization, metadata, Zod validation, external consumers",
  },
  "07-blog-platform": {
    title: "Blog Platform",
    nouns: ["post", "comment", "reply", "slug", "RSS", "sanitized HTML"],
    feature: "posts, nested comments, rich text, RSS, sanitization",
  },
  "08-kanban-board": {
    title: "Kanban Board",
    nouns: ["board", "list", "card", "label", "position", "checklist"],
    feature: "board/list/card modeling, optimistic reorder, fractional positioning",
  },
  "09-job-application-tracker": {
    title: "Job Application Tracker",
    nouns: ["application", "stage", "stage history", "document", "reminder"],
    feature: "pipeline state, notes, documents, reminders, dashboard KPIs",
  },
  "10-inventory-management": {
    title: "Inventory Management System",
    nouns: ["product", "SKU", "supplier", "order", "stock movement", "audit trail"],
    feature: "inventory transactions, stock movements, reporting, auditability",
  },
};

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readText(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return "";
  }
}

function firstExisting(project, candidates) {
  return candidates.find((candidate) => fs.existsSync(path.join(project, candidate))) || candidates[0];
}

function lineOf(project, file, needle) {
  const full = path.join(project, file);
  if (!fs.existsSync(full)) return `${file}:1`;
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  return `${file}:${index >= 0 ? index + 1 : 1}`;
}

async function inspect(project) {
  const clientPackage = JSON.parse(await readText(path.join(project, "client/package.json")) || "{}");
  const serverPackage = JSON.parse(await readText(path.join(project, "server/package.json")) || "{}");
  const clientApp = firstExisting(project, [
    "client/src/App.tsx",
    "client/src/App.jsx",
    "client/src/pages/TasksPage.jsx",
  ]);
  const clientApi = firstExisting(project, [
    "client/src/services/api.ts",
    "client/src/services/api.js",
    "client/src/services/tasksApi.js",
  ]);
  const serverApp = firstExisting(project, [
    "server/src/app.ts",
    "server/src/app.js",
  ]);
  const serverEntry = firstExisting(project, [
    "server/src/server.ts",
    "server/src/server.js",
    "server/src/index.ts",
  ]);
  const routes = firstExisting(project, [
    "server/src/routes/routes.ts",
    "server/src/routes/routes.js",
    "server/src/routes/taskRoutes.js",
    "server/src/routes/contactRoutes.js",
    "server/src/routes/expenseRoutes.js",
    "server/src/routes/recipeRoutes.ts",
  ]);
  const controller = firstExisting(project, [
    "server/src/controllers/controller.ts",
    "server/src/controllers/controller.js",
    "server/src/controllers/taskController.js",
    "server/src/controllers/contactController.js",
    "server/src/controllers/expenseController.js",
    "server/src/controllers/recipeController.ts",
  ]);
  const service = firstExisting(project, [
    "server/src/services/service.ts",
    "server/src/services/service.js",
    "server/src/services/taskService.js",
    "server/src/services/contactService.js",
    "server/src/services/expenseService.js",
    "server/src/services/recipeService.ts",
  ]);
  const model = firstExisting(project, [
    "server/src/models/model.ts",
    "server/src/models/model.js",
    "server/src/models/taskModel.js",
    "server/src/models/contactModel.js",
    "server/src/models/expenseModel.js",
    "server/src/models/recipeModel.ts",
  ]);
  const migration = firstExisting(project, [
    "server/db/migrations/001_init.ts",
    "server/db/migrations/001_init.js",
    "server/db/migrations/20260703000000_create_tasks_table.js",
    "server/db/migrations/202607030201_create_contacts_tags.js",
    "server/db/migrations/202607030301_create_expense_tracker.js",
    "server/db/migrations/001_initial_schema.ts",
  ]);
  const seed = firstExisting(project, [
    "server/db/seeds/001_seed.ts",
    "server/db/seeds/001_seed.js",
    "server/db/seeds/01_tasks.js",
    "server/db/seeds/001_contacts.js",
    "server/db/seeds/001_expenses.js",
  ]);
  const knexfile = firstExisting(project, ["server/knexfile.ts", "server/knexfile.js"]);
  const env = firstExisting(project, ["server/src/config/env.ts", "server/src/config/env.js"]);
  const db = firstExisting(project, ["server/src/config/db.ts", "server/src/config/db.js", "server/src/config/database.js"]);
  const error = firstExisting(project, [
    "server/src/middleware/errorMiddleware.ts",
    "server/src/middleware/errorMiddleware.js",
    "server/src/middleware/errors.js",
    "server/src/middleware/errorHandler.ts",
  ]);
  const isTs = project >= "05-" || clientApp.endsWith(".tsx") || serverApp.endsWith(".ts");

  return {
    ...projectMeta[project],
    project,
    isTs,
    scripts: {
      client: clientPackage.scripts || {},
      server: serverPackage.scripts || {},
    },
    deps: {
      client: Object.keys(clientPackage.dependencies || {}),
      server: Object.keys(serverPackage.dependencies || {}),
    },
    files: {
      clientApp,
      clientApi,
      serverApp,
      serverEntry,
      routes,
      controller,
      service,
      model,
      migration,
      seed,
      knexfile,
      env,
      db,
      error,
    },
  };
}

function anchors(meta) {
  const f = meta.files;
  return {
    clientApp: lineOf(meta.project, f.clientApp, "function App"),
    clientApi: lineOf(meta.project, f.clientApi, "baseURL"),
    serverApp: lineOf(meta.project, f.serverApp, "express"),
    serverEntry: lineOf(meta.project, f.serverEntry, "listen"),
    routes: lineOf(meta.project, f.routes, "router"),
    controller: lineOf(meta.project, f.controller, "function"),
    service: lineOf(meta.project, f.service, "function"),
    model: lineOf(meta.project, f.model, "db"),
    migration: lineOf(meta.project, f.migration, "createTable"),
    seed: lineOf(meta.project, f.seed, "insert"),
    env: lineOf(meta.project, f.env, "process.env"),
    error: lineOf(meta.project, f.error, "error"),
  };
}

function commandList(meta) {
  return [
    ["Install client", "npm --prefix client install", "inferred"],
    ["Install server", "npm --prefix server install", "inferred"],
    ["Run client", "npm --prefix client run dev", meta.scripts.client.dev ? "verified in package.json" : "missing"],
    ["Run server", "npm --prefix server run dev", meta.scripts.server.dev ? "verified in package.json" : "missing"],
    ["Build client", "npm --prefix client run build", meta.scripts.client.build ? "verified in package.json" : "missing"],
    ["Build server", "npm --prefix server run build", meta.scripts.server.build ? "verified in package.json" : meta.isTs ? "missing" : "not applicable for JS scaffold"],
    ["Migrate database", "npm --prefix server run migrate", meta.scripts.server.migrate ? "verified in package.json" : "missing"],
    ["Seed database", "npm --prefix server run seed", meta.scripts.server.seed ? "verified in package.json" : "missing"],
  ];
}

function header(meta, title) {
  return `# ${title}\n\nProject: **${meta.title}** (\`${meta.project}\`)\n\n`;
}

function verification(meta) {
  return `\n## Verification Notes\n\n- Generated from inspected files in \`${meta.project}\`.\n- Important anchors inspected: \`${meta.files.clientApp}\`, \`${meta.files.serverApp}\`, \`${meta.files.routes}\`, \`${meta.files.service}\`, \`${meta.files.model}\`, \`${meta.files.migration}\`.\n- Commands were inferred from \`client/package.json\` and \`server/package.json\`; run them locally after installing dependencies and creating the database.\n- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.\n`;
}

function rootReadme(meta, a) {
  return header(meta, "Upskill Curriculum") + `This curriculum turns this project into a training lab for full-stack JavaScript roles. It is for juniors who want to become mid-level, mid-level engineers learning ownership, and senior engineers practicing architecture critique.\n\n## Repo Identity\n\n${meta.title} is a self-contained React, Express, Knex, PostgreSQL learning app. The main learning surface is ${meta.feature}. The browser entry lives at \`${a.clientApp}\`; the API starts around \`${a.serverApp}\`; persistence is introduced in \`${a.migration}\`; seed data begins at \`${a.seed}\`. The codebase uses a deliberate layered shape: UI calls API services, API routes call controllers, controllers delegate to services, services call models, and models own Knex queries.\n\n## How To Use This\n\n| Timeline | Path |\n| --- | --- |\n| One weekend | Read \`00-fast-track.md\`, trace one flow, make one tiny UI or validation change. |\n| Two weeks | Work through cartography, stack mastery, and two code-reading drills. |\n| Eight weeks | Add tests, complete good-first tickets, and write one mid-level design note. |\n| Ongoing | Use contribution and career docs for PR practice, review practice, and interview prep. |\n\n## Recommended Path\n\n- Brand-new junior: start with \`00-fast-track.md\`, then \`01-codebase-cartography/02-file-reading-order.md\`.\n- Junior with stack familiarity: trace \`01-codebase-cartography/05-key-flows.md\`, then do annotation drills.\n- Mid-level engineer: focus on \`03-architecture-and-patterns\`, \`05-quality-engineering\`, and mid-level tickets.\n- Senior reviewer: start with \`03-architecture-and-patterns/06-architecture-critique.md\` and \`08-reference/risk-register.md\`.\n\n## Conventions\n\n- Anchors use \`path:line\` references, for example \`${a.service}\`.\n- Fake code is always labeled as illustrative.\n- Drills include self-grading so learners can judge progress without needing another AI prompt.\n- Verification notes list commands, inspected files, and uncertainty.\n\n## Senior Mindset\n\nA junior asks, \"How do I make it work?\" A mid-level engineer asks, \"Is this the right pattern for this codebase?\" A senior asks, \"What does this commit us to, who pays the cost, and how do we reduce risk?\" Use this project to practice moving from implementation toward judgment.\n`;
}

function fastTrack(meta, a) {
  const commands = commandList(meta).map(([name, cmd, status]) => `| ${name} | \`${cmd}\` | ${status} |`).join("\n");
  return header(meta, "Fast Track") + `## Weekend Goal\n\nRun the app, trace one end-to-end ${meta.nouns[0]} flow, and make a safe small change using existing patterns.\n\n## Commands\n\n| Task | Command | Status |\n| --- | --- | --- |\n${commands}\n\n## First 10 Files To Open\n\n1. \`${meta.files.clientApp}\` - UI ownership and page state.\n2. \`${meta.files.clientApi}\` - client/server contract.\n3. \`${meta.files.serverApp}\` - middleware and route mounting.\n4. \`${meta.files.routes}\` - public API shape.\n5. \`${meta.files.controller}\` - request/response envelope.\n6. \`${meta.files.service}\` - business rules and validation boundary.\n7. \`${meta.files.model}\` - Knex query ownership.\n8. \`${meta.files.migration}\` - database contract.\n9. \`${meta.files.seed}\` - realistic local data.\n10. \`${meta.files.error}\` - error translation boundary.\n\n## Two Flows To Trace\n\n- UI list load: \`${a.clientApp}\` -> \`${a.clientApi}\` -> \`${a.routes}\` -> \`${a.service}\` -> \`${a.model}\`.\n- Create/update flow: form state -> API call -> controller -> service validation -> database write -> UI refresh.\n\n## Safe Change\n\nAdd one display-only field, empty-state text, or filter option. Keep the blast radius small: UI component, API service if needed, service validation, migration only if the data contract changes.\n\n## Teach-Back\n\nExplain why controllers should stay thin in this repo. Strong answer: identifies the service as the business boundary, names a failure mode, and proposes a test.\n\n## Not Covered\n\nThis fast path does not fully cover security, performance, migrations, or interview prep. Use the later modules for those.\n${verification(meta)}`;
}

function systemMap(meta, a) {
  return header(meta, "System Map") + `\`\`\`text\nclient React UI\n  -> client API service\n  -> Express app/routes\n  -> controller\n  -> service/business rules\n  -> model/Knex\n  -> PostgreSQL tables + seed data\n\`\`\`\n\n| Area | Owner | Anchor | Public or Private |\n| --- | --- | --- | --- |\n| UI | React page/components | \`${a.clientApp}\` | Public user surface |\n| Client API | HTTP contract wrapper | \`${a.clientApi}\` | Internal client boundary |\n| API app | middleware, health, route mount | \`${a.serverApp}\` | Public HTTP surface |\n| Routes | method/path contract | \`${a.routes}\` | Public API contract |\n| Controller | envelope and request parsing | \`${a.controller}\` | Internal transport boundary |\n| Service | invariants and business rules | \`${a.service}\` | Domain boundary |\n| Model | Knex queries | \`${a.model}\` | Persistence boundary |\n| Data | migrations and seeds | \`${a.migration}\`, \`${a.seed}\` | Database contract |\n\nPublic interfaces are the browser UI and API routes. Private internals are service/model implementations, migration details, and UI state helpers.\n${verification(meta)}`;
}

function readingOrder(meta, a) {
  const files = [
    [meta.files.clientApp, "Start with user-facing state and rendering; do not get lost in CSS."],
    [meta.files.clientApi, "Read request URLs and response unwrapping; look for contract assumptions."],
    [meta.files.serverApp, "Find middleware order and route mounting."],
    [meta.files.routes, "Map API verbs to controllers."],
    [meta.files.controller, "Confirm controllers are thin."],
    [meta.files.service, "Study validation, invariants, and branching."],
    [meta.files.model, "Study query shape and persistence ownership."],
    [meta.files.migration, "Read schema as the durable contract."],
    [meta.files.seed, "Understand demo states and edge cases."],
    [meta.files.error, "Understand how errors become API responses."],
    [meta.files.env, "Learn runtime configuration and secret boundaries."],
    [meta.files.knexfile, "Learn CLI database wiring."],
  ];
  return header(meta, "File Reading Order") + `## Junior Path\n\n${files.slice(0, 8).map(([file, why], i) => `${i + 1}. \`${file}\` - ${why}`).join("\n")}\n\n## Mid-Level Path\n\n${files.map(([file, why], i) => `${i + 1}. \`${file}\` - ${why}`).join("\n")}\n\n## Senior Path\n\n1. Start at \`${meta.files.migration}\` and ask whether the schema supports future change.\n2. Move to \`${meta.files.service}\` and look for implicit invariants.\n3. Move to \`${meta.files.model}\` and look for unbounded queries, N+1 risk, and transaction boundaries.\n4. Move to \`${meta.files.error}\` and inspect observability and failure contracts.\n5. Finish at \`${meta.files.clientApi}\` and ask whether public contracts are stable.\n\n## Pause And Predict\n\nBefore opening \`${meta.files.service}\`, predict where validation should live. After reading, grade whether the code matches that boundary.\n${verification(meta)}`;
}

function glossary(meta) {
  return header(meta, "Domain Glossary") + meta.nouns.map((noun) => `## ${noun}\n\nMeaning in this project: a core domain term used to reason about ${meta.feature}.\n\nWhere to look:\n- \`${meta.files.clientApp}\` for user-facing behavior.\n- \`${meta.files.service}\` for rules involving ${noun}.\n- \`${meta.files.migration}\` for durable persistence shape.\n\nInterview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.\n`).join("\n") + verification(meta);
}

function toolingMap(meta) {
  const deps = [...new Set([...meta.deps.client, ...meta.deps.server])].sort().join(", ") || "No dependencies parsed.";
  return header(meta, "Runtime And Tooling Map") + `## Runtime Boundaries\n\n- Browser: React UI in \`${meta.files.clientApp}\`.\n- Server: Express API in \`${meta.files.serverApp}\` and \`${meta.files.serverEntry}\`.\n- Database: PostgreSQL accessed through Knex from \`${meta.files.model}\`.\n- CLI tooling: migrations and seeds through \`${meta.files.knexfile}\`.\n\n## Scripts\n\n${commandList(meta).map(([name, cmd, status]) => `- ${name}: \`${cmd}\` (${status})`).join("\n")}\n\n## Important Dependencies\n\n${deps}\n\n## Environment Variables\n\nRead \`.env.example\` and \`${meta.files.env}\`. Treat database credentials as secrets even in local examples.\n${verification(meta)}`;
}

function keyFlows(meta, a) {
  const flows = [
    ["List Records", "The default read path teaches UI data fetching and unbounded-query risk.", a.clientApp, a.clientApi, a.routes, a.service, a.model],
    ["Create Record", "The write path teaches validation, persistence, and response contracts.", a.clientApp, a.clientApi, a.controller, a.service, a.model],
    ["Update Record", "Update flows teach partial changes, invariant preservation, and stale UI state.", a.clientApp, a.clientApi, a.controller, a.service, a.model],
    ["Delete Record", "Delete flows teach destructive operations and confirmation UX.", a.clientApp, a.routes, a.controller, a.service, a.model],
    ["Database Setup", "Migrations and seeds teach repeatable local state.", a.knexfile || meta.files.knexfile, a.migration, a.seed, a.model],
    ["Error Translation", "Errors must become useful API envelopes without leaking internals.", a.service, a.error, a.serverApp],
  ];
  return header(meta, "Key Flows") + flows.map(([name, why, ...files]) => `## Flow: ${name}\n\n**Why this flow matters:** ${why}\n\n**Open these files first:**\n${files.map((file) => `- \`${file}\` - inspect ownership at this step.`).join("\n")}\n\n**Trace:**\n\n| Step | Owner | File | What happens | Data shape | Risk |\n| --- | --- | --- | --- | --- | --- |\n| 1 | UI/API | \`${files[0]}\` | User or system action starts the flow. | form/query/input | stale state or missing validation |\n| 2 | Transport | \`${files[1]}\` | HTTP contract carries the request. | JSON/envelope | contract drift |\n| 3 | Domain | \`${files[2]}\` | Rules are applied. | normalized payload | invariant gap |\n| 4 | Persistence | \`${files.at(-1)}\` | Database read/write happens. | table row(s) | unbounded query or transaction gap |\n\n**Validation and authorization:** Validation should be visible around \`${a.service}\`. Authorization is limited or demo-oriented unless this project has auth-specific files.\n\n**Persistence and side effects:** Persistence anchors are \`${a.model}\` and \`${a.migration}\`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.\n\n**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.\n\n**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.\n\n**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.\n\n**Drill:** Trace one field from input to database row and back to render.\n\n**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.\n`).join("\n") + verification(meta);
}

function languageModel(meta, a) {
  return header(meta, "Language Runtime Model") + `## Concept -> Code -> Drill\n\nJavaScript and TypeScript run asynchronous work through promises and the event loop. In this repo, HTTP handlers and API calls use async functions so IO can complete without blocking the process.\n\n**Why it matters:** serial awaits can add latency, missing awaits can hide errors, and unhandled promise failures can bypass the response envelope.\n\n**Real code anchors:** \`${a.clientApi}\`, \`${a.controller}\`, \`${a.service}\`.\n\n**Pitfalls:**\n- Swallowing errors in API calls.\n- Updating UI after a component unmounts.\n- Mixing browser-only APIs into Node code.\n- Using \`any\` so heavily that API contracts become invisible.\n\n**Drill:** Find one async function and write down inputs, awaited work, thrown errors, and returned shape.\n\n**Self-grade:** Strong answer names which layer owns retries, error translation, and user-visible messaging.\n${verification(meta)}`;
}

function frameworkModels(meta, a) {
  return header(meta, "Framework Mental Models") + `## React\n\nReact renders UI from state. In this project, the main page in \`${a.clientApp}\` owns local state and calls a service wrapper in \`${a.clientApi}\`.\n\nFailure modes: stale state, duplicated derived state, effects that refetch too often, and component state that should be URL or server state.\n\n## Express\n\nExpress is a middleware pipeline. \`${a.serverApp}\` configures global middleware, then mounts routes. \`${a.routes}\` maps HTTP verbs to controllers.\n\nFailure modes: middleware order mistakes, route shadowing, uncaught async errors, and leaking raw exceptions.\n\n## Knex/PostgreSQL\n\nKnex builds SQL queries. \`${a.model}\` should own query shape; \`${a.service}\` should own business decisions.\n\nFailure modes: unbounded queries, missing indexes, unsafe raw SQL, and missing transactions around multi-step writes.\n${verification(meta)}`;
}

function typeContracts(meta, a) {
  return header(meta, "Type System And Contracts") + `This project is ${meta.isTs ? "TypeScript-based in later-tier style" : "JavaScript-based for early Tier 1 fundamentals"}.\n\n## Contracts To Watch\n\n- UI form shape: \`${a.clientApp}\`.\n- HTTP request/response shape: \`${a.clientApi}\` and \`${a.routes}\`.\n- Domain payload shape: \`${a.service}\`.\n- Database row shape: \`${a.migration}\`.\n\n## Junior Mistake\n\nTreating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.\n\n## Drill\n\nWrite a small contract table: field, source, validation owner, persistence column, display owner.\n${verification(meta)}`;
}

function buildSystem(meta) {
  return header(meta, "Tooling And Build System") + commandList(meta).map(([name, cmd, status]) => `- ${name}: \`${cmd}\` - ${status}`).join("\n") + `\n\n## Build Judgment\n\nA passing build proves syntax and bundling, not correctness. Pair build checks with API tests, migration checks, and a browser flow.\n\n## Drill\n\nRun install, build, and one dev server. Record what failed because of local services such as PostgreSQL.\n${verification(meta)}`;
}

function boundaries(meta, a) {
  return header(meta, "Boundaries And Layers") + `| Layer | Owns | Must Not Own | Anchor |\n| --- | --- | --- | --- |\n| UI | rendering, local interaction | SQL, secrets | \`${a.clientApp}\` |\n| Client API | HTTP contract | domain rules | \`${a.clientApi}\` |\n| Routes | paths and verbs | business branching | \`${a.routes}\` |\n| Controllers | parsing and envelopes | persistence details | \`${a.controller}\` |\n| Services | validation and invariants | raw HTTP concerns | \`${a.service}\` |\n| Models | Knex queries | UI decisions | \`${a.model}\` |\n| Migrations | durable schema | request logic | \`${a.migration}\` |\n\nBoundary leak to investigate: any validation duplicated inconsistently between UI and service.\n${verification(meta)}`;
}

function dataPersistence(meta, a) {
  return header(meta, "Data Model And Persistence") + `The durable model starts at \`${a.migration}\`; local learning data starts at \`${a.seed}\`; runtime queries are concentrated around \`${a.model}\`.\n\n## Schema Change Checklist\n\n1. Add reversible migration.\n2. Update seed data.\n3. Update service validation.\n4. Update client API and UI display.\n5. Add regression tests or at least a manual verification note.\n6. Think about rollback: can old code tolerate the new column?\n\n## Transaction Thinking\n\nIf one user action writes multiple tables, the service should own a transaction boundary and the model should accept a transaction object. Investigate this before adding multi-step writes.\n${verification(meta)}`;
}

function validationAuth(meta, a) {
  return header(meta, "Validation, Auth, And Permissions") + `## Validation Map\n\n- Client validation: \`${a.clientApp}\`.\n- API contract validation: \`${a.clientApi}\`.\n- Server/domain validation: \`${a.service}\`.\n- Database constraints: \`${a.migration}\`.\n\n## Auth Map\n\n${meta.project === "05-recipe-manager" ? "This project introduces JWT and protected routes. Inspect auth-related services and middleware in addition to the anchors below." : "This project is mostly demo/local and may not include full authentication. Treat that as a learning limitation, not a production pattern."}\n\n## What A Junior Might Miss\n\nA hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.\n\n## What A Senior Checks\n\nIDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.\n${verification(meta)}`;
}

function sideEffects(meta, a) {
  return header(meta, "Side Effects, Async, And Reliability") + `Side effects in Tier 1 are intentionally limited, but the project may include email, uploads, metadata fetches, CSV export, or reporting.\n\n## Reliability Concepts\n\n- Idempotency: retrying should not duplicate records.\n- Timeout: external calls should not hang request workers forever.\n- Backpressure: expensive flows should avoid unbounded work.\n- Visibility: failures should be logged and returned through the error envelope.\n\n## Inspect\n\n- API side effects near \`${a.service}\`.\n- Persistence writes near \`${a.model}\`.\n- Error translation near \`${a.error}\`.\n\n## Drill\n\nPick one write flow. Ask: if the database write succeeds but the UI refresh fails, what state does the user see?\n${verification(meta)}`;
}

function patternCatalog(meta, a) {
  const patterns = [
    ["Thin Controller", "Keeps transport concerns separate from business rules.", a.controller],
    ["Service Boundary", "Centralizes validation and invariants.", a.service],
    ["Model Query Wrapper", "Keeps SQL/Knex out of UI and controllers.", a.model],
    ["Standard Response Envelope", "Makes API success and failure predictable.", a.controller],
    ["Migration As Contract", "Treats schema as versioned architecture.", a.migration],
    ["Seed Data As Scenario", "Provides realistic states for learning and debugging.", a.seed],
    ["Client API Wrapper", "Avoids scattering URLs across components.", a.clientApi],
    ["Environment Boundary", "Keeps local config out of source code.", a.env],
    ["Error Translation Middleware", "Turns thrown errors into HTTP responses.", a.error],
    ["Feature-First UI", "Keeps domain components near their behavior.", a.clientApp],
    ["Validation Before Persistence", "Rejects bad input before durable writes.", a.service],
    ["Small Blast Radius Change", "Modifies one layer at a time unless the contract changes.", a.clientApp],
  ];
  return header(meta, "Pattern Catalog") + patterns.map(([name, problem, example]) => `## Pattern: ${name}\n\n**Problem it solves:** ${problem}\n\n**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.\n\n**Real example:** \`${example}\`\n\n**Second example:** \`${a.routes}\` or \`${a.model}\`, depending on the pattern.\n\n**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.\n\n**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.\n\n**Use it when:** the concept has a stable owner.\n\n**Avoid it when:** the abstraction hides one-off complexity without reducing risk.\n\n**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.\n`).join("\n") + verification(meta);
}

function critique(meta, a) {
  return header(meta, "Architecture Critique") + `## Strong Choices\n\n- Clear client/server split.\n- Layered API path from routes to controllers to services to models.\n- Versioned migrations and seed data.\n- Local-first learning commands.\n\n## Risks And Tradeoffs\n\n| Risk | Evidence | Impact | Confidence |\n| --- | --- | --- | --- |\n| Missing or light test coverage | No test files confirmed in this pass | regressions can slip | medium |\n| Demo auth or no auth | inspect \`${a.routes}\` and auth middleware if present | IDOR risk in real apps | medium |\n| Unbounded list endpoints | inspect \`${a.model}\` | latency and memory risk | medium |\n| Thin observability | inspect \`${a.serverApp}\` and \`${a.error}\` | debugging production issues is harder | medium |\n\n## If I Owned This For Three Months\n\n1. Add API integration tests for create/update/delete.\n2. Add pagination and indexes for list endpoints.\n3. Add explicit auth/ownership checks where user data exists.\n4. Add structured logging around errors and slow queries.\n5. Write schema migration playbooks.\n${verification(meta)}`;
}

function annotationDrills(meta, a) {
  const drillFiles = [a.clientApp, a.clientApi, a.serverApp, a.routes, a.controller, a.service, a.model, a.migration, a.seed, a.error];
  return header(meta, "Annotation Drills") + drillFiles.map((file, i) => `## Drill ${i + 1}: \`${file}\`\n\nAnnotate:\n- inputs\n- outputs\n- dependencies\n- invariants\n- side effects\n- failure modes\n\nSelf-grade:\n- Basic: names what the file does.\n- Solid: traces one value through it.\n- Strong: identifies ownership, risk, and a test that would catch regression.\n`).join("\n") + verification(meta);
}

function traceTables(meta, a) {
  return header(meta, "Trace Tables") + `## UI To API Trace\n\n| Step | File | Value Shape | Owner | Transformation | Risk |\n| --- | --- | --- | --- | --- | --- |\n| User input | \`${a.clientApp}\` | form state | UI | event -> state | stale or invalid value |\n| API call | \`${a.clientApi}\` | JSON payload | client API | state -> HTTP | contract drift |\n| Route | \`${a.routes}\` | request | transport | method/path -> handler | wrong route |\n| Service | \`${a.service}\` | domain payload | domain | validate/normalize | missing invariant |\n| Model | \`${a.model}\` | row/query | persistence | payload -> SQL | unbounded or unsafe query |\n\n## Error Trace\n\n| Step | File | Failure | Translation |\n| --- | --- | --- | --- |\n| Service rejects | \`${a.service}\` | validation/business error | throw typed error if present |\n| Middleware | \`${a.error}\` | exception | standard error envelope |\n| Client | \`${a.clientApi}\` | HTTP failure | user-facing error state |\n${verification(meta)}`;
}

function fakeCodeContrasts(meta, a) {
  return header(meta, "Fake Code Contrasts") + `## Contrast: Coupling UI To SQL\n\n\`\`\`js\n// Illustrative fake code: not from this repo.\nawait fetch("/api/raw-sql?table=${meta.nouns[0]}");\n\`\`\`\n\nBetter shape: keep SQL in \`${a.model}\` and keep UI calls behind \`${a.clientApi}\`.\n\n## Contrast: Swallowing Errors\n\n\`\`\`js\n// Illustrative fake code: not from this repo.\ntry { await save(); } catch {}\n\`\`\`\n\nBetter shape: translate errors through \`${a.error}\` and surface a useful UI state.\n\n## Contrast: Missing Permission Filter\n\n\`\`\`ts\n// Illustrative fake code: not from this repo.\nreturn db("records").where({ id });\n\`\`\`\n\nBetter shape in real multi-user code: filter by both resource id and authorized owner/team id.\n\n## Contrast: Casual Contract Change\n\n\`\`\`ts\n// Illustrative fake code: not from this repo.\nreturn { item: row }; // changed from { data: row }\n\`\`\`\n\nBetter shape: preserve the response envelope used by \`${a.clientApi}\` and controllers.\n${verification(meta)}`;
}

function reviewKatas(meta, a) {
  const names = ["Missing validation", "Unbounded list query", "UI calls fetch directly", "Raw error leaked", "Schema change without seed update", "Delete without confirmation", "Duplicated business rule", "Auth check only in UI"];
  return header(meta, "Review Katas") + names.map((name, i) => `## Kata ${i + 1}: ${name}\n\n**Author intent:** Improve ${meta.feature}.\n\n**Fake diff summary:** Changes one flow that resembles \`${a.clientApp}\`, \`${a.service}\`, or \`${a.model}\`.\n\n**Your task:** Review this PR.\n\n**Expected findings:**\n\nBlocking:\n- Correctness, security, or data integrity issue if applicable.\n\nImportant:\n- Boundary ownership or missing test concern.\n\nOptional:\n- Naming, copy, or local style issue.\n\n**Good review comment example:**\n> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near \`${a.service}\` and add a regression check?\n`).join("\n") + verification(meta);
}

function testingStrategy(meta, a) {
  return header(meta, "Testing Strategy") + `## Layers\n\n| Layer | What belongs here | Anchor |\n| --- | --- | --- |\n| Unit | pure helpers and service branches | \`${a.service}\` |\n| API integration | route/controller/service/model contract | \`${a.routes}\` |\n| DB/migration | schema constraints and seed assumptions | \`${a.migration}\` |\n| UI | state, forms, rendering, error states | \`${a.clientApp}\` |\n| Contract/type | request and response shapes | \`${a.clientApi}\` |\n\n## What Not To Test\n\nDo not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.\n${verification(meta)}`;
}

function writingTests(meta, a) {
  return header(meta, "Writing Tests Here") + `## Test Recipes\n\n1. Happy path create: call API route, assert envelope and DB row.\n2. Validation failure: send invalid payload, assert 400 envelope.\n3. Not found: request missing id, assert 404 envelope.\n4. Persistence behavior: run migration, insert seed-like row, query through model.\n5. UI state: submit form and assert list refreshes.\n6. Contract test: ensure \`${a.clientApi}\` can unwrap server responses.\n7. Security placeholder: if auth exists, assert wrong user cannot access another user's record.\n\n## Commands\n\nUse package scripts from \`client/package.json\` and \`server/package.json\`. If no test script exists, the first contribution can add a small test harness.\n${verification(meta)}`;
}

function debugging(meta, a) {
  const scenarios = ["List is empty after seed", "Create returns 500", "UI shows stale data", "Migration fails locally", "Build passes but runtime API call fails"];
  return header(meta, "Systematic Debugging") + scenarios.map((scenario) => `## Scenario: ${scenario}\n\n**Reproduction:** Run the relevant dev servers and trigger the ${meta.nouns[0]} flow.\n\n**First question:** Is the bug in UI, API contract, service logic, or persistence?\n\n**Narrowing path:**\n1. Check browser network around \`${a.clientApi}\`.\n2. Check route registration around \`${a.routes}\`.\n3. Check service branching around \`${a.service}\`.\n4. Check query/schema around \`${a.model}\` and \`${a.migration}\`.\n\n**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.\n\n**Regression test to add:** one API integration test for the failing branch.\n\n**Senior lesson:** narrow cheaply before rewriting code.\n`).join("\n") + verification(meta);
}

function performance(meta, a) {
  return header(meta, "Performance Thinking") + `## Domains\n\n- Render: \`${a.clientApp}\` can rerender too much if derived state is duplicated.\n- Network: \`${a.clientApi}\` should avoid redundant requests.\n- Server: \`${a.service}\` should not do unnecessary serial IO.\n- Database: \`${a.model}\` should avoid unbounded list queries and missing indexes.\n- Bundle: client dependencies should match real UI need.\n\n## Measure First\n\nUse browser network/devtools, server logs, SQL query inspection, and bundle output before optimizing.\n\n## Drill\n\nFind one list endpoint and design pagination. Include API shape, SQL shape, UI state, and tests.\n${verification(meta)}`;
}

function security(meta, a) {
  return header(meta, "Security Checklist") + `| Risk | What to inspect | Anchor |\n| --- | --- | --- |\n| Authorization/IDOR | resource owner checks | \`${a.service}\` |\n| Input validation | server-side validation before writes | \`${a.service}\` |\n| SQL injection | Knex bindings vs raw strings | \`${a.model}\` |\n| XSS | rendering user content safely | \`${a.clientApp}\` |\n| CSRF/session | cookies and auth flows if present | \`${a.serverApp}\` |\n| Secrets | env handling | \`${a.env}\` |\n| File upload | type/size/storage if present | service/controller files |\n| External URL/SSRF | metadata fetching if present | service files |\n\n## Pre-Merge Checklist\n\n- Does the server enforce the rule, or only the UI?\n- Does every write validate input?\n- Can a user guess another resource id?\n- Are errors useful without leaking secrets?\n${verification(meta)}`;
}

function observability(meta, a) {
  return header(meta, "Observability And Operations") + `## What Exists\n\n- Health route or server startup around \`${a.serverApp}\` and \`${a.serverEntry}\`.\n- Error envelope around \`${a.error}\`.\n- Dev logging if middleware such as Morgan is mounted in \`${a.serverApp}\`.\n\n## How Would I Know This Broke?\n\n| Flow | Signal | Missing Signal To Consider |\n| --- | --- | --- |\n| API unavailable | health check fails | uptime alert |\n| Validation bug | 400/500 responses | structured error count |\n| Slow DB query | delayed API response | query duration logs |\n| UI contract drift | browser console/network error | frontend error boundary |\n${verification(meta)}`;
}

function goodFirst(meta, a) {
  const tickets = [
    "Add empty-state copy for filtered results",
    "Add loading state to primary list",
    "Add server validation message for missing required field",
    "Document one API endpoint in README",
    "Add seed data for an edge case",
    "Add API integration test for not-found behavior",
    "Add pagination parameters to docs",
    "Improve error message in client API wrapper",
    "Add aria-labels to destructive buttons",
    "Add command notes to verification log",
    "Add one migration rollback note",
    "Create a small fixture builder",
    "Add a status badge component",
    "Add one debug scenario to docs",
    "Add a PR checklist to README",
  ];
  return header(meta, "Good First Tickets") + tickets.map((title, i) => `## Ticket ${i + 1}: ${title}\n\n**Difficulty:** Easy\n\n**Estimated time:** 30-90 minutes\n\n**Skills practiced:** reading existing patterns, small implementation, verification.\n\n**Story:** As a maintainer, I want a focused improvement so the project is easier to learn and safer to change.\n\n**Why this is a good contribution:** Small blast radius and follows existing files.\n\n**Acceptance criteria:**\n- [ ] Change is limited and documented.\n- [ ] Existing behavior still works.\n- [ ] Verification notes are updated if relevant.\n\n**Read these anchors first:**\n- \`${a.clientApp}\` - UI behavior.\n- \`${a.service}\` - business rules.\n- \`${a.model}\` - persistence if needed.\n\n**Files likely touched:** one or two files near the anchor.\n\n**Implementation plan:**\n1. Read the anchor.\n2. Make the smallest change.\n3. Run the narrowest useful check.\n4. Write a concise PR summary.\n\n**What could go wrong:** accidental cross-layer refactor.\n\n**Review questions:** Did this preserve the existing contract?\n`).join("\n") + verification(meta);
}

function midLevelTickets(meta, a) {
  const tickets = ["Add pagination end to end", "Add integration tests for write flow", "Add ownership checks if auth exists", "Add schema index for list filters", "Add optimistic UI update with rollback", "Add CSV/export flow test", "Add validation schema shared by routes", "Add query logging for slow endpoints", "Add error boundary in client", "Add migration safety checklist"];
  return header(meta, "Mid-Level Feature Tickets") + tickets.map((title, i) => `## Ticket ${i + 1}: ${title}\n\n**Difficulty:** Medium\n\n**Design notes required:** API contract, data shape, test plan, rollback plan.\n\n**Likely anchors:** \`${a.clientApp}\`, \`${a.clientApi}\`, \`${a.routes}\`, \`${a.service}\`, \`${a.model}\`, \`${a.migration}\`.\n\n**Risk:** Contract drift or schema change without tests.\n\n**Rollback:** Keep migration reversible and preserve old response shape where possible.\n`).join("\n") + verification(meta);
}

function seniorProjects(meta, a) {
  const projects = ["Production-grade test harness", "Authorization and ownership model", "Pagination and indexing migration", "Observability baseline", "Performance review and query tuning", "API contract versioning", "Refactor toward feature modules"];
  return header(meta, "Senior Build Projects") + projects.map((title, i) => `## Project ${i + 1}: ${title}\n\n**Problem statement:** Mature ${meta.title} from learning scaffold toward maintainable production habits.\n\n**Product value:** Safer changes and clearer ownership.\n\n**Design checklist:** contract, migration, test, security, performance, rollout.\n\n**Likely files:** \`${a.clientApp}\`, \`${a.routes}\`, \`${a.service}\`, \`${a.model}\`, \`${a.migration}\`.\n\n**Security plan:** define authorization boundary before implementation.\n\n**Performance plan:** measure list/query/render behavior before optimizing.\n\n**Rollout/rollback:** split schema and behavior changes when possible.\n`).join("\n") + verification(meta);
}

function refactorKatas(meta, a) {
  return header(meta, "Refactor And Design Katas") + `- Identify a boundary leak between \`${a.controller}\` and \`${a.service}\`.\n- Propose a transaction boundary for a multi-write flow.\n- Split a large UI component without changing behavior.\n- Improve type safety around \`${a.clientApi}\`.\n- Add pagination without breaking existing clients.\n- Reduce a hypothetical N+1 query in \`${a.model}\`.\n- Write an RFC for auth/ownership.\n- Review a fake PR that changes \`${a.migration}\` without rollback notes.\n\nSelf-grade: strong answers name blast radius, migration path, test plan, and rollback.\n${verification(meta)}`;
}

function codeReview(meta, a) {
  return header(meta, "Code Review Mindset") + `Review layers:\n\n1. Does it work?\n2. Is it correct for edge cases?\n3. Will it stay correct?\n4. Does it fit the codebase boundaries?\n5. Is it kind to future maintainers?\n\nRepo-specific checklist:\n- UI behavior near \`${a.clientApp}\`.\n- HTTP contract near \`${a.clientApi}\` and \`${a.routes}\`.\n- Business rules near \`${a.service}\`.\n- Query shape near \`${a.model}\`.\n- Schema changes near \`${a.migration}\`.\n\nGood review language:\n> Could we move this rule into the service so every API caller gets the same protection?\n${verification(meta)}`;
}

function prsRfcs(meta, a) {
  return header(meta, "Writing PRs And RFCs") + `## PR Template\n\n- What changed:\n- Why:\n- How tested:\n- Screenshots/logs:\n- Risks:\n- Follow-ups:\n\n## Commit Message Shape\n\n\`area: concise behavior change\`\n\nExample: \`${meta.nouns[0]}: add validation for empty title\`.\n\n## RFC Template\n\n- Problem\n- Current behavior with anchors: \`${a.clientApp}\`, \`${a.service}\`, \`${a.model}\`\n- Options considered\n- Proposed design\n- Migration plan\n- Test plan\n- Rollout/rollback\n- Open questions\n${verification(meta)}`;
}

function maintainerComms(meta) {
  return header(meta, "Maintainer Communication") + `## Ask For Help Without Outsourcing Thinking\n\nGood question shape:\n- What I tried\n- What I expected\n- What happened\n- Files inspected\n- Minimal reproduction\n- My current hypothesis\n\n## Templates\n\nBug report: include command, environment, reproduction, expected result, actual result.\n\nFeature proposal: explain user value, existing pattern, blast radius, test plan.\n\nResponding to review: acknowledge, state change, mention verification.\n\nRespectful disagreement: name the tradeoff and propose a small experiment.\n${verification(meta)}`;
}

function interviewPrep(meta, a) {
  return header(meta, "Interview Prep From This Repo") + `This file is the interview-prep addendum requested for full-stack JS roles. Use ${meta.title} as your concrete story bank.\n\n## Language And Runtime Questions\n\n1. How does async/await move a request through this app?\n   - Junior: identifies \`${a.clientApi}\` or \`${a.controller}\` as async.\n   - Mid-level: explains promise failure and error propagation.\n   - Senior: discusses latency, parallelism, timeout, and observability.\n2. What is the difference between browser state and server state here?\n   - Junior: points to \`${a.clientApp}\`.\n   - Mid-level: explains refresh and stale data.\n   - Senior: discusses cache invalidation and contract boundaries.\n\n## React Questions\n\n- Where should form state live for this app?\n- What would make a component rerender unnecessarily?\n- How would you add an optimistic update safely?\n\nUse anchors: \`${a.clientApp}\`, \`${a.clientApi}\`.\n\n## Node/Express Questions\n\n- Why keep controllers thin?\n- How does middleware order affect behavior?\n- How are errors translated?\n\nUse anchors: \`${a.serverApp}\`, \`${a.routes}\`, \`${a.controller}\`, \`${a.error}\`.\n\n## Database Questions\n\n- What does the migration commit the team to?\n- Where would you add an index?\n- When do you need a transaction?\n\nUse anchors: \`${a.migration}\`, \`${a.model}\`.\n\n## System Design Prompts\n\n1. Scale ${meta.feature} to 10x records.\n2. Add multi-user ownership and authorization.\n3. Add audit logging for destructive actions.\n4. Add pagination and filtering without breaking clients.\n5. Add observability for slow requests.\n\n## Debugging Questions\n\n- The UI says save succeeded, but the record does not appear. Trace from \`${a.clientApp}\` to \`${a.model}\`.\n- A migration works locally but fails in CI. What do you inspect?\n- A user can access another user's resource. Where should the fix live?\n\n## Code Review Questions\n\nReview a PR that moves validation from \`${a.service}\` into \`${a.clientApp}\`. Strong answer: UI validation improves UX, but server validation protects the system boundary.\n\n## Behavioral Prompts\n\n- Tell me about a time you reduced blast radius. Use a good-first ticket from this repo.\n- Tell me about a time you disagreed in review. Use the PR/RFC guide.\n- Tell me about a time you debugged across layers. Use the trace table.\n\n## Self-Grading\n\n- Weak: talks generally about React/Node without file anchors.\n- Solid: names files and traces data shape.\n- Strong: explains invariant, risk, testing strategy, and alternative design.\n${verification(meta)}`;
}

function cheatsheet(meta) {
  return header(meta, "Command Cheatsheet") + commandList(meta).map(([name, cmd, status]) => `| ${name} | \`${cmd}\` | ${status} |`).join("\n") + "\n";
}

function riskRegister(meta, a) {
  return header(meta, "Risk Register") + `| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| Missing tests | No direct tests confirmed | \`${a.routes}\`, \`${a.service}\` | regressions | medium | API integration | add tests | medium |\n| Authorization gap | Demo projects may not enforce ownership | \`${a.service}\` | data exposure | medium | cross-user access test | add owner filters | medium |\n| Unbounded list | List endpoints may lack pagination | \`${a.model}\` | slow queries | medium | seed many rows | add limit/cursor | medium |\n| Error opacity | minimal observability | \`${a.error}\` | hard debugging | medium | failure scenario | structured logs | medium |\n`;
}

function rubrics(meta) {
  return header(meta, "Learning Rubrics") + `| Level | Observable Behavior |\n| --- | --- |\n| Junior | Runs the app, names layers, traces one flow, makes small safe changes. |\n| Mid-level | Designs cross-layer changes, adds tests, preserves contracts, debugs systematically. |\n| Senior | Critiques architecture, names tradeoffs, reduces blast radius, writes migration and rollback plans. |\n\nSelf-check: can you explain ${meta.feature} using concrete files, not generic stack terms?\n`;
}

function verificationLog(meta, a) {
  return header(meta, "Verification Log") + `Date: 2026-07-04\n\n## Inspected\n\n- \`${a.clientApp}\`\n- \`${a.clientApi}\`\n- \`${a.serverApp}\`\n- \`${a.routes}\`\n- \`${a.controller}\`\n- \`${a.service}\`\n- \`${a.model}\`\n- \`${a.migration}\`\n- \`${a.seed}\`\n\n## Commands\n\nCommands were inferred from package manifests during generation. Workspace-level verification after generation should run:\n\n\`\`\`bash\nnpm run check:manifests\n\`\`\`\n\n## Uncertainties\n\n- Some project folders are educational scaffolds and may not have full automated tests yet.\n- PostgreSQL must be created locally before API routes that touch persistence can be verified.\n`;
}

function genericIndex(meta, title, items) {
  return header(meta, title) + items.map((item) => `- ${item}`).join("\n") + verification(meta);
}

function contentFor(file, meta, a) {
  switch (file) {
    case "README.md": return rootReadme(meta, a);
    case "00-fast-track.md": return fastTrack(meta, a);
    case "01-codebase-cartography/README.md": return genericIndex(meta, "Codebase Cartography", ["Map the system before changing it.", "Start with reading order, then trace key flows.", "Use domain glossary during interviews and code review."]);
    case "01-codebase-cartography/01-system-map.md": return systemMap(meta, a);
    case "01-codebase-cartography/02-file-reading-order.md": return readingOrder(meta, a);
    case "01-codebase-cartography/03-domain-glossary.md": return glossary(meta);
    case "01-codebase-cartography/04-runtime-and-tooling-map.md": return toolingMap(meta);
    case "01-codebase-cartography/05-key-flows.md": return keyFlows(meta, a);
    case "02-stack-and-language-mastery/README.md": return genericIndex(meta, "Stack And Language Mastery", ["Learn JS/TS runtime behavior through real async flows.", "Learn React state and effects through the UI.", "Learn Express and Knex through the API stack."]);
    case "02-stack-and-language-mastery/01-language-runtime-model.md": return languageModel(meta, a);
    case "02-stack-and-language-mastery/02-framework-mental-models.md": return frameworkModels(meta, a);
    case "02-stack-and-language-mastery/03-type-system-and-contracts.md": return typeContracts(meta, a);
    case "02-stack-and-language-mastery/04-tooling-and-build-system.md": return buildSystem(meta);
    case "03-architecture-and-patterns/README.md": return genericIndex(meta, "Architecture And Patterns", ["Study boundaries before feature work.", "Use pattern cards to recognize reusable shapes.", "Use critique docs to practice senior judgment."]);
    case "03-architecture-and-patterns/01-boundaries-and-layers.md": return boundaries(meta, a);
    case "03-architecture-and-patterns/02-data-model-and-persistence.md": return dataPersistence(meta, a);
    case "03-architecture-and-patterns/03-validation-auth-and-permissions.md": return validationAuth(meta, a);
    case "03-architecture-and-patterns/04-side-effects-async-and-reliability.md": return sideEffects(meta, a);
    case "03-architecture-and-patterns/05-pattern-catalog.md": return patternCatalog(meta, a);
    case "03-architecture-and-patterns/06-architecture-critique.md": return critique(meta, a);
    case "04-code-reading-gym/README.md": return genericIndex(meta, "Code Reading Gym", ["Annotate real files.", "Trace values through layers.", "Practice review through fake PRs tied to real anchors."]);
    case "04-code-reading-gym/01-annotation-drills.md": return annotationDrills(meta, a);
    case "04-code-reading-gym/02-trace-tables.md": return traceTables(meta, a);
    case "04-code-reading-gym/03-fake-code-contrasts.md": return fakeCodeContrasts(meta, a);
    case "04-code-reading-gym/04-review-katas.md": return reviewKatas(meta, a);
    case "05-quality-engineering/README.md": return genericIndex(meta, "Quality Engineering", ["Testing, debugging, performance, security, and operations habits.", "Use this module before taking mid-level tickets."]);
    case "05-quality-engineering/01-testing-strategy.md": return testingStrategy(meta, a);
    case "05-quality-engineering/02-writing-tests-here.md": return writingTests(meta, a);
    case "05-quality-engineering/03-systematic-debugging.md": return debugging(meta, a);
    case "05-quality-engineering/04-performance-thinking.md": return performance(meta, a);
    case "05-quality-engineering/05-security-checklist.md": return security(meta, a);
    case "05-quality-engineering/06-observability-and-operations.md": return observability(meta, a);
    case "06-contribution-practice/README.md": return genericIndex(meta, "Contribution Practice", ["Start with small tickets.", "Move to cross-layer design.", "Practice senior katas when you can explain risk."]);
    case "06-contribution-practice/01-good-first-tickets.md": return goodFirst(meta, a);
    case "06-contribution-practice/02-mid-level-feature-tickets.md": return midLevelTickets(meta, a);
    case "06-contribution-practice/03-senior-build-projects.md": return seniorProjects(meta, a);
    case "06-contribution-practice/04-refactor-and-design-katas.md": return refactorKatas(meta, a);
    case "07-career-and-collaboration/README.md": return genericIndex(meta, "Career And Collaboration", ["Practice review language.", "Write PRs and RFCs.", "Use this codebase for interview prep."]);
    case "07-career-and-collaboration/01-code-review-mindset.md": return codeReview(meta, a);
    case "07-career-and-collaboration/02-writing-prs-and-rfcs.md": return prsRfcs(meta, a);
    case "07-career-and-collaboration/03-maintainer-communication.md": return maintainerComms(meta);
    case "07-career-and-collaboration/04-interview-prep-from-this-repo.md": return interviewPrep(meta, a);
    case "08-reference/command-cheatsheet.md": return cheatsheet(meta);
    case "08-reference/risk-register.md": return riskRegister(meta, a);
    case "08-reference/learning-rubrics.md": return rubrics(meta);
    case "08-reference/verification-log.md": return verificationLog(meta, a);
    default: return header(meta, path.basename(file, ".md")) + verification(meta);
  }
}

for (const project of projects) {
  if (!(await exists(project))) {
    throw new Error(`Missing project folder: ${project}`);
  }

  const meta = await inspect(project);
  const a = anchors(meta);
  const base = path.join(project, "docs", "upskill");

  for (const file of tree) {
    const output = path.join(base, file);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, contentFor(file, meta, a));
  }

  console.log(`Generated upskill docs for ${project}`);
}
