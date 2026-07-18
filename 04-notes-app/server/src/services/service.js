const model = require("../models/model");
const { NotFoundError, ValidationError } = require("../utils/errors");
function parseId(value) { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer."); return id; }
function sanitizePayload(payload) { const allowed = ["title","body","folder","status","tags"]; const clean = {}; for (const key of allowed) if (payload[key] !== undefined) clean[key] = payload[key]; if (Object.keys(clean).length === 0) throw new ValidationError("At least one field is required."); return clean; }
/** Lists records using trusted query values. */
function list(query) { return model.listRecords(query); }
/** Gets one record or throws a 404. */
async function get(idValue) { const record = await model.findRecord(parseId(idValue)); if (!record) throw new NotFoundError("note not found."); return record; }
/** Creates one record. */
function create(payload) { return model.createRecord(sanitizePayload(payload)); }
/** Updates one record. */
async function update(idValue, payload) { await get(idValue); return model.updateRecord(parseId(idValue), sanitizePayload(payload)); }
/** Deletes one record. */
async function remove(idValue) { await get(idValue); return model.deleteRecord(parseId(idValue)); }
/** Returns aggregate stats. */
function getStats() { return model.stats(); }
module.exports = { list, get, create, update, remove, getStats };
