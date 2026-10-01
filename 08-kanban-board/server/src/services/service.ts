import { z } from "zod";
import * as model from "../models/model.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
const recordSchema = z.object({
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(0).max(20000).default(""),
  lane: z.string().trim().min(1).max(255),
  status: z.string().trim().min(1).max(255),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(30)
    .transform((values) => [
      ...new Map(values.map((value) => [value.toLowerCase(), value])).values(),
    ])
    .default([]),
});
function parseId(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new ValidationError("Id must be a positive whole number.");
  return Number(value);
}
function parsePayload(payload: unknown, partial = false) {
  const result = (partial ? recordSchema.partial() : recordSchema).safeParse(
    payload,
  );
  if (!result.success)
    throw new ValidationError(
      result.error.issues
        .map((issue) => issue.path.join(".") + ": " + issue.message)
        .join("; "),
    );
  if (!Object.keys(result.data).length)
    throw new ValidationError("Provide at least one editable field.");
  return result.data;
}
export function list(query: { search?: unknown; status?: unknown }) {
  if (
    [query.search, query.status].some(
      (value) =>
        value !== undefined &&
        (typeof value !== "string" || value.length > 255),
    )
  )
    throw new ValidationError("Filters must be short text values.");
  return model.listRecords(query as { search?: string; status?: string });
}
export async function get(value: string) {
  const record = await model.findRecord(parseId(value));
  if (!record) throw new NotFoundError("Record not found.");
  return record;
}
export function create(payload: unknown) {
  return model.createRecord(parsePayload(payload));
}
export async function update(value: string, payload: unknown) {
  const record = await model.updateRecord(
    parseId(value),
    parsePayload(payload, true),
  );
  if (!record) throw new NotFoundError("Record not found.");
  return record;
}
export async function remove(value: string) {
  const record = await model.deleteRecord(parseId(value));
  if (!record) throw new NotFoundError("Record not found.");
  return record;
}
export function getStats() {
  return model.stats();
}
