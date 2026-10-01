import { db } from "../config/db.js";

/** Lists records with basic search filters. */
export function listRecords(query: { search?: string; status?: string }) { const builder = db("bookmarks").select("*").orderBy("created_at", "desc"); if (query.status) builder.where("status", query.status); if (query.search) {
    // Search the fields a person typed, not ids, timestamps or serialized row metadata,
    // and escape LIKE metacharacters so "%" is a character, not a wildcard.
    const needle = "%" + query.search.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    builder.where(function () {
      for (const field of ["title", "url", "collection"]) this.orWhereRaw(`${field} ILIKE ? ESCAPE '\\'`, [needle]);
    });
  }
  return builder;
}
function databasePayload(payload: Record<string, unknown>) { return payload.tags === undefined ? payload : { ...payload, tags: JSON.stringify(payload.tags) }; }

/** Finds one record by id. */
export function findRecord(id: number) { return db("bookmarks").where({ id }).first(); }
/** Creates one record. */
export async function createRecord(payload: Record<string, unknown>) { const [row] = await db("bookmarks").insert(databasePayload(payload)).returning("*"); return row; }
/** Updates one record. */
export async function updateRecord(id: number, payload: Record<string, unknown>) { const [row] = await db("bookmarks").where({ id }).update({ ...databasePayload(payload), updated_at: db.fn.now() }).returning("*"); return row; }
/** Deletes one record. */
export async function deleteRecord(id: number) { const [row] = await db("bookmarks").where({ id }).del().returning("*"); return row; }
/** Counts records for dashboard stats. */
export async function stats() { const rows = await db("bookmarks").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }
