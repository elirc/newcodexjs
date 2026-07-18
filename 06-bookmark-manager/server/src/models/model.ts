import { db } from "../config/db";

/** Lists records with basic search filters. */
export function listRecords(query: { search?: string; status?: string }) { const builder = db("bookmarks").select("*").orderBy("created_at", "desc"); if (query.status) builder.where("status", query.status); if (query.search) builder.whereRaw("CAST(bookmarks AS TEXT) ILIKE ?", [`%${query.search}%`]); return builder; }
/** Finds one record by id. */
export function findRecord(id: number) { return db("bookmarks").where({ id }).first(); }
/** Creates one record. */
export async function createRecord(payload: Record<string, unknown>) { const [row] = await db("bookmarks").insert(payload).returning("*"); return row; }
/** Updates one record. */
export async function updateRecord(id: number, payload: Record<string, unknown>) { const [row] = await db("bookmarks").where({ id }).update({ ...payload, updated_at: db.fn.now() }).returning("*"); return row; }
/** Deletes one record. */
export async function deleteRecord(id: number) { const [row] = await db("bookmarks").where({ id }).del().returning("*"); return row; }
/** Counts records for dashboard stats. */
export async function stats() { const rows = await db("bookmarks").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }
