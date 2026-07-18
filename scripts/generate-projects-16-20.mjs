import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projects = [
  {
    slug: "16-team-project-management",
    title: "Team Project Management",
    port: 4116,
    database: "team_project_management_dev",
    resource: "tasks",
    entity: "task",
    org: "workspace",
    tables: ["workspaces", "projects", "tasks", "activity_events"],
    fields: [
      ["title", "string", "Design launch checklist"],
      ["status", "string", "todo"],
      ["priority", "string", "high"],
      ["owner", "string", "Ada"],
      ["metadata", "json", { milestone: "MVP", estimate: 5 }]
    ],
    features: ["workspace/project/task hierarchy", "RBAC-ready membership shape", "activity feed", "dashboard workload stats", "Gantt-ready dates"],
    seeds: [
      { title: "Draft roadmap", status: "todo", priority: "high", owner: "Ada", metadata: { milestone: "Planning", estimate: 8 } },
      { title: "Implement activity feed", status: "in_progress", priority: "medium", owner: "Grace", metadata: { milestone: "MVP", estimate: 5 } },
      { title: "Review access roles", status: "done", priority: "high", owner: "Linus", metadata: { milestone: "Security", estimate: 3 } }
    ]
  },
  {
    slug: "17-support-ticket-system",
    title: "Customer Support Ticket System",
    port: 4117,
    database: "support_ticket_system_dev",
    resource: "tickets",
    entity: "ticket",
    org: "team",
    tables: ["teams", "customers", "tickets", "ticket_messages", "sla_events"],
    fields: [
      ["subject", "string", "Cannot access account"],
      ["status", "string", "open"],
      ["priority", "string", "urgent"],
      ["owner", "string", "Support Queue"],
      ["metadata", "json", { channel: "email", slaHours: 4 }]
    ],
    features: ["ticket lifecycle", "SLA tracking", "assignment workflow", "internal notes", "customer portal"],
    seeds: [
      { subject: "Cannot access account", status: "open", priority: "urgent", owner: "Triage", metadata: { channel: "email", slaHours: 4 } },
      { subject: "Billing receipt request", status: "pending", priority: "medium", owner: "Maya", metadata: { channel: "portal", slaHours: 24 } },
      { subject: "Feature question", status: "resolved", priority: "low", owner: "Noah", metadata: { channel: "chat", slaHours: 48 } }
    ]
  },
  {
    slug: "18-learning-management-system",
    title: "Learning Management System",
    port: 4118,
    database: "learning_management_system_dev",
    resource: "courses",
    entity: "course",
    org: "school",
    tables: ["schools", "courses", "modules", "lessons", "enrollments", "quiz_attempts"],
    fields: [
      ["title", "string", "Full-Stack Foundations"],
      ["status", "string", "published"],
      ["priority", "string", "featured"],
      ["owner", "string", "Instructor Ada"],
      ["metadata", "json", { lessons: 18, level: "intermediate" }]
    ],
    features: ["course/module/lesson hierarchy", "student enrollment", "progress tracking", "quiz attempts", "certificate-ready reporting"],
    seeds: [
      { title: "Full-Stack Foundations", status: "published", priority: "featured", owner: "Instructor Ada", metadata: { lessons: 18, level: "intermediate" } },
      { title: "SQL For Product Engineers", status: "draft", priority: "high", owner: "Instructor Grace", metadata: { lessons: 12, level: "mid" } },
      { title: "React State Patterns", status: "published", priority: "medium", owner: "Instructor Linus", metadata: { lessons: 9, level: "junior" } }
    ]
  },
  {
    slug: "19-realtime-chat-platform",
    title: "Real-Time Chat Platform",
    port: 4119,
    database: "realtime_chat_platform_dev",
    resource: "conversations",
    entity: "conversation",
    org: "workspace",
    tables: ["workspaces", "conversations", "conversation_members", "messages", "message_events"],
    fields: [
      ["title", "string", "Launch War Room"],
      ["status", "string", "active"],
      ["priority", "string", "high"],
      ["owner", "string", "Platform Team"],
      ["metadata", "json", { unread: 12, mode: "group" }]
    ],
    features: ["conversation membership", "message history", "read-receipt model", "presence events", "Socket.io-ready API boundaries"],
    seeds: [
      { title: "Launch War Room", status: "active", priority: "high", owner: "Platform Team", metadata: { unread: 12, mode: "group" } },
      { title: "Design Review", status: "active", priority: "medium", owner: "Design", metadata: { unread: 3, mode: "channel" } },
      { title: "Incident Archive", status: "archived", priority: "low", owner: "Ops", metadata: { unread: 0, mode: "group" } }
    ]
  },
  {
    slug: "20-marketplace-platform",
    title: "Multi-Vendor Marketplace",
    port: 4120,
    database: "marketplace_platform_dev",
    resource: "listings",
    entity: "listing",
    org: "vendor",
    tables: ["vendors", "listings", "product_variants", "orders", "payments", "reviews"],
    fields: [
      ["title", "string", "Modular Desk Kit"],
      ["status", "string", "active"],
      ["priority", "string", "featured"],
      ["owner", "string", "Northwind Goods"],
      ["metadata", "json", { price: 249, inventory: 14 }]
    ],
    features: ["vendor storefronts", "product variants", "cart/order model", "payment-record boundaries", "review moderation"],
    seeds: [
      { title: "Modular Desk Kit", status: "active", priority: "featured", owner: "Northwind Goods", metadata: { price: 249, inventory: 14 } },
      { title: "Studio Light Pack", status: "active", priority: "medium", owner: "Contoso Supply", metadata: { price: 129, inventory: 42 } },
      { title: "Prototype Chair", status: "draft", priority: "low", owner: "Fabrikam Studio", metadata: { price: 399, inventory: 3 } }
    ]
  }
];

const root = process.cwd();

async function write(project, relativePath, content) {
  const filePath = path.join(root, project.slug, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function env(project) {
  return `NODE_ENV=development
PORT=${project.port}
CLIENT_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${project.database}
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
`;
}

function readme(project) {
  return `# ${project.title}

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Features

${project.features.map((feature) => `- ${feature}`).join("\n")}

## Run Locally

\`\`\`bash
npm --prefix server install
npm --prefix client install
npm --prefix server run migrate
npm --prefix server run seed
npm --prefix server run dev
npm --prefix client run dev
\`\`\`

Server defaults to \`http://localhost:${project.port}\`.

## API

- \`GET /api/${project.resource}\`
- \`GET /api/${project.resource}/dashboard\`
- \`GET /api/${project.resource}/activity\`
- \`GET /api/${project.resource}/:id\`
- \`POST /api/${project.resource}\`
- \`PUT /api/${project.resource}/:id\`
- \`DELETE /api/${project.resource}/:id\`

## Learning Goals

This project is intentionally bigger than Tier 1: multiple tables, dashboard aggregation, activity events, JSON metadata, and service-layer boundaries that prepare the learner for mid-level full-stack ownership.
`;
}

function architecture(project) {
  return `# ${project.title} Architecture

## System Shape

\`\`\`text
React dashboard
  -> client API service
  -> Express routes/controllers
  -> service layer
  -> Knex models
  -> PostgreSQL tables: ${project.tables.join(", ")}
\`\`\`

## Boundaries

- UI owns workflow state and presentation.
- Client API owns HTTP details and response unwrapping.
- Controllers translate HTTP requests into service calls.
- Services own validation, dashboard calculations, and activity-event decisions.
- Models own Knex queries only.
- Migrations own durable schema.

## Larger-App Concepts

${project.features.map((feature) => `- ${feature}`).join("\n")}

## Senior Review Questions

- Which writes need transactions as this grows?
- Which list queries need pagination or indexes?
- What authorization boundary should scope ${project.resource} to a ${project.org}?
- What events should be idempotent?
- What metrics would reveal a slow dashboard?
`;
}

function clientPackage(project) {
  return json({
    name: `${project.slug}-client`,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite --host 0.0.0.0",
      build: "tsc -b && vite build",
      preview: "vite preview --host 0.0.0.0"
    },
    dependencies: {
      "@vitejs/plugin-react": "^4.3.4",
      vite: "^6.0.7",
      typescript: "^5.7.2",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      axios: "^1.7.9"
    },
    devDependencies: {}
  });
}

function serverPackage(project) {
  return json({
    name: `${project.slug}-server`,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "tsx watch src/server.ts",
      build: "tsc -p tsconfig.json",
      start: "node dist/src/server.js",
      migrate: "knex --knexfile knexfile.ts migrate:latest",
      seed: "knex --knexfile knexfile.ts seed:run"
    },
    dependencies: {
      express: "^4.21.2",
      knex: "^3.1.0",
      pg: "^8.13.1",
      cors: "^2.8.5",
      dotenv: "^16.4.7",
      helmet: "^8.0.0",
      morgan: "^1.10.0"
    },
    devDependencies: {
      "@types/cors": "^2.8.17",
      "@types/express": "^4.17.21",
      "@types/morgan": "^1.9.9",
      "@types/node": "^22.10.2",
      tsx: "^4.19.2",
      typescript: "^5.7.2"
    }
  });
}

