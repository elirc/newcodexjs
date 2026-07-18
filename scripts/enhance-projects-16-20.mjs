import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projects = [
  {
    slug: "16-team-project-management",
    title: "Team Project Management",
    port: 4116,
    resource: "tasks",
    entity: "task",
    org: "workspace",
    orgTable: "workspaces",
    ownerLabel: "Assignee",
    risk: "delivery",
    features: [
      "workspace-scoped project/task records",
      "saved views for team dashboards",
      "comment threads for collaboration",
      "bulk workflow updates",
      "archive/restore lifecycle",
      "audit log for reviewability"
    ],
    statuses: ["todo", "in_progress", "blocked", "done", "archived"],
    priorities: ["low", "medium", "high", "critical"],
    sample: {
      title: "Coordinate launch readiness",
      status: "in_progress",
      priority: "critical",
      owner: "Ada",
      metadata: { milestone: "Launch", estimate: 8, department: "Product" }
    }
  },
  {
    slug: "17-support-ticket-system",
    title: "Customer Support Ticket System",
    port: 4117,
    resource: "tickets",
    entity: "ticket",
    org: "team",
    orgTable: "teams",
    ownerLabel: "Agent",
    risk: "SLA",
    features: [
      "team-scoped ticket queues",
      "SLA and priority metadata",
      "internal comments",
      "saved triage views",
      "bulk assignment/status movement",
      "audit trail for customer-impacting actions"
    ],
    statuses: ["open", "pending", "escalated", "resolved", "archived"],
    priorities: ["low", "medium", "high", "urgent"],
    sample: {
      title: "Enterprise customer cannot access billing",
      status: "escalated",
      priority: "urgent",
      owner: "Triage",
      metadata: { channel: "email", slaHours: 4, customerTier: "enterprise" }
    }
  },
  {
    slug: "18-learning-management-system",
    title: "Learning Management System",
    port: 4118,
    resource: "courses",
    entity: "course",
    org: "school",
    orgTable: "schools",
    ownerLabel: "Instructor",
    risk: "learner-progress",
    features: [
      "school-scoped course catalog",
      "publication lifecycle",
      "review comments",
      "saved instructor views",
      "bulk course status operations",
      "audit log for curriculum changes"
    ],
    statuses: ["draft", "review", "published", "retired", "archived"],
    priorities: ["low", "medium", "high", "featured"],
    sample: {
      title: "Advanced Full-Stack Systems",
      status: "review",
      priority: "featured",
      owner: "Instructor Ada",
      metadata: { lessons: 24, level: "mid", certificate: true }
    }
  },
  {
    slug: "19-realtime-chat-platform",
    title: "Real-Time Chat Platform",
    port: 4119,
    resource: "conversations",
    entity: "conversation",
    org: "workspace",
    orgTable: "workspaces",
    ownerLabel: "Channel Owner",
    risk: "message-delivery",
    features: [
      "workspace-scoped conversations",
      "presence/readiness metadata",
      "moderation comments",
      "saved operational views",
      "bulk archive/mute operations",
      "auditability for moderation events"
    ],
    statuses: ["active", "muted", "incident", "archived"],
    priorities: ["low", "medium", "high", "critical"],
    sample: {
      title: "Incident Command Room",
      status: "incident",
      priority: "critical",
      owner: "Ops Lead",
      metadata: { unread: 18, mode: "group", retentionDays: 90 }
    }
  },
  {
    slug: "20-marketplace-platform",
    title: "Multi-Vendor Marketplace",
    port: 4120,
    resource: "listings",
    entity: "listing",
    org: "vendor",
    orgTable: "vendors",
    ownerLabel: "Merchant",
    risk: "financial",
    features: [
      "vendor-scoped product listings",
      "moderation lifecycle",
      "review comments",
      "saved merchandising views",
      "bulk listing operations",
      "auditability for revenue-impacting changes"
    ],
    statuses: ["draft", "active", "flagged", "paused", "archived"],
    priorities: ["low", "medium", "high", "featured"],
    sample: {
      title: "Enterprise Desk Bundle",
      status: "active",
      priority: "featured",
      owner: "Northwind Goods",
      metadata: { price: 349, inventory: 24, category: "office" }
    }
  }
];

const root = process.cwd();

