const { db } = require("../config/db");

/** Lists records with basic search filters. */
function listRecords(query) {
  const builder = db("notes").select("*").orderBy("created_at", "desc").orderBy("id", "desc");
  if (query.status) builder.where("status", query.status);
  if (query.folder) builder.where("folder", query.folder);
  // Search document content, not ids, timestamps or serialized row metadata.
  if (query.search) builder.whereRaw("to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')) @@ plainto_tsquery('english', ?)", [query.search]);
  return builder;
}
function databasePayload(payload) {
  return payload.tags === undefined ? payload : { ...payload, tags: JSON.stringify(payload.tags) };
}
/** Finds one record by id. */
function findRecord(id) { return db("notes").where({ id }).first(); }
/** Creates one record. */
async function createRecord(payload) { const [row] = await db("notes").insert(databasePayload(payload)).returning("*"); return row; }
/** Updates one record. */
async function updateRecord(id, payload) { const [row] = await db("notes").where({ id }).update({ ...databasePayload(payload), updated_at: db.fn.now() }).returning("*"); return row; }
/** Deletes one record. */
async function deleteRecord(id) { const [row] = await db("notes").where({ id }).del().returning("*"); return row; }
/** Counts records for dashboard stats. */
async function stats() { const rows = await db("notes").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }
module.exports = { listRecords, findRecord, createRecord, updateRecord, deleteRecord, stats };
