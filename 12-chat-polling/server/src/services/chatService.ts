import { db } from "../config/db.js";
import { NotFoundError, ValidationError } from "../middleware/errors.js";
import * as chat from "../models/chatModel.js";

/** Adds senders and grouped reactions to message records. */
async function hydrateMessages(messages: any[]) {
  const userIds = [...new Set(messages.map((message) => message.user_id))];
  const users = userIds.length ? await db("users").whereIn("id", userIds).select("id", "username", "display_name", "avatar_url", "status", "last_seen_at") : [];
  const reactions = messages.length ? await chat.listReactions(messages.map((message) => message.id)) : [];
  return messages.map((message) => ({
    ...message,
    sender: users.find((user) => user.id === message.user_id),
    reactions: Object.values(
      reactions
        .filter((reaction) => reaction.message_id === message.id)
        .reduce((acc: Record<string, any>, reaction) => {
          acc[reaction.emoji] = acc[reaction.emoji] ?? { emoji: reaction.emoji, count: 0, user_ids: [] };
          acc[reaction.emoji].count += 1;
          acc[reaction.emoji].user_ids.push(reaction.user_id);
          return acc;
        }, {})
    )
  }));
}

/** Lists conversations with members, unread counts, and last message previews. */
export async function listConversations(userId: number) {
  const ids = await chat.listConversationIds(userId);
  if (!ids.length) return [];
  const conversations = await chat.listConversationsByIds(ids);
  const members = await chat.listMembers(ids);
  const lastMessages = await Promise.all(conversations.map((conversation) => chat.listMessages(conversation.id, undefined, 1)));
  return Promise.all(
    conversations.map(async (conversation, index) => {
      const membership = members.find((member) => member.conversation_id === conversation.id && member.user_id === userId);
      const [{ count }] = await db("messages")
        .where({ conversation_id: conversation.id })
        .where("id", ">", membership?.last_read_message_id ?? 0)
        .whereNot({ user_id: userId })
        .count<{ count: string }>("id");
      return {
        ...conversation,
        members: members.filter((member) => member.conversation_id === conversation.id),
        last_message: (await hydrateMessages(lastMessages[index]))[0] ?? null,
        unread_count: Number(count)
      };
    })
  );
}

/** Starts or returns a direct message conversation. */
export async function startDirect(userId: number, otherUserId: number) {
  if (userId === otherUserId) throw new ValidationError("Cannot create a direct message with yourself");
  const existing = await chat.findDirectConversation(userId, otherUserId);
  if (existing) return existing;
  return db.transaction((trx) => chat.createConversation(trx, { type: "direct", created_by: userId }, [userId, otherUserId], userId));
}

/** Creates a group conversation with the creator as admin. */
export function createGroup(userId: number, name: string, memberIds: number[]) {
  return db.transaction((trx) => chat.createConversation(trx, { type: "group", name, created_by: userId }, [userId, ...memberIds], userId));
}

/** Gets a cursor page of hydrated messages. */
export async function getMessages(conversationId: number, before?: number, limit = 30) {
  const messages = await chat.listMessages(conversationId, before, limit);
  return { messages: await hydrateMessages(messages), nextCursor: messages[0]?.id ?? null };
}

/** Gets new messages after the latest known id for polling. */
export async function getNewMessages(conversationId: number, after?: number) {
  return hydrateMessages(await chat.listMessagesAfter(conversationId, after ?? 0));
}

/** Sends a message after confirming membership. */
export async function sendMessage(conversationId: number, userId: number, content: string) {
  const member = await db("conversation_members").where({ conversation_id: conversationId, user_id: userId }).first();
  if (!member) throw new NotFoundError("Conversation not found");
  return chat.createMessage(conversationId, userId, content);
}

/** Edits a message owned by the user. */
export async function editMessage(id: number, userId: number, content: string) {
  const updated = await chat.updateMessage(id, userId, content);
  if (!updated) throw new NotFoundError("Message not found");
  return updated;
}

/** Returns contacts with stale users marked offline. */
export async function getPresence(userId: number) {
  await db("users").where("last_seen_at", "<", db.raw("now() - interval '90 seconds'")).update({ status: "offline" });
  return chat.listUsers(userId);
}

/** Adds an emoji reaction to a message. */
export async function addReaction(messageId: number, userId: number, emoji: string) {
  await chat.addReaction(messageId, userId, emoji);
  return { reacted: true };
}

/** Searches user-visible messages. */
export function searchMessages(userId: number, q: string, conversationId?: number) {
  if (!q || q.length < 2) return [];
  return chat.searchMessages(userId, q, conversationId);
}