async function write(project, relativePath, content) {
  const filePath = path.join(root, project.slug, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

function migration(project) {
  return `import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("${project.resource}", (table) => {
    table.timestamp("due_at").nullable();
    table.string("risk_level", 40).notNullable().defaultTo("normal");
    table.integer("version").notNullable().defaultTo(1);
    table.timestamp("archived_at").nullable();
    table.timestamp("deleted_at").nullable();
    table.index(["${project.org}_id", "status", "priority"]);
    table.index(["deleted_at", "archived_at"]);
  });

  await knex.schema.createTable("comments", (table) => {
    table.increments("id").primary();
    table.integer("${project.entity}_id").references("id").inTable("${project.resource}").onDelete("CASCADE");
    table.string("author", 160).notNullable();
    table.text("body").notNullable();
    table.boolean("is_internal").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("saved_views", (table) => {
    table.increments("id").primary();
    table.integer("${project.org}_id").references("id").inTable("${project.orgTable}").onDelete("CASCADE");
    table.string("name", 160).notNullable();
    table.jsonb("filters").notNullable().defaultTo("{}");
    table.string("created_by", 160).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("audit_log", (table) => {
    table.increments("id").primary();
    table.integer("${project.entity}_id").nullable().references("id").inTable("${project.resource}").onDelete("SET NULL");
    table.string("actor", 160).notNullable();
    table.string("action", 80).notNullable();
    table.jsonb("before").nullable();
    table.jsonb("after").nullable();
    table.string("request_id", 80).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_log");
  await knex.schema.dropTableIfExists("saved_views");
  await knex.schema.dropTableIfExists("comments");
  await knex.schema.alterTable("${project.resource}", (table) => {
    table.dropIndex(["${project.org}_id", "status", "priority"]);
    table.dropIndex(["deleted_at", "archived_at"]);
    table.dropColumn("due_at");
    table.dropColumn("risk_level");
    table.dropColumn("version");
    table.dropColumn("archived_at");
    table.dropColumn("deleted_at");
  });
}
`;
}

function contextMiddleware() {
  return `import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestContext: {
        requestId: string;
        actor: string;
        role: string;
      };
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = String(req.headers["x-request-id"] || crypto.randomUUID());
  const actor = String(req.headers["x-demo-user"] || "demo.user@example.com");
  const role = String(req.headers["x-demo-role"] || "operator");

  req.requestContext = { requestId, actor, role };
  res.setHeader("x-request-id", requestId);
  next();
}
`;
}

function model(project) {
  return `import type { Knex } from "knex";
import { db } from "../config/db";

const table = "${project.resource}";
const orgColumn = "${project.org}_id";

export type ListQuery = {
  search?: string;
  status?: string;
  priority?: string;
  includeArchived?: boolean;
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
};

function baseQuery(trx: Knex | Knex.Transaction = db) {
  return trx(table).whereNull("deleted_at");
}

export async function listRecords(query: ListQuery) {
  const builder = baseQuery().select("*");

  if (!query.includeArchived) builder.whereNull("archived_at");
  if (query.status) builder.where("status", query.status);
  if (query.priority) builder.where("priority", query.priority);
  if (query.search) builder.whereILike("title", \`%\${query.search}%\`);

  const countQuery = builder.clone().clearSelect().clearOrder().count({ count: "*" }).first();
  const rowsQuery = builder
    .orderBy(query.sort, query.order)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  const [countRow, rows] = await Promise.all([countQuery, rowsQuery]);
  return {
    rows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: Number(countRow?.count || 0)
    }
  };
}

export function findRecord(id: number) {
  return baseQuery().where({ id }).first();
}

export async function createRecord(payload: Record<string, unknown>, context: { actor: string; requestId: string }) {
  return db.transaction(async (trx) => {
    const [record] = await trx(table).insert(payload).returning("*");
    await writeActivity(trx, record.id, "created", \`Created \${record.title}\`, { status: record.status, priority: record.priority });
    await writeAudit(trx, record.id, context, "created", null, record);
    return record;
  });
}

export async function updateRecord(id: number, payload: Record<string, unknown>, context: { actor: string; requestId: string }) {
  return db.transaction(async (trx) => {
    const before = await baseQuery(trx).where({ id }).first();
    const [record] = await trx(table)
      .where({ id })
      .whereNull("deleted_at")
      .update({ ...payload, version: trx.raw("version + 1"), updated_at: trx.fn.now() })
      .returning("*");
    await writeActivity(trx, id, "updated", \`Updated \${record.title}\`, payload);
    await writeAudit(trx, id, context, "updated", before, record);
    return record;
  });
}

export async function bulkStatus(ids: number[], status: string, context: { actor: string; requestId: string }) {
  return db.transaction(async (trx) => {
    const rows = await trx(table)
      .whereIn("id", ids)
      .whereNull("deleted_at")
      .update({ status, version: trx.raw("version + 1"), updated_at: trx.fn.now() })
      .returning("*");
    await trx("audit_log").insert(rows.map((row) => ({
      ${project.entity}_id: row.id,
      actor: context.actor,
      action: "bulk_status",
      before: null,
      after: { status },
      request_id: context.requestId
    })));
    await trx("activity_events").insert(rows.map((row) => ({
      ${project.entity}_id: row.id,
      event_type: "bulk_status",
      message: \`Moved \${row.title} to \${status}\`,
      payload: { status }
    })));
    return rows;
  });
}

export async function archiveRecord(id: number, context: { actor: string; requestId: string }) {
  return lifecycleUpdate(id, { archived_at: db.fn.now(), status: "archived" }, context, "archived");
}

export async function restoreRecord(id: number, context: { actor: string; requestId: string }) {
  return lifecycleUpdate(id, { archived_at: null, status: "active" }, context, "restored");
}

export async function softDeleteRecord(id: number, context: { actor: string; requestId: string }) {
  return lifecycleUpdate(id, { deleted_at: db.fn.now() }, context, "deleted");
}

async function lifecycleUpdate(id: number, updates: Record<string, unknown>, context: { actor: string; requestId: string }, action: string) {
  return db.transaction(async (trx) => {
    const before = await baseQuery(trx).where({ id }).first();
    const [record] = await trx(table)
      .where({ id })
      .whereNull("deleted_at")
      .update({ ...updates, version: trx.raw("version + 1"), updated_at: trx.fn.now() })
      .returning("*");
    await writeActivity(trx, id, action, \`\${action} \${before?.title || "record"}\`, updates);
    await writeAudit(trx, id, context, action, before, record);
    return record;
  });
}

export async function addComment(id: number, payload: { author: string; body: string; is_internal?: boolean }, context: { actor: string; requestId: string }) {
  return db.transaction(async (trx) => {
    const [comment] = await trx("comments").insert({
      ${project.entity}_id: id,
      author: payload.author,
      body: payload.body,
      is_internal: Boolean(payload.is_internal)
    }).returning("*");
    await writeActivity(trx, id, "commented", \`\${payload.author} commented\`, { is_internal: Boolean(payload.is_internal) });
    await writeAudit(trx, id, context, "commented", null, comment);
    return comment;
  });
}

export function listComments(id: number) {
  return db("comments").where({ ${project.entity}_id: id }).orderBy("created_at", "asc");
}

export async function createSavedView(payload: { ${project.org}_id: number; name: string; filters: object; created_by: string }) {
  const [view] = await db("saved_views").insert(payload).returning("*");
  return view;
}

export function listSavedViews(${project.org}Id = 1) {
  return db("saved_views").where({ [orgColumn]: ${project.org}Id }).orderBy("created_at", "desc");
}

export async function dashboard() {
  const [totalRow] = await baseQuery().count({ count: "*" });
  const byStatus = await baseQuery().select("status").count({ count: "*" }).groupBy("status").orderBy("status");
  const byPriority = await baseQuery().select("priority").count({ count: "*" }).groupBy("priority").orderBy("priority");
  const archived = await db(table).whereNotNull("archived_at").whereNull("deleted_at").count({ count: "*" }).first();
  const recentActivity = await activity();
  return {
    total: Number(totalRow.count),
    archived: Number(archived?.count || 0),
    byStatus,
    byPriority,
    recentActivity
  };
}

export function activity() {
  return db("activity_events").select("*").orderBy("created_at", "desc").limit(30);
}

export function auditLog(limit = 50) {
  return db("audit_log").select("*").orderBy("created_at", "desc").limit(limit);
}

async function writeActivity(trx: Knex.Transaction, id: number, eventType: string, message: string, payload: object) {
  await trx("activity_events").insert({
    ${project.entity}_id: id,
    event_type: eventType,
    message,
    payload
  });
}

async function writeAudit(
  trx: Knex.Transaction,
  id: number | null,
  context: { actor: string; requestId: string },
  action: string,
  before: unknown,
  after: unknown
) {
  await trx("audit_log").insert({
    ${project.entity}_id: id,
    actor: context.actor,
    action,
    before,
    after,
    request_id: context.requestId
  });
}
`;
}

function service(project) {
  const allowed = JSON.stringify(["title", "status", "priority", "owner", "metadata", "due_at", "risk_level", `${project.org}_id`]);
  const statuses = JSON.stringify(project.statuses);
  const priorities = JSON.stringify(project.priorities);
  return `import * as model from "../models/model";
import { NotFoundError, ValidationError } from "../utils/errors";

const allowedStatuses = ${statuses};
const allowedPriorities = ${priorities};
const allowedSorts = ["updated_at", "created_at", "priority", "status", "title"];

type Context = { actor: string; requestId: string; role: string };

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer.");
  return id;
}

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function requireOperator(context: Context) {
  if (!["operator", "admin", "manager"].includes(context.role)) {
    throw new ValidationError("This demo endpoint requires an operator, manager, or admin role.");
  }
}

export function normalizeListQuery(query: Record<string, unknown>) {
  const sort = allowedSorts.includes(String(query.sort)) ? String(query.sort) : "updated_at";
  const order = String(query.order).toLowerCase() === "asc" ? "asc" : "desc";
  return {
    search: query.search ? String(query.search) : undefined,
    status: query.status ? String(query.status) : undefined,
    priority: query.priority ? String(query.priority) : undefined,
    includeArchived: query.includeArchived === "true",
    page: parsePositiveInt(query.page, 1, 10000),
    pageSize: parsePositiveInt(query.pageSize, 25, 100),
    sort,
    order: order as "asc" | "desc"
  };
}

function sanitizePayload(payload: Record<string, unknown>, partial = false) {
  const allowed = ${allowed};
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) clean[key] = payload[key];
  }

  if (!partial && (!clean.title || typeof clean.title !== "string")) {
    throw new ValidationError("A title is required.");
  }

  if (clean.status && !allowedStatuses.includes(String(clean.status))) {
    throw new ValidationError(\`Status must be one of: \${allowedStatuses.join(", ")}.\`);
  }

  if (clean.priority && !allowedPriorities.includes(String(clean.priority))) {
    throw new ValidationError(\`Priority must be one of: \${allowedPriorities.join(", ")}.\`);
  }

  if (clean.metadata && typeof clean.metadata !== "object") {
    throw new ValidationError("Metadata must be a JSON object.");
  }

  if (!partial) {
    clean.status ??= allowedStatuses[0];
    clean.priority ??= "medium";
    clean.owner ??= "Unassigned";
    clean.metadata ??= {};
    clean.risk_level ??= "normal";
    clean.${project.org}_id ??= 1;
  }

  return clean;
}

export function list(query: Record<string, unknown>) {
  return model.listRecords(normalizeListQuery(query));
}

export async function get(idValue: string) {
  const record = await model.findRecord(parseId(idValue));
  if (!record) throw new NotFoundError("${project.entity} not found.");
  return record;
}

export function create(payload: Record<string, unknown>, context: Context) {
  requireOperator(context);
  return model.createRecord(sanitizePayload(payload), context);
}

export async function update(idValue: string, payload: Record<string, unknown>, context: Context) {
  requireOperator(context);
  await get(idValue);
  return model.updateRecord(parseId(idValue), sanitizePayload(payload, true), context);
}

export async function remove(idValue: string, context: Context) {
  requireOperator(context);
  await get(idValue);
  return model.softDeleteRecord(parseId(idValue), context);
}

export async function archive(idValue: string, context: Context) {
  requireOperator(context);
  await get(idValue);
  return model.archiveRecord(parseId(idValue), context);
}

export async function restore(idValue: string, context: Context) {
  requireOperator(context);
  return model.restoreRecord(parseId(idValue), context);
}

export async function bulkStatus(payload: { ids?: unknown; status?: unknown }, context: Context) {
  requireOperator(context);
  if (!Array.isArray(payload.ids) || payload.ids.length === 0) throw new ValidationError("ids must be a non-empty array.");
  const ids = payload.ids.map((id) => parseId(String(id)));
  const status = String(payload.status || "");
  if (!allowedStatuses.includes(status)) throw new ValidationError(\`Status must be one of: \${allowedStatuses.join(", ")}.\`);
  return model.bulkStatus(ids, status, context);
}

export async function addComment(idValue: string, payload: Record<string, unknown>, context: Context) {
  await get(idValue);
  const body = String(payload.body || "").trim();
  if (!body) throw new ValidationError("Comment body is required.");
  return model.addComment(parseId(idValue), {
    author: String(payload.author || context.actor),
    body,
    is_internal: Boolean(payload.is_internal)
  }, context);
}

export function listComments(idValue: string) {
  return model.listComments(parseId(idValue));
}

export function createSavedView(payload: Record<string, unknown>, context: Context) {
  requireOperator(context);
  const name = String(payload.name || "").trim();
  if (!name) throw new ValidationError("Saved view name is required.");
  return model.createSavedView({
    ${project.org}_id: Number(payload.${project.org}_id || 1),
    name,
    filters: typeof payload.filters === "object" && payload.filters ? payload.filters : {},
    created_by: context.actor
  });
}

export function listSavedViews(query: Record<string, unknown>) {
  return model.listSavedViews(Number(query.${project.org}_id || 1));
}

export function dashboard() {
  return model.dashboard();
}

export function activity() {
  return model.activity();
}

export function auditLog(query: Record<string, unknown>) {
  return model.auditLog(parsePositiveInt(query.limit, 50, 200));
}
`;
}

function controller() {
  return `import type { Request, Response } from "express";
import * as service from "../services/service";
import { sendSuccess } from "../utils/response";

export async function list(req: Request, res: Response) {
  return sendSuccess(res, await service.list(req.query));
}

export async function dashboard(_req: Request, res: Response) {
  return sendSuccess(res, await service.dashboard());
}

export async function activity(_req: Request, res: Response) {
  return sendSuccess(res, await service.activity());
}

export async function audit(req: Request, res: Response) {
  return sendSuccess(res, await service.auditLog(req.query));
}

export async function views(req: Request, res: Response) {
  return sendSuccess(res, await service.listSavedViews(req.query));
}

export async function createView(req: Request, res: Response) {
  return sendSuccess(res, await service.createSavedView(req.body, req.requestContext), 201);
}

export async function bulkStatus(req: Request, res: Response) {
  return sendSuccess(res, await service.bulkStatus(req.body, req.requestContext));
}

export async function get(req: Request, res: Response) {
  return sendSuccess(res, await service.get(req.params.id));
}

export async function create(req: Request, res: Response) {
  return sendSuccess(res, await service.create(req.body, req.requestContext), 201);
}

export async function update(req: Request, res: Response) {
  return sendSuccess(res, await service.update(req.params.id, req.body, req.requestContext));
}

export async function archive(req: Request, res: Response) {
  return sendSuccess(res, await service.archive(req.params.id, req.requestContext));
}

export async function restore(req: Request, res: Response) {
  return sendSuccess(res, await service.restore(req.params.id, req.requestContext));
}

export async function remove(req: Request, res: Response) {
  return sendSuccess(res, await service.remove(req.params.id, req.requestContext));
}

export async function comments(req: Request, res: Response) {
  return sendSuccess(res, await service.listComments(req.params.id));
}

export async function addComment(req: Request, res: Response) {
  return sendSuccess(res, await service.addComment(req.params.id, req.body, req.requestContext), 201);
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
router.get("/audit", wrap(controller.audit));
router.get("/views", wrap(controller.views));
router.post("/views", wrap(controller.createView));
router.post("/bulk/status", wrap(controller.bulkStatus));
router.get("/:id", wrap(controller.get));
router.post("/", wrap(controller.create));
router.put("/:id", wrap(controller.update));
router.patch("/:id/archive", wrap(controller.archive));
router.patch("/:id/restore", wrap(controller.restore));
router.get("/:id/comments", wrap(controller.comments));
router.post("/:id/comments", wrap(controller.addComment));
router.delete("/:id", wrap(controller.remove));

export default router;
`;
}

function app(project) {
  return `import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { db } from "./config/db";
import { env } from "./config/env";
import { requestContext } from "./middleware/requestContext";
import routes from "./routes/routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(requestContext);
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :req[x-request-id]"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ success: true, data: { service: "${project.slug}", status: "ok" } }));
app.get("/ready", async (_req, res, next) => {
  try {
    await db.raw("select 1 as ready");
    res.json({ success: true, data: { service: "${project.slug}", database: "ready" } });
  } catch (error) {
    next(error);
  }
});

app.use("/api/${project.resource}", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
`;
}

function api(project) {
  return `import axios from "axios";
import type { Dashboard, RecordItem, SavedView, ActivityEvent, AuditEvent, Comment } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:${project.port}/api",
  headers: {
    "Content-Type": "application/json",
    "x-demo-user": "junior.operator@example.com",
    "x-demo-role": "operator"
  }
});

function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) throw new Error(response.data.error?.message || "Request failed");
  return response.data.data as T;
}

export type ListParams = {
  search?: string;
  status?: string;
  priority?: string;
  includeArchived?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: string;
};

export async function listRecords(params: ListParams = {}) {
  return unwrap<{ rows: RecordItem[]; pagination: { page: number; pageSize: number; total: number } }>(
    await api.get("/${project.resource}", { params })
  );
}

export async function loadDashboard() {
  return unwrap<Dashboard>(await api.get("/${project.resource}/dashboard"));
}

export async function loadActivity() {
  return unwrap<ActivityEvent[]>(await api.get("/${project.resource}/activity"));
}

export async function loadAudit() {
  return unwrap<AuditEvent[]>(await api.get("/${project.resource}/audit"));
}

export async function loadViews() {
  return unwrap<SavedView[]>(await api.get("/${project.resource}/views"));
}

export async function saveView(payload: Partial<SavedView>) {
  return unwrap<SavedView>(await api.post("/${project.resource}/views", payload));
}

export async function createRecord(payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.post("/${project.resource}", payload));
}

export async function updateRecord(id: number, payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.put(\`/${project.resource}/\${id}\`, payload));
}

export async function archiveRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(\`/${project.resource}/\${id}/archive\`));
}

export async function restoreRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(\`/${project.resource}/\${id}/restore\`));
}

export async function deleteRecord(id: number) {
  return unwrap<RecordItem>(await api.delete(\`/${project.resource}/\${id}\`));
}

export async function bulkStatus(ids: number[], status: string) {
  return unwrap<RecordItem[]>(await api.post("/${project.resource}/bulk/status", { ids, status }));
}

export async function loadComments(id: number) {
  return unwrap<Comment[]>(await api.get(\`/${project.resource}/\${id}/comments\`));
}

export async function addComment(id: number, body: string, isInternal = false) {
  return unwrap<Comment>(await api.post(\`/${project.resource}/\${id}/comments\`, { body, is_internal: isInternal }));
}
`;
}

function types(project) {
  return `export type RecordItem = {
  id: number;
  ${project.org}_id: number;
  title: string;
  status: string;
  priority: string;
  owner: string;
  metadata: Record<string, unknown>;
  due_at?: string | null;
  risk_level: string;
  version: number;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: number;
  event_type: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  request_id: string;
  created_at: string;
};

export type SavedView = {
  id: number;
  ${project.org}_id: number;
  name: string;
  filters: Record<string, unknown>;
  created_by: string;
};

export type Comment = {
  id: number;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type Dashboard = {
  total: number;
  archived: number;
  byStatus: Array<{ status: string; count: string | number }>;
  byPriority: Array<{ priority: string; count: string | number }>;
  recentActivity: ActivityEvent[];
};
`;
}

function appTsx(project) {
  const sample = JSON.stringify(project.sample, null, 2);
  return `import { useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import "./index.css";
import {
  addComment,
  archiveRecord,
  bulkStatus,
  createRecord,
  deleteRecord,
  listRecords,
  loadActivity,
  loadAudit,
  loadComments,
  loadDashboard,
  loadViews,
  restoreRecord,
  saveView,
  updateRecord
} from "./services/api";
import type { ActivityEvent, AuditEvent, Comment, Dashboard, RecordItem, SavedView } from "./types";

const emptyForm = ${sample};
const statusOptions = ${JSON.stringify(project.statuses)};
const priorityOptions = ${JSON.stringify(project.priorities)};

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", includeArchived: "false", page: "1", pageSize: "25", sort: "updated_at", order: "desc" });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 });
  const [error, setError] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  async function refresh(nextFilters = filters) {
    try {
      const [list, nextDashboard, nextActivity, nextAudit, nextViews] = await Promise.all([
        listRecords(nextFilters),
        loadDashboard(),
        loadActivity(),
        loadAudit(),
        loadViews()
      ]);
      setRecords(list.rows);
      setPagination(list.pagination);
      setDashboard(nextDashboard);
      setActivity(nextActivity);
      setAudit(nextAudit);
      setViews(nextViews);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load enterprise workspace");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateFilter(field: string, value: string) {
    const nextFilters = { ...filters, [field]: value, page: field === "page" ? value : "1" };
    setFilters(nextFilters);
    refresh(nextFilters);
  }

  function updateField(field: string, value: string) {
    setForm((current: any) => ({ ...current, [field]: field === "metadata" ? safeMetadata(value) : value }));
  }

  function metadataValue() {
    return typeof form.metadata === "string" ? form.metadata : JSON.stringify(form.metadata, null, 2);
  }

  async function saveRecord(event: React.FormEvent) {
    event.preventDefault();
    if (editingId) await updateRecord(editingId, form);
    else await createRecord(form);
    setEditingId(null);
    setForm(emptyForm);
    await refresh();
  }

  async function inspectRecord(record: RecordItem) {
    setSelected(record);
    setComments(await loadComments(record.id));
  }

  function editRecord(record: RecordItem) {
    setEditingId(record.id);
    setForm({ ...record });
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function runBulkStatus(status: string) {
    if (selectedIds.length === 0) return;
    await bulkStatus(selectedIds, status);
    setSelectedIds([]);
    await refresh();
  }

  async function postComment() {
    if (!selected || !commentText.trim()) return;
    await addComment(selected.id, commentText, true);
    setCommentText("");
    setComments(await loadComments(selected.id));
    await refresh();
  }

  async function persistView() {
    await saveView({ name: \`View: \${filters.status || "all"} / \${filters.priority || "all"}\`, filters });
    setViews(await loadViews());
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p>Enterprise Project ${project.slug.slice(0, 2)}</p>
          <h1>${project.title}</h1>
        </div>
        <button onClick={persistView}>Save current view</button>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.metrics}>
        <article><span>{dashboard?.total ?? 0}</span><p>Total active</p></article>
        <article><span>{dashboard?.archived ?? 0}</span><p>Archived</p></article>
        <article><span>{pagination.total}</span><p>Filtered total</p></article>
        <article><span>{audit.length}</span><p>Audit events</p></article>
      </section>

      <section className={styles.filters}>
        <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search" />
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)}>
          <option value="">All priorities</option>
          {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <label><input type="checkbox" checked={filters.includeArchived === "true"} onChange={(event) => updateFilter("includeArchived", String(event.target.checked))} /> Include archived</label>
      </section>

      <section className={styles.bulkBar}>
        <span>{selectedIds.length} selected</span>
        {statusOptions.map((status) => <button key={status} onClick={() => runBulkStatus(status)}>Move to {status}</button>)}
      </section>

      <section className={styles.grid}>
        <form className={styles.panel} onSubmit={saveRecord}>
          <h2>{editingId ? "Edit" : "Create"} ${project.entity}</h2>
          <label>title<input value={form.title ?? ""} onChange={(event) => updateField("title", event.target.value)} /></label>
          <label>status<select value={form.status ?? ""} onChange={(event) => updateField("status", event.target.value)}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label>priority<select value={form.priority ?? ""} onChange={(event) => updateField("priority", event.target.value)}>{priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
          <label>${project.ownerLabel}<input value={form.owner ?? ""} onChange={(event) => updateField("owner", event.target.value)} /></label>
          <label>risk level<input value={form.risk_level ?? "normal"} onChange={(event) => updateField("risk_level", event.target.value)} /></label>
          <label>due date<input type="datetime-local" value={form.due_at ?? ""} onChange={(event) => updateField("due_at", event.target.value)} /></label>
          <label>metadata JSON<textarea value={metadataValue()} onChange={(event) => updateField("metadata", event.target.value)} /></label>
          <button>{editingId ? "Update" : "Create"}</button>
        </form>

        <section className={styles.list}>
          {records.map((record) => (
            <article className={styles.card} key={record.id}>
              <input type="checkbox" checked={selectedSet.has(record.id)} onChange={() => toggleSelected(record.id)} />
              <div onClick={() => inspectRecord(record)}>
                <h3>{record.title}</h3>
                <p>{record.owner} | {record.status} | {record.priority} | v{record.version}</p>
                <code>{JSON.stringify(record.metadata)}</code>
              </div>
              <div className={styles.actions}>
                <button onClick={() => editRecord(record)}>Edit</button>
                {record.archived_at ? <button onClick={() => restoreRecord(record.id).then(() => refresh())}>Restore</button> : <button onClick={() => archiveRecord(record.id).then(() => refresh())}>Archive</button>}
                <button onClick={() => deleteRecord(record.id).then(() => refresh())}>Delete</button>
              </div>
            </article>
          ))}
        </section>

        <aside className={styles.sidePanel}>
          <h2>Saved Views</h2>
          {views.map((view) => <article key={view.id}><strong>{view.name}</strong><pre>{JSON.stringify(view.filters, null, 2)}</pre></article>)}
          <h2>Activity</h2>
          {activity.slice(0, 8).map((event) => <article key={event.id}><strong>{event.event_type}</strong><p>{event.message}</p></article>)}
        </aside>

        <aside className={styles.detailPanel}>
          <h2>{selected ? selected.title : "Select a record"}</h2>
          {selected && (
            <>
              <p>Use comments as internal collaboration notes and review artifacts.</p>
              <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Internal note" />
              <button onClick={postComment}>Add comment</button>
              {comments.map((comment) => <article key={comment.id}><strong>{comment.author}</strong><p>{comment.body}</p></article>)}
            </>
          )}
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
  return `.shell { min-height: 100vh; padding: 28px; background: #f4f6fb; color: #1f2433; }
.header { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 22px; }
.header h1 { margin: 0; font-size: 34px; }
.header p { margin: 0 0 6px; color: #657087; }
button, input, select, textarea { font: inherit; }
button { border: 0; border-radius: 8px; padding: 9px 12px; color: white; background: #2454d6; cursor: pointer; }
input, select, textarea { border: 1px solid #d9deea; border-radius: 8px; padding: 10px 12px; width: 100%; background: white; }
textarea { min-height: 100px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.metrics article, .panel, .card, .sidePanel, .detailPanel { background: #fff; border: 1px solid #e2e6f0; border-radius: 8px; box-shadow: 0 12px 28px rgba(25, 32, 56, 0.06); }
.metrics article { padding: 16px; }
.metrics span { font-size: 28px; font-weight: 800; }
.metrics p { margin: 4px 0 0; color: #657087; }
.filters, .bulkBar { display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 12px; align-items: center; margin-bottom: 14px; }
.bulkBar { grid-template-columns: auto repeat(5, auto); justify-content: start; }
.grid { display: grid; grid-template-columns: 340px minmax(0, 1.2fr) 300px 320px; gap: 16px; align-items: start; }
.panel, .sidePanel, .detailPanel { padding: 16px; display: grid; gap: 12px; }
.panel h2, .sidePanel h2, .detailPanel h2 { margin: 0; }
.panel label { display: grid; gap: 6px; color: #475069; text-transform: capitalize; }
.list { display: grid; gap: 12px; }
.card { padding: 14px; display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: start; }
.card h3 { margin: 0 0 6px; }
.card p { margin: 0 0 8px; color: #525d73; }
.card code, .sidePanel pre { display: block; white-space: pre-wrap; color: #40506d; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.actions button:nth-child(3) { background: #bc3434; }
.sidePanel article, .detailPanel article { border-top: 1px solid #edf0f7; padding-top: 10px; }
.sidePanel p, .detailPanel p { margin: 4px 0 0; color: #5c667d; }
.error { padding: 12px 14px; border-radius: 8px; background: #fff1f1; color: #9b1d1d; margin-bottom: 16px; }
@media (max-width: 1300px) { .grid { grid-template-columns: 1fr; } .metrics, .filters, .bulkBar { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: stretch; } }
`;
}

function journal(project) {
  return `# Engineering Journal

This journal explains the production-minded choices added to **${project.title}** and is written for a junior engineer learning how larger full-stack apps are shaped.

## What Changed

- Added pagination, filtering, sorting, and archived-record handling to list endpoints.
- Added request context through demo headers so every write can name an actor and request id.
- Added comments, saved views, audit log, soft delete, archive/restore, bulk status updates, and readiness checks.
- Added more detailed dashboard aggregates: active totals, archived totals, status buckets, priority buckets, recent activity.
- Preserved the existing React + Express + Knex + PostgreSQL stack and the controller/service/model boundary.

## Why These Choices Matter

### Soft Delete Instead Of Hard Delete

Enterprise apps usually need reversibility, auditability, and investigation paths. A hard delete removes evidence. Soft delete keeps the row out of normal queries while preserving the ability to inspect what happened.

Tradeoff: every query now must remember to filter \`deleted_at\`. The model layer owns that default so controllers and UI do not have to remember it.

### Archive/Restore As A Separate Lifecycle

Archive is not the same as delete. Archived records are complete or inactive, but still useful for reports. Deleted records are hidden from normal operations.

Tradeoff: the UI needs an \`includeArchived\` filter and the API needs a clear lifecycle contract.

### Audit Log

The audit log records actor, action, before/after shape, and request id. This teaches a core production habit: if a customer or manager asks "who changed this?", the system should have an answer.

Tradeoff: audit data can grow quickly. A real production version would add retention rules, indexes, and maybe partitioning.

### Request Context

The request context middleware gives every request a request id, actor, and role. In production this would come from authentication. Here it is intentionally demo-header based so learners can inspect the pattern without building a full identity provider.

Tradeoff: demo headers are not security. The journal calls this out because a junior engineer should not mistake a teaching seam for production auth.

### Comments And Saved Views

Comments make collaboration explicit. Saved views model the dashboards that enterprise users naturally create for repeated workflows.

Tradeoff: these features introduce ownership questions. In production, saved views need visibility rules: private, team, organization, or global.

### Bulk Operations

Bulk status updates are common in operational tools. They teach validation, blast radius, and transaction boundaries.

Tradeoff: bulk actions can accidentally affect many records. The UI shows selected count, and the service validates ids/status before writing.

## Boundary Decisions

| Boundary | Decision | Why |
| --- | --- | --- |
| UI | Own filters, selected rows, comments panel | These are interaction concerns. |
| Client API | Own URLs, demo headers, envelope unwrapping | Keeps transport details out of components. |
| Controller | Only parse request and return envelope | Keeps HTTP layer thin. |
| Service | Validate ids, roles, statuses, priorities | Protects every caller, not just the UI. |
| Model | Own query defaults, transactions, audit writes | Keeps persistence consistency close to SQL. |
| Migration | Add lifecycle/audit/collaboration tables | Schema is the durable contract. |

## What A Junior Should Notice

1. Bigger apps are not just "more CRUD." They add lifecycle, auditability, collaboration, and operational visibility.
2. Almost every enterprise feature creates a new invariant.
3. Production readiness is often about boring guarantees: who changed it, can we undo it, can we filter it, can we trace it, can we recover it?
4. Boundaries reduce the number of places a future engineer must inspect.

## What A Mid-Level Engineer Should Practice

- Add tests for archive/restore and soft delete list behavior.
- Add a real authorization check for ${project.org}-scoped access.
- Add indexes that match the most common filters.
- Add optimistic UI behavior for bulk status updates with rollback on failure.
- Add migration notes for existing data.

## What A Senior Engineer Would Challenge

- Is the audit log schema enough for compliance, or does it need immutability guarantees?
- Should audit writes be in-band transactions, an outbox, or an event stream?
- What is the retention policy for comments, activity, and audit rows?
- How do we prevent bulk operations from becoming accidental incidents?
- What is the rollout plan if existing records do not have lifecycle columns?

## Suggested Learning Drill

Trace a bulk status update:

1. UI selected ids.
2. Client API request.
3. Route and controller.
4. Service validation.
5. Transactional model update.
6. Activity and audit writes.
7. Dashboard refresh.

Self-grade:

- Basic: names the files.
- Solid: explains the data shape at every step.
- Strong: identifies the transaction boundary, rollback behavior, authorization risk, and the test you would add.
`;
}

function readme(project) {
  return `# ${project.title}

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

${project.features.map((feature) => `- ${feature}`).join("\n")}
- pagination, filtering, sorting
- soft delete plus archive/restore lifecycle
- comments for collaboration
- saved views for repeated workflows
- request id and actor context
- audit log and activity feed
- readiness endpoint
- bulk status operations

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

## API Highlights

- \`GET /api/${project.resource}?page=1&pageSize=25&status=...\`
- \`GET /api/${project.resource}/dashboard\`
- \`GET /api/${project.resource}/audit\`
- \`GET /api/${project.resource}/views\`
- \`POST /api/${project.resource}/views\`
- \`POST /api/${project.resource}/bulk/status\`
- \`PATCH /api/${project.resource}/:id/archive\`
- \`PATCH /api/${project.resource}/:id/restore\`
- \`GET /api/${project.resource}/:id/comments\`
- \`POST /api/${project.resource}/:id/comments\`

Read \`docs/journal.md\` for the engineering decisions and learning notes.
`;
}

function architecture(project) {
  return `# ${project.title} Architecture

## System Shape

\`\`\`text
React enterprise workspace
  -> typed API client
  -> Express middleware: security, request context, JSON, logging
  -> routes/controllers
  -> service validation and role checks
  -> Knex models with transactions
  -> PostgreSQL lifecycle, comments, saved views, audit, activity
\`\`\`

## Production-Oriented Additions

- \`/ready\` checks database connectivity separately from \`/health\`.
- Request context assigns request id, actor, and role.
- List endpoints support pagination and filtering.
- Delete is soft delete; archive/restore is a separate lifecycle.
- Comments, saved views, audit log, and activity events model collaboration and traceability.
- Writes that touch domain rows plus audit/activity use transactions.

## Main Boundaries

| Layer | Owns |
| --- | --- |
| UI | filters, selected rows, comments panel, saved-view action |
| Client API | request headers, route URLs, envelope unwrap |
| Controller | request/response translation |
| Service | validation, role checks, lifecycle rules |
| Model | SQL, transactions, audit/activity writes |
| Migration | durable lifecycle/collaboration/audit schema |

## Scale Risks To Discuss

- Audit and activity tables need retention/index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.
- List endpoint defaults should be monitored for latency.

See \`docs/journal.md\` for the teaching narrative behind these choices.
`;
}

for (const project of projects) {
  await write(project, "server/db/migrations/002_enterprise_features.ts", migration(project));
  await write(project, "server/src/middleware/requestContext.ts", contextMiddleware());
  await write(project, "server/src/models/model.ts", model(project));
  await write(project, "server/src/services/service.ts", service(project));
  await write(project, "server/src/controllers/controller.ts", controller());
  await write(project, "server/src/routes/routes.ts", routes());
  await write(project, "server/src/app.ts", app(project));
  await write(project, "client/src/services/api.ts", api(project));
  await write(project, "client/src/types.ts", types(project));
  await write(project, "client/src/App.tsx", appTsx(project));
  await write(project, "client/src/App.module.css", css());
  await write(project, "README.md", readme(project));
  await write(project, "docs/architecture.md", architecture(project));
  await write(project, "docs/journal.md", journal(project));
  console.log(`Enhanced ${project.slug}`);
}
