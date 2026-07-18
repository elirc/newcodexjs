import { db } from "../config/db";

/** Lists records with basic search filters. */
export function listRecords(query: { search?: string; status?: string }) { const builder = db("applications").select("*").orderBy("created_at", "desc"); if (query.status) builder.where("status", query.status); if (query.search) builder.whereRaw("CAST(applications AS TEXT) ILIKE ?", [`%${query.search}%`]); return builder; }
/** Finds one record by id. */
export function findRecord(id: number) { return db("applications").where({ id }).first(); }
/** Creates one record. */
export async function createRecord(payload: Record<string, unknown>) { const [row] = await db("applications").insert(payload).returning("*"); return row; }
/** Updates one record. */
export async function updateRecord(id: number, payload: Record<string, unknown>) { const [row] = await db("applications").where({ id }).update({ ...payload, updated_at: db.fn.now() }).returning("*"); return row; }
/** Deletes one record. */
export async function deleteRecord(id: number) { const [row] = await db("applications").where({ id }).del().returning("*"); return row; }
/** Counts records for dashboard stats. */
export async function stats() { const rows = await db("applications").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }
