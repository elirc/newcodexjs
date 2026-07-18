import { db } from "../config/db";

/** Lists active services for a provider in display order. */
export async function listServices(providerId: number, includeInactive = false) {
  const query = db("services").where({ provider_id: providerId }).orderBy("sort_order", "asc").orderBy("name", "asc");
  if (!includeInactive) query.andWhere({ is_active: true });
  return query;
}

/** Finds a single service by id. */
export async function findServiceById(id: number) {
  return db("services").where({ id }).first();
}

/** Creates a provider service. */
export async function createService(values: Record<string, unknown>) {
  const [service] = await db("services").insert(values).returning("*");
  return service;
}

/** Updates editable service fields for a provider. */
export async function updateService(id: number, providerId: number, values: Record<string, unknown>) {
  const [service] = await db("services").where({ id, provider_id: providerId }).update(values).returning("*");
  return service;
}

/** Deactivates a service while preserving existing appointment history. */
export async function deactivateService(id: number, providerId: number) {
  const [service] = await db("services").where({ id, provider_id: providerId }).update({ is_active: false }).returning("*");
  return service;
}
