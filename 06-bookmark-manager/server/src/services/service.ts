import { z } from "zod";
import * as model from "../models/model.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { bookmarkUrl, fetchMetadata } from "./metadata.js";
const text = z.string().trim().min(1).max(255);
const schema = z.object({
  title: text,
  url: z.string().transform((value, context) => {
    try { return bookmarkUrl(value); }
    catch { context.addIssue({ code: z.ZodIssueCode.custom, message: "Use an absolute http or https URL without credentials, up to 255 characters." }); return z.NEVER; }
  }),
  collection: text,
  status: text,
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
});
function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new ValidationError("Id must be a positive 32-bit integer.");
  return id;
}
function sanitizePayload(payload: unknown, partial = false): Record<string, unknown> {
  const result = (partial ? schema.partial() : schema).safeParse(payload);
  if (!result.success) throw new ValidationError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  if (!Object.keys(result.data).length) throw new ValidationError("Supply at least one bookmark field.");
  return result.data.tags ? { ...result.data, tags: [...new Set(result.data.tags)] } : result.data;
}
export function list(query: { search?: string; status?: string }) {
  for (const value of [query.search, query.status]) if (value !== undefined && (typeof value !== "string" || value.length > 255)) throw new ValidationError("Filters must be text up to 255 characters.");
  return model.listRecords(query);
}
export async function get(value: string) {
  const record = await model.findRecord(parseId(value));
  if (!record) throw new NotFoundError("bookmark not found.");
  return record;
}
export function create(payload: unknown) { return model.createRecord(sanitizePayload(payload)); }
export async function update(value: string, payload: unknown) { await get(value); return model.updateRecord(parseId(value), sanitizePayload(payload, true)); }
export async function remove(value: string) { await get(value); return model.deleteRecord(parseId(value)); }
export function getStats() { return model.stats(); }
export function metadata(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ValidationError("Supply a URL object.");
  return fetchMetadata((payload as Record<string, unknown>).url);
}