function tsconfig({ server = false } = {}) {
  return json(server ? {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Node",
      outDir: "dist",
      rootDir: ".",
      strict: false,
      esModuleInterop: true,
      skipLibCheck: true
    },
    include: ["src", "knexfile.ts", "db/**/*.ts"]
  } : {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ES2022"],
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  });
}

function viteConfig() {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});
`;
}

function clientTypes(project) {
  return `export type RecordItem = {
  id: number;
${project.fields.map(([name]) => `  ${name}: ${name === "metadata" ? "Record<string, unknown>" : "string"};`).join("\n")}
  created_at: string;
  updated_at: string;
};

export type Dashboard = {
  total: number;
  byStatus: Array<{ status: string; count: string | number }>;
  recentActivity: Array<{ id: number; event_type: string; message: string; created_at: string }>;
};
`;
}

function clientApi(project) {
  return `import axios from "axios";
import type { Dashboard, RecordItem } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:${project.port}/api",
  headers: { "Content-Type": "application/json" }
});

function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data as T;
}

export async function listRecords(params: Record<string, string> = {}) {
  return unwrap<RecordItem[]>(await api.get("/${project.resource}", { params }));
}

export async function loadDashboard() {
  return unwrap<Dashboard>(await api.get("/${project.resource}/dashboard"));
}

export async function loadActivity() {
  return unwrap<Dashboard["recentActivity"]>(await api.get("/${project.resource}/activity"));
}

export async function createRecord(payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.post("/${project.resource}", payload));
}

