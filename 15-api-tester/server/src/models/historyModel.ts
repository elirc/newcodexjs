import { db } from "../config/db.js";

/** Adds a request execution record for history views. */
export async function createHistory(
  userId: number,
  values: Record<string, unknown>,
) {
  const [entry] = await db("request_history")
    .insert({ ...values, user_id: userId })
    .returning("*");
  return entry;
}

/** Lists recent history entries with simple pagination. */
export async function listHistory(userId: number, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [{ count }] = await db("request_history")
    .where({ user_id: userId })
    .count("id as count");
  const items = await db("request_history")
    .where({ user_id: userId })
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);
  return { items, page, limit, total: Number(count) };
}

/** Clears all history for a user. */
export async function clearHistory(userId: number) {
  return db("request_history").where({ user_id: userId }).delete();
}

/** Deletes one history row. */
export async function deleteHistory(id: number, userId: number) {
  return db("request_history").where({ id, user_id: userId }).delete();
}
