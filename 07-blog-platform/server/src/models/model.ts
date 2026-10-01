import { db } from "../config/db.js";

/** Lists records with basic search filters. */
export function listRecords(query: { search?: string; status?: string }) {
  const builder = db("posts")
    .select("*")
    .orderBy("created_at", "desc")
    .orderBy("id", "asc");
  if (query.status) builder.where("status", query.status);
  if (query.search)
    builder.where(function () {
      ["title", "body", "slug", "status"].forEach((field) =>
        this.orWhereILike(field, `%${query.search}%`),
      );
    });
  return builder;
}

/** Finds one record by id. */
export function findRecord(id: number) {
  return db("posts").where({ id }).first();
}
/** Creates one record. */
export async function createRecord(payload: Record<string, unknown>) {
  const [row] = await db("posts")
    .insert(databasePayload(payload))
    .returning("*");
  return row;
}
/** Updates one record. */
export async function updateRecord(
  id: number,
  payload: Record<string, unknown>,
) {
  const [row] = await db("posts")
    .where({ id })
    .update({ ...databasePayload(payload), updated_at: db.fn.now() })
    .returning("*");
  return row;
}
/** Deletes one record. */
export async function deleteRecord(id: number) {
  const [row] = await db("posts").where({ id }).del().returning("*");
  return row;
}
/** Counts records for dashboard stats. */
export async function stats() {
  const rows = await db("posts")
    .select("status")
    .count({ count: "*" })
    .groupBy("status");
  return {
    total: rows.reduce((sum, row) => sum + Number(row.count), 0),
    byStatus: rows,
  };
}

function databasePayload(payload: Record<string, unknown>) {
  return payload.tags === undefined
    ? payload
    : { ...payload, tags: JSON.stringify(payload.tags) };
}
