import { db } from "../config/db";

/** Finds one saved request for the current user. */
export async function findSavedRequest(id: number, userId: number) {
  return db("saved_requests").where({ id, user_id: userId }).first();
}

/** Creates a saved request. */
export async function createSavedRequest(userId: number, values: Record<string, unknown>) {
  const [request] = await db("saved_requests").insert({ ...values, user_id: userId }).returning("*");
  return request;
}

/** Updates a saved request. */
export async function updateSavedRequest(id: number, userId: number, values: Record<string, unknown>) {
  const [request] = await db("saved_requests").where({ id, user_id: userId }).update({ ...values, updated_at: db.fn.now() }).returning("*");
  return request;
}

/** Deletes a saved request. */
export async function deleteSavedRequest(id: number, userId: number) {
  return db("saved_requests").where({ id, user_id: userId }).delete();
}

/** Duplicates a saved request with an educational copy suffix. */
export async function duplicateSavedRequest(id: number, userId: number) {
  const original = await findSavedRequest(id, userId);
  if (!original) return null;
  const { id: _id, created_at: _created, updated_at: _updated, ...copy } = original;
  const [request] = await db("saved_requests").insert({ ...copy, name: `${original.name} Copy`, sort_order: Number(original.sort_order ?? 0) + 1 }).returning("*");
  return request;
}

/** Imports saved request records into a collection. */
export async function importRequests(userId: number, collectionId: number, requests: Array<Record<string, unknown>>) {
  if (!requests.length) return [];
  return db("saved_requests")
    .insert(requests.map((request, index) => ({ ...request, user_id: userId, collection_id: collectionId, sort_order: index })))
    .returning("*");
}
