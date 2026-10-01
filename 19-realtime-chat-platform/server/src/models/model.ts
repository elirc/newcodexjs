import { NotFoundError } from "../utils/errors.js";
import type { Knex } from "knex";
import { db } from "../config/db.js";

const table = "conversations";
const orgColumn = "workspace_id";

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
  if (query.search) builder.whereILike("title", `%${query.search}%`);

  const countQuery = builder
    .clone()
    .clearSelect()
    .clearOrder()
    .count({ count: "*" })
    .first();
  const rowsQuery = builder
    .orderBy(query.sort, query.order)
    .orderBy("id", query.order)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  const [countRow, rows] = await Promise.all([countQuery, rowsQuery]);
  return {
    rows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: Number(countRow?.count || 0),
    },
  };
}

export function findRecord(id: number) {
  return baseQuery().where({ id }).first();
}

export async function createRecord(
  payload: Record<string, unknown>,
  context: { actor: string; requestId: string },
) {
  return db.transaction(async (trx) => {
    const [record] = await trx(table)
      .insert({ ...payload, ...statusFields(null, payload.status) })
      .returning("*");
    await writeActivity(trx, record.id, "created", `Created ${record.title}`, {
      status: record.status,
      priority: record.priority,
    });
    await writeAudit(trx, record.id, context, "created", null, record);
    return record;
  });
}

export async function updateRecord(
  id: number,
  payload: Record<string, unknown>,
  context: { actor: string; requestId: string },
) {
  return db.transaction(async (trx) => {
    const before = await baseQuery(trx).where({ id }).forUpdate().first();
    if (!before) throw new NotFoundError("Record not found.");
    const [record] = await trx(table)
      .where({ id })
      .whereNull("deleted_at")
      .update({
        ...payload,
        ...statusFields(before, payload.status),
        version: trx.raw("version + 1"),
        updated_at: trx.fn.now(),
      })
      .returning("*");
    await writeActivity(trx, id, "updated", `Updated ${record.title}`, payload);
    await writeAudit(trx, id, context, "updated", before, record);
    return record;
  });
}

export async function bulkStatus(
  ids: number[],
  status: string,
  context: { actor: string; requestId: string },
) {
  return db.transaction(async (trx) => {
    const beforeRows = await baseQuery(trx)
      .whereIn("id", ids)
      .orderBy("id")
      .forUpdate();
    if (beforeRows.length !== ids.length)
      throw new NotFoundError(
        "One or more records were not found; no statuses changed.",
      );
    const rows = [];
    for (const before of beforeRows) {
      if (before.status === status) {
        rows.push(before);
        continue;
      }
      const [record] = await trx(table)
        .where({ id: before.id })
        .update({
          status,
          ...statusFields(before, status),
          version: trx.raw("version + 1"),
          updated_at: trx.fn.now(),
        })
        .returning("*");
      await writeActivity(
        trx,
        before.id,
        "bulk_status",
        `Moved ${before.title} to ${status}`,
        { status },
      );
      await writeAudit(trx, before.id, context, "bulk_status", before, record);
      rows.push(record);
    }
    return rows;
  });
}

export async function archiveRecord(
  id: number,
  context: { actor: string; requestId: string },
) {
  return lifecycleUpdate(
    id,
    { archived_at: db.fn.now(), status: "archived" },
    context,
    "archived",
  );
}

export async function restoreRecord(
  id: number,
  context: { actor: string; requestId: string },
) {
  return lifecycleUpdate(
    id,
    { archived_at: null, status: "active" },
    context,
    "restored",
  );
}

export async function softDeleteRecord(
  id: number,
  context: { actor: string; requestId: string },
) {
  return lifecycleUpdate(id, { deleted_at: db.fn.now() }, context, "deleted");
}

