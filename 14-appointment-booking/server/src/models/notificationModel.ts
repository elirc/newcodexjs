import { db } from "../config/db.js";

/** Inserts an in-app notification that stands in for email delivery in this learning app. */
export async function createNotification(values: Record<string, unknown>) {
  const [notification] = await db("notifications")
    .insert(values)
    .returning("*");
  return notification;
}

/** Lists recent notifications for a user. */
export async function listNotifications(userId: number) {
  return db("notifications")
    .where({ user_id: userId })
    .orderBy("created_at", "desc")
    .limit(20);
}
