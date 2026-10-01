import type { Knex } from "knex";
import { db } from "../config/db.js";

/** Lists all users except an optional user id. */
export function listUsers(exceptUserId?: number) {
  const query = db("users").select(
    "id",
    "username",
    "display_name",
    "avatar_url",
    "status",
    "last_seen_at",
  );
  if (exceptUserId) query.whereNot({ id: exceptUserId });
  return query.orderBy("display_name");
}

/** Lists conversation ids for a user. */
export function listConversationIds(userId: number) {
  return db("conversation_members")
    .where({ user_id: userId })
    .pluck("conversation_id");
}

/** Fetches conversation rows by ids. */
export function listConversationsByIds(ids: number[]) {
  return db("conversations")
    .whereIn("id", ids)
    .orderBy("last_message_at", "desc");
}

/** Lists members for conversation ids. */
export function listMembers(conversationIds: number[]) {
  return db("conversation_members")
    .join("users", "users.id", "conversation_members.user_id")
    .whereIn("conversation_members.conversation_id", conversationIds)
    .select(
      "conversation_members.*",
      "users.username",
      "users.display_name",
      "users.avatar_url",
      "users.status",
      "users.last_seen_at",
    );
}

/** Finds a direct conversation between exactly two users. */
export async function findDirectConversation(userA: number, userB: number) {
  const rows = await db("conversation_members as cm")
    .join("conversations as c", "c.id", "cm.conversation_id")
    .where("c.type", "direct")
    .whereIn("cm.user_id", [userA, userB])
    .groupBy("c.id")
    .havingRaw("count(distinct cm.user_id) = 2")
    .select("c.*");
  return rows[0];
}

/** Creates a conversation with members inside a transaction. */
export async function createConversation(
  trx: Knex.Transaction,
  data: Record<string, unknown>,
  memberIds: number[],
  adminId: number,
) {
  const [conversation] = await trx("conversations").insert(data).returning("*");
  await trx("conversation_members").insert(
    [...new Set(memberIds)].map((memberId) => ({
      conversation_id: conversation.id,
      user_id: memberId,
      role: memberId === adminId ? "admin" : "member",
    })),
  );
  return conversation;
}

/** Updates a group conversation. */
export function updateConversation(id: number, data: Record<string, unknown>) {
  return db("conversations")
    .where({ id, type: "group" })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*")
    .then((rows) => rows[0]);
}

/** Adds a member to a group conversation. */
export function addMember(conversationId: number, userId: number) {
  return db("conversation_members")
    .insert({ conversation_id: conversationId, user_id: userId })
    .onConflict(["conversation_id", "user_id"])
    .ignore();
}

/** Removes a member from a conversation. */
export function removeMember(conversationId: number, userId: number) {
  return db("conversation_members")
    .where({ conversation_id: conversationId, user_id: userId })
    .delete();
}

/** Lists a cursor page of messages, returning oldest first. */
export async function listMessages(
  conversationId: number,
  before?: number,
  limit = 30,
) {
  const query = db("messages")
    .where({ conversation_id: conversationId })
    .orderBy("id", "desc")
    .limit(limit);
  if (before) query.where("id", "<", before);
  const rows = await query;
  return rows.reverse();
}

/** Lists messages after a cursor for polling. */
export function listMessagesAfter(conversationId: number, after = 0) {
  return db("messages")
    .where({ conversation_id: conversationId })
    .where("id", ">", after)
    .orderBy("id", "asc")
    .limit(100);
}

/** Inserts a message and updates conversation sort time. */
export async function createMessage(
  conversationId: number,
  userId: number,
  content: string,
) {
  return db.transaction(async (trx) => {
    const [message] = await trx("messages")
      .insert({ conversation_id: conversationId, user_id: userId, content })
      .returning("*");
    await trx("conversations")
      .where({ id: conversationId })
      .update({ last_message_at: trx.fn.now(), updated_at: trx.fn.now() });
    return message;
  });
}

/** Updates a message owned by a user. */
export function updateMessage(id: number, userId: number, content: string) {
  return db("messages")
    .where({ id, user_id: userId, is_deleted: false })
    .update({ content, is_edited: true, updated_at: db.fn.now() })
    .returning("*")
    .then((rows) => rows[0]);
}

/** Soft deletes a message owned by a user. */
export function deleteMessage(id: number, userId: number) {
  return db("messages")
    .where({ id, user_id: userId })
    .update({ is_deleted: true, content: "", updated_at: db.fn.now() });
}

/** Adds a reaction, ignoring duplicates. */
export function addReaction(messageId: number, userId: number, emoji: string) {
  return db("reactions")
    .insert({ message_id: messageId, user_id: userId, emoji })
    .onConflict(["message_id", "user_id", "emoji"])
    .ignore();
}

/** Removes a reaction. */
export function removeReaction(
  messageId: number,
  userId: number,
  emoji: string,
) {
  return db("reactions")
    .where({ message_id: messageId, user_id: userId, emoji })
    .delete();
}

/** Lists grouped reactions for messages. */
export function listReactions(messageIds: number[]) {
  return db("reactions").whereIn("message_id", messageIds);
}

/** Upserts a typing indicator. */
export function upsertTyping(conversationId: number, userId: number) {
  return db("typing_indicators")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      started_at: db.fn.now(),
    })
    .onConflict(["conversation_id", "user_id"])
    .merge({ started_at: db.fn.now() });
}

/** Lists non-stale typing users. */
export function listTyping(conversationId: number, exceptUserId: number) {
  return db("typing_indicators")
    .join("users", "users.id", "typing_indicators.user_id")
    .where("typing_indicators.conversation_id", conversationId)
    .whereNot("typing_indicators.user_id", exceptUserId)
    .whereRaw("typing_indicators.started_at > now() - interval '5 seconds'")
    .select(
      "users.id",
      "users.username",
      "users.display_name",
      "users.avatar_url",
      "users.status",
    );
}

/** Updates user heartbeat status. */
export function heartbeat(userId: number) {
  return db("users")
    .where({ id: userId })
    .update({
      status: "online",
      last_seen_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(["id", "status", "last_seen_at"])
    .then((rows) => rows[0]);
}

/** Marks a conversation read for a user. */
export function markRead(
  conversationId: number,
  userId: number,
  messageId: number,
) {
  return db("conversation_members")
    .where({ conversation_id: conversationId, user_id: userId })
    .update({ last_read_message_id: messageId });
}

/** Searches visible message content. */
export function searchMessages(
  userId: number,
  q: string,
  conversationId?: number,
) {
  const query = db("messages")
    .join(
      "conversation_members",
      "conversation_members.conversation_id",
      "messages.conversation_id",
    )
    .where("conversation_members.user_id", userId)
    .where("messages.is_deleted", false)
    .whereILike("messages.content", `%${q}%`)
    .select("messages.*")
    .orderBy("messages.created_at", "desc")
    .limit(50);
  if (conversationId) query.where("messages.conversation_id", conversationId);
  return query;
}