async function lifecycleUpdate(
  id: number,
  updates: Record<string, unknown>,
  context: { actor: string; requestId: string },
  action: string,
) {
  return db.transaction(async (trx) => {
    const before = await baseQuery(trx).where({ id }).forUpdate().first();
    if (!before) throw new NotFoundError("Record not found.");
    if (action === "archived" && before.archived_at) return before;
    if (action === "restored" && !before.archived_at) return before;
    if (action === "restored")
      updates = {
        archived_at: null,
        status_before_archive: null,
        status: before.status_before_archive || "active",
      };
    else if (action === "archived")
      updates = { ...updates, ...statusFields(before, "archived") };
    const [record] = await trx(table)
      .where({ id })
      .whereNull("deleted_at")
      .update({
        ...updates,
        version: trx.raw("version + 1"),
        updated_at: trx.fn.now(),
      })
      .returning("*");
    await writeActivity(trx, id, action, `${action} ${before.title}`, {
      status: record.status,
      archived_at: record.archived_at,
      deleted_at: record.deleted_at,
    });
    await writeAudit(trx, id, context, action, before, record);
    return record;
  });
}

export async function addComment(
  id: number,
  payload: { author: string; body: string; is_internal?: boolean },
  context: { actor: string; requestId: string },
) {
  return db.transaction(async (trx) => {
    const [comment] = await trx("comments")
      .insert({
        conversation_id: id,
        author: payload.author,
        body: payload.body,
        is_internal: Boolean(payload.is_internal),
      })
      .returning("*");
    await writeActivity(trx, id, "commented", `${payload.author} commented`, {
      is_internal: Boolean(payload.is_internal),
    });
    await writeAudit(trx, id, context, "commented", null, comment);
    return comment;
  });
}

export function listComments(id: number) {
  return db("comments")
    .where({ conversation_id: id })
    .orderBy("created_at", "asc");
}

export async function createSavedView(payload: {
  workspace_id: number;
  name: string;
  filters: object;
  created_by: string;
}) {
  const [view] = await db("saved_views").insert(payload).returning("*");
  return view;
}

export function listSavedViews(workspaceId = 1) {
  return db("saved_views")
    .where({ [orgColumn]: workspaceId })
    .orderBy("created_at", "desc");
}

export async function dashboard() {
  const [totalRow] = await baseQuery().count({ count: "*" });
  const byStatus = await baseQuery()
    .select("status")
    .count({ count: "*" })
    .groupBy("status")
    .orderBy("status");
  const byPriority = await baseQuery()
    .select("priority")
    .count({ count: "*" })
    .groupBy("priority")
    .orderBy("priority");
  const archived = await db(table)
    .whereNotNull("archived_at")
    .whereNull("deleted_at")
    .count({ count: "*" })
    .first();
  const recentActivity = await activity();
  return {
    total: Number(totalRow.count),
    archived: Number(archived?.count || 0),
    byStatus,
    byPriority,
    recentActivity,
  };
}

export function activity() {
  return db("activity_events")
    .select("*")
    .orderBy("created_at", "desc")
    .limit(30);
}

export function auditLog(limit = 50) {
  return db("audit_log").select("*").orderBy("created_at", "desc").limit(limit);
}

async function writeActivity(
  trx: Knex.Transaction,
  id: number,
  eventType: string,
  message: string,
  payload: object,
) {
  await trx("activity_events").insert({
    conversation_id: id,
    event_type: eventType,
    message,
    payload,
  });
}

async function writeAudit(
  trx: Knex.Transaction,
  id: number | null,
  context: { actor: string; requestId: string },
  action: string,
  before: unknown,
  after: unknown,
) {
  await trx("audit_log").insert({
    conversation_id: id,
    actor: context.actor,
    action,
    before,
    after,
    request_id: context.requestId,
  });
}

// Keep lifecycle flags consistent even when a form or bulk action changes status.
function statusFields(before: any, status: unknown): Record<string, unknown> {
  if (status === undefined) return {};
  if (status === "archived")
    return {
      archived_at: before?.archived_at || db.fn.now(),
      status_before_archive:
        before?.status === "archived"
          ? before.status_before_archive
          : before?.status || "active",
    };
  return { archived_at: null, status_before_archive: null };
}
