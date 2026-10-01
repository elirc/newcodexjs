const model = require("../models/model");
const { NotFoundError, ValidationError } = require("../utils/errors");
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new ValidationError("Id must be a positive 32-bit integer.");
  return id;
}
function sanitizePayload(payload, partial = false) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ValidationError("Supply a note object.");
  const clean = {};
  for (const key of ["title", "folder", "status", "body"]) {
    if (partial && payload[key] === undefined) continue;
    const value = key === "body" && payload[key] === undefined ? "" : payload[key];
    if (typeof value !== "string" || (key !== "body" && !value.trim()) || value.length > (key === "body" ? 100000 : 255)) throw new ValidationError(`${key} must be valid bounded text.`);
    clean[key] = key === "body" ? value : value.trim();
  }
  if (!partial || payload.tags !== undefined) {
    const tags = payload.tags === undefined ? [] : payload.tags;
    if (!Array.isArray(tags) || tags.length > 30 || tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 50)) throw new ValidationError("Use up to 30 nonempty text tags, each at most 50 characters.");
    clean.tags = [...new Set(tags.map((tag) => tag.trim()))];
  }
  if (!Object.keys(clean).length) throw new ValidationError("At least one note field is required.");
  return clean;
}
function list(query = {}) {
  const clean = {};
  for (const key of ["search", "status", "folder"]) {
    if (query[key] === undefined) continue;
    if (typeof query[key] !== "string" || query[key].length > 255) throw new ValidationError(`${key} must be text up to 255 characters.`);
    clean[key] = query[key].trim();
  }
  return model.listRecords(clean);
}
async function get(value) {
  const record = await model.findRecord(parseId(value));
  if (!record) throw new NotFoundError("note not found.");
  return record;
}
function create(payload) { return model.createRecord(sanitizePayload(payload)); }
async function update(value, payload) { await get(value); return model.updateRecord(parseId(value), sanitizePayload(payload, true)); }
async function remove(value) { await get(value); return model.deleteRecord(parseId(value)); }
function getStats() { return model.stats(); }
module.exports = { list, get, create, update, remove, getStats };
