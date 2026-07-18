import * as model from "../models/model";
import { NotFoundError, ValidationError } from "../utils/errors";

const allowedStatuses = ["open","pending","escalated","resolved","archived"];
const allowedPriorities = ["low","medium","high","urgent"];
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
  const allowed = ["title","status","priority","owner","metadata","due_at","risk_level","team_id"];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) clean[key] = payload[key];
  }

  if (!partial && (!clean.title || typeof clean.title !== "string")) {
    throw new ValidationError("A title is required.");
  }

  if (clean.status && !allowedStatuses.includes(String(clean.status))) {
    throw new ValidationError(`Status must be one of: ${allowedStatuses.join(", ")}.`);
  }

  if (clean.priority && !allowedPriorities.includes(String(clean.priority))) {
    throw new ValidationError(`Priority must be one of: ${allowedPriorities.join(", ")}.`);
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
    clean.team_id ??= 1;
  }

  return clean;
}

export function list(query: Record<string, unknown>) {
  return model.listRecords(normalizeListQuery(query));
}

export async function get(idValue: string) {
  const record = await model.findRecord(parseId(idValue));
  if (!record) throw new NotFoundError("ticket not found.");
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
  if (!allowedStatuses.includes(status)) throw new ValidationError(`Status must be one of: ${allowedStatuses.join(", ")}.`);
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
    team_id: Number(payload.team_id || 1),
    name,
    filters: typeof payload.filters === "object" && payload.filters ? payload.filters : {},
    created_by: context.actor
  });
}

export function listSavedViews(query: Record<string, unknown>) {
  return model.listSavedViews(Number(query.team_id || 1));
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
