import * as model from "../models/model";
import { NotFoundError, ValidationError } from "../utils/errors";

/** Parses route ids before they reach the data layer. */
function parseId(value: string) { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer."); return id; }
/** Sanitizes incoming payloads to the known domain fields. */
function sanitizePayload(payload: Record<string, unknown>) { const allowed = ["title","url","collection","status","tags"]; const clean: Record<string, unknown> = {}; for (const key of allowed) if (payload[key] !== undefined) clean[key] = payload[key]; if (Object.keys(clean).length === 0) throw new ValidationError("At least one field is required."); return clean; }
/** Lists records using trusted query values. */
export function list(query: { search?: string; status?: string }) { return model.listRecords(query); }
/** Gets one record or throws a 404. */
export async function get(idValue: string) { const record = await model.findRecord(parseId(idValue)); if (!record) throw new NotFoundError("bookmark not found."); return record; }
/** Creates one record. */
export function create(payload: Record<string, unknown>) { return model.createRecord(sanitizePayload(payload)); }
/** Updates one record. */
export async function update(idValue: string, payload: Record<string, unknown>) { await get(idValue); return model.updateRecord(parseId(idValue), sanitizePayload(payload)); }
/** Deletes one record. */
export async function remove(idValue: string) { await get(idValue); return model.deleteRecord(parseId(idValue)); }
/** Returns aggregate stats. */
export function getStats() { return model.stats(); }