export async function updateRecord(id: number, payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.put(\`/${project.resource}/\${id}\`, payload));
}

export async function deleteRecord(id: number) {
  return unwrap<RecordItem>(await api.delete(\`/${project.resource}/\${id}\`));
}
`;
}

function clientApp(project) {
  const form = Object.fromEntries(project.fields.map(([name, , sample]) => [name, sample]));
  return `import { useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import "./index.css";
import { createRecord, deleteRecord, listRecords, loadActivity, loadDashboard, updateRecord } from "./services/api";
import type { Dashboard, RecordItem } from "./types";

const emptyForm = ${JSON.stringify(form, null, 2)};

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activity, setActivity] = useState<Dashboard["recentActivity"]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const visibleRecords = useMemo(() => {
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()));
  }, [records, search]);

  async function refresh() {
    try {
      const [nextRecords, nextDashboard, nextActivity] = await Promise.all([
        listRecords(),
        loadDashboard(),
        loadActivity()
      ]);
      setRecords(nextRecords);
      setDashboard(nextDashboard);
      setActivity(nextActivity);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load workspace");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateField(field: string, value: string) {
    setForm((current: any) => ({
      ...current,
      [field]: field === "metadata" ? safeMetadata(value) : value
    }));
  }

  function metadataValue() {
    return typeof form.metadata === "string" ? form.metadata : JSON.stringify(form.metadata, null, 2);
  }

  async function saveRecord(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editingId) {
        await updateRecord(editingId, form);
      } else {
        await createRecord(form);
      }
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save record");
    }
  }

  function editRecord(record: RecordItem) {
    setEditingId(record.id);
    setForm({ ...record });
  }

  async function removeRecord(record: RecordItem) {
    if (!window.confirm(\`Delete "\${record.title}"?\`)) return;
    await deleteRecord(record.id);
    await refresh();
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p>Project ${project.slug.split("-")[0]}</p>
          <h1>${project.title}</h1>
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace" />
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.metrics}>
        <article><span>{dashboard?.total ?? records.length}</span><p>Total records</p></article>
        <article><span>{dashboard?.byStatus?.length ?? 0}</span><p>Status buckets</p></article>
        <article><span>{activity.length}</span><p>Recent events</p></article>
      </section>

      <section className={styles.grid}>
        <form className={styles.panel} onSubmit={saveRecord}>
          <h2>{editingId ? "Edit" : "Create"} ${project.entity}</h2>
          ${project.fields.map(([field]) => field === "metadata"
            ? `<label>metadata JSON<textarea value={metadataValue()} onChange={(event) => updateField("metadata", event.target.value)} /></label>`
            : `<label>${field.replace(/_/g, " ")}<input value={form.${field} ?? ""} onChange={(event) => updateField("${field}", event.target.value)} /></label>`).join("\n          ")}
          <button>{editingId ? "Update" : "Create"}</button>
        </form>

        <section className={styles.list}>
          {visibleRecords.map((record) => (
            <article className={styles.card} key={record.id}>
              <div>
                <h3>{record.title}</h3>
                <p>{record.owner} · {record.status} · {record.priority}</p>
                <code>{JSON.stringify(record.metadata)}</code>
              </div>
              <div className={styles.actions}>
                <button onClick={() => editRecord(record)}>Edit</button>
                <button onClick={() => removeRecord(record)}>Delete</button>
              </div>
            </article>
          ))}
        </section>

        <aside className={styles.activity}>
          <h2>Activity</h2>
          {activity.map((event) => (
            <article key={event.id}>
              <strong>{event.event_type}</strong>
              <p>{event.message}</p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}

function safeMetadata(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
`;
}

function css() {
  return `.shell { min-height: 100vh; padding: 32px; background: #f4f6fb; color: #1f2433; }
.header { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 22px; }
.header h1 { margin: 0; font-size: 34px; }
.header p { margin: 0 0 6px; color: #657087; }
.header input, .panel input, .panel textarea { border: 1px solid #d9deea; border-radius: 8px; padding: 10px 12px; font: inherit; width: 100%; }
.metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.metrics article, .panel, .card, .activity { background: #fff; border: 1px solid #e2e6f0; border-radius: 8px; box-shadow: 0 12px 28px rgba(25, 32, 56, 0.06); }
.metrics article { padding: 18px; }
.metrics span { font-size: 30px; font-weight: 800; }
.metrics p { margin: 4px 0 0; color: #657087; }
.grid { display: grid; grid-template-columns: 360px minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
.panel { display: grid; gap: 12px; padding: 18px; }
.panel h2, .activity h2 { margin: 0; }
.panel label { display: grid; gap: 6px; color: #475069; text-transform: capitalize; }
.panel textarea { min-height: 110px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.panel button, .actions button { border: 0; border-radius: 8px; padding: 10px 12px; color: white; background: #2454d6; cursor: pointer; }
.list { display: grid; gap: 12px; }
.card { padding: 16px; display: flex; justify-content: space-between; gap: 14px; }
.card h3 { margin: 0 0 6px; }
.card p { margin: 0 0 10px; color: #525d73; }
.card code { display: block; white-space: pre-wrap; color: #40506d; }
.actions { display: flex; gap: 8px; align-items: start; }
.actions button:last-child { background: #bc3434; }
.activity { padding: 18px; display: grid; gap: 12px; }
.activity article { border-top: 1px solid #edf0f7; padding-top: 10px; }
.activity p { margin: 4px 0 0; color: #5c667d; }
.error { padding: 12px 14px; border-radius: 8px; background: #fff1f1; color: #9b1d1d; margin-bottom: 16px; }
@media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } .metrics { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: stretch; } }
`;
}

function indexCss() {
  return `* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
button, input, textarea { font: inherit; }
`;
}

function serverEnv(project) {
  return `import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const env = {
  port: Number(process.env.PORT || ${project.port}),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "${project.database}",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
  }
};
`;
}

function knexfile() {
  return `import type { Knex } from "knex";
import { env } from "./src/config/env";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: env.database,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" }
  }
};

export default config;
`;
}

function migration(project) {
  return `import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("${project.tables[0]}", (table) => {
    table.increments("id").primary();
    table.string("name", 160).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("${project.resource}", (table) => {
    table.increments("id").primary();
    table.integer("${project.org}_id").references("id").inTable("${project.tables[0]}").onDelete("CASCADE");
    table.string("title", 220).notNullable();
    table.string("status", 40).notNullable().defaultTo("active");
    table.string("priority", 40).notNullable().defaultTo("medium");
    table.string("owner", 160).notNullable();
    table.jsonb("metadata").notNullable().defaultTo("{}");
    table.timestamps(true, true);
    table.index(["status", "priority"]);
  });

  await knex.schema.createTable("activity_events", (table) => {
    table.increments("id").primary();
    table.integer("${project.entity}_id").references("id").inTable("${project.resource}").onDelete("CASCADE");
    table.string("event_type", 80).notNullable();
    table.text("message").notNullable();
    table.jsonb("payload").notNullable().defaultTo("{}");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("activity_events");
  await knex.schema.dropTableIfExists("${project.resource}");
  await knex.schema.dropTableIfExists("${project.tables[0]}");
}
`;
}

function seed(project) {
  return `import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("${project.resource}").del();
  await knex("${project.tables[0]}").del();

  const [org] = await knex("${project.tables[0]}").insert({ name: "Demo ${project.org}" }).returning("*");
  const records = await knex("${project.resource}").insert(${JSON.stringify(project.seeds, null, 2)}.map((record) => ({
    ...record,
    ${project.org}_id: org.id
  }))).returning("*");

  await knex("activity_events").insert(records.map((record) => ({
    ${project.entity}_id: record.id,
    event_type: "seeded",
    message: \`Created demo record: \${record.title}\`,
    payload: { status: record.status, priority: record.priority }
  })));
}
`;
}

function db() {
  return `import knex from "knex";
import { env } from "./env";

export const db = knex({
  client: "pg",
  connection: env.database,
  pool: { min: 0, max: 10 }
});
`;
}

function errors() {
  return `export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = "APP_ERROR") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
`;
}

function response() {
  return `import type { Response } from "express";

export function sendSuccess(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}
`;
}

function errorMiddleware() {
  return `import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export function notFoundMiddleware(_req: Request, res: Response) {
  return res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } });
}

export function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) {
  const appError = error instanceof AppError ? error : new AppError(error.message);
  return res.status(appError.statusCode).json({
    success: false,
    error: { message: appError.message, code: appError.code }
  });
}
`;
}

function model(project) {
  return `import { db } from "../config/db";

const table = "${project.resource}";

export function listRecords(query: { search?: string; status?: string; priority?: string }) {
  const builder = db(table).select("*").orderBy("updated_at", "desc");
  if (query.status) builder.where("status", query.status);
  if (query.priority) builder.where("priority", query.priority);
  if (query.search) builder.whereILike("title", \`%\${query.search}%\`);
  return builder.limit(100);
}

export function findRecord(id: number) {
  return db(table).where({ id }).first();
}

export async function createRecord(payload: Record<string, unknown>) {
  return db.transaction(async (trx) => {
    const [record] = await trx(table).insert(payload).returning("*");
    await trx("activity_events").insert({
      ${project.entity}_id: record.id,
      event_type: "created",
      message: \`Created \${record.title}\`,
      payload: { status: record.status, priority: record.priority }
    });
    return record;
  });
}

export async function updateRecord(id: number, payload: Record<string, unknown>) {
  return db.transaction(async (trx) => {
    const [record] = await trx(table)
      .where({ id })
      .update({ ...payload, updated_at: trx.fn.now() })
      .returning("*");
    await trx("activity_events").insert({
      ${project.entity}_id: id,
      event_type: "updated",
      message: \`Updated \${record.title}\`,
      payload
    });
    return record;
  });
}

export async function deleteRecord(id: number) {
  const [record] = await db(table).where({ id }).del().returning("*");
  return record;
}

export async function dashboard() {
  const [totalRow] = await db(table).count({ count: "*" });
  const byStatus = await db(table).select("status").count({ count: "*" }).groupBy("status").orderBy("status");
  const recentActivity = await activity();
  return { total: Number(totalRow.count), byStatus, recentActivity };
}

export function activity() {
  return db("activity_events").select("*").orderBy("created_at", "desc").limit(20);
}
`;
}

function service(project) {
  const allowed = JSON.stringify(project.fields.map(([name]) => name).concat(`${project.org}_id`));
  return `import * as model from "../models/model";
import { NotFoundError, ValidationError } from "../utils/errors";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer.");
  return id;
}

function sanitizePayload(payload: Record<string, unknown>) {
  const allowed = ${allowed};
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) clean[key] = payload[key];
  }
  if (!clean.title || typeof clean.title !== "string") {
    throw new ValidationError("A title is required.");
  }
  if (!clean.status) clean.status = "active";
  if (!clean.priority) clean.priority = "medium";
  if (!clean.owner) clean.owner = "Unassigned";
  if (!clean.metadata || typeof clean.metadata !== "object") clean.metadata = {};
  if (!clean.${project.org}_id) clean.${project.org}_id = 1;
  return clean;
}

export function list(query: { search?: string; status?: string; priority?: string }) {
  return model.listRecords(query);
}

export async function get(idValue: string) {
  const record = await model.findRecord(parseId(idValue));
  if (!record) throw new NotFoundError("${project.entity} not found.");
  return record;
}

export function create(payload: Record<string, unknown>) {
  return model.createRecord(sanitizePayload(payload));
}

export async function update(idValue: string, payload: Record<string, unknown>) {
  await get(idValue);
  return model.updateRecord(parseId(idValue), sanitizePayload(payload));
}

export async function remove(idValue: string) {
  await get(idValue);
  return model.deleteRecord(parseId(idValue));
}

export function dashboard() {
  return model.dashboard();
}

export function activity() {
  return model.activity();
}
`;
}

function controller() {
  return `import type { Request, Response } from "express";
import * as service from "../services/service";
import { sendSuccess } from "../utils/response";

export async function list(req: Request, res: Response) {
  return sendSuccess(res, await service.list(req.query as { search?: string; status?: string; priority?: string }));
}

export async function dashboard(_req: Request, res: Response) {
  return sendSuccess(res, await service.dashboard());
}

export async function activity(_req: Request, res: Response) {
  return sendSuccess(res, await service.activity());
}

export async function get(req: Request, res: Response) {
  return sendSuccess(res, await service.get(req.params.id));
}

export async function create(req: Request, res: Response) {
  return sendSuccess(res, await service.create(req.body), 201);
}

export async function update(req: Request, res: Response) {
  return sendSuccess(res, await service.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  return sendSuccess(res, await service.remove(req.params.id));
}
`;
}

function routes() {
  return `import { Router } from "express";
import * as controller from "../controllers/controller";

const router = Router();
const wrap = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);

router.get("/", wrap(controller.list));
router.get("/dashboard", wrap(controller.dashboard));
router.get("/activity", wrap(controller.activity));
router.get("/:id", wrap(controller.get));
router.post("/", wrap(controller.create));
router.put("/:id", wrap(controller.update));
router.delete("/:id", wrap(controller.remove));

export default router;
`;
}

function app(project) {
  return `import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes/routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ success: true, data: { service: "${project.slug}", status: "ok" } }));
app.use("/api/${project.resource}", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
`;
}

function server(project) {
  return `import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log("${project.title} API listening on port " + env.port);
});
`;
}

async function generate(project) {
  await write(project, ".env.example", env(project));
  await write(project, "README.md", readme(project));
  await write(project, "docs/architecture.md", architecture(project));
  await write(project, "client/package.json", clientPackage(project));
  await write(project, "client/tsconfig.json", tsconfig());
  await write(project, "client/vite.config.ts", viteConfig());
  await write(project, "client/index.html", `<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n`);
  await write(project, "client/src/vite-env.d.ts", `/// <reference types="vite/client" />\n\ndeclare module "*.module.css" {\n  const classes: Record<string, string>;\n  export default classes;\n}\n`);
  await write(project, "client/src/index.css", indexCss());
  await write(project, "client/src/App.module.css", css());
  await write(project, "client/src/types.ts", clientTypes(project));
  await write(project, "client/src/services/api.ts", clientApi(project));
  await write(project, "client/src/App.tsx", clientApp(project));
  await write(project, "client/src/main.tsx", `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n`);

  await write(project, "server/package.json", serverPackage(project));
  await write(project, "server/tsconfig.json", tsconfig({ server: true }));
  await write(project, "server/knexfile.ts", knexfile(project));
  await write(project, "server/db/migrations/001_init.ts", migration(project));
  await write(project, "server/db/seeds/001_seed.ts", seed(project));
  await write(project, "server/src/config/env.ts", serverEnv(project));
  await write(project, "server/src/config/db.ts", db());
  await write(project, "server/src/utils/errors.ts", errors());
  await write(project, "server/src/utils/response.ts", response());
  await write(project, "server/src/middleware/errorMiddleware.ts", errorMiddleware());
  await write(project, "server/src/models/model.ts", model(project));
  await write(project, "server/src/services/service.ts", service(project));
  await write(project, "server/src/controllers/controller.ts", controller());
  await write(project, "server/src/routes/routes.ts", routes());
  await write(project, "server/src/app.ts", app(project));
  await write(project, "server/src/server.ts", server(project));
}

for (const project of projects) {
  await generate(project);
  console.log(`Generated ${project.slug}`);
}
