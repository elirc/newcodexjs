import axios from "axios";
import type { Conversation, Message, User } from "../types/chat";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4112/api",
  headers: { "x-demo-user-id": "1" }
});

/** Unwraps the shared API success envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const chatApi = {
  /** Lists conversations with unread counts and last messages. */
  listConversations: async () => unwrap<Conversation[]>(await api.get("/conversations")),
  /** Creates a group conversation. */
  createGroup: async (payload: { name: string; memberIds: number[] }) => unwrap<Conversation>(await api.post("/conversations/group", payload)),
  /** Gets a page of messages before an optional cursor. */
  getMessages: async (conversationId: number, before?: number) =>
    unwrap<{ messages: Message[]; nextCursor: number | null }>(await api.get(`/conversations/${conversationId}/messages`, { params: { before, limit: 30 } })),
  /** Polls messages after the latest known id. */
  getNewMessages: async (conversationId: number, after?: number) =>
    unwrap<Message[]>(await api.get(`/conversations/${conversationId}/messages/new`, { params: { after } })),
  /** Sends a new message. */
  sendMessage: async (conversationId: number, content: string) => unwrap<Message>(await api.post(`/conversations/${conversationId}/messages`, { content })),
  /** Edits a message owned by the demo user. */
  editMessage: async (id: number, content: string) => unwrap<Message>(await api.put(`/messages/${id}`, { content })),
  /** Soft deletes a message owned by the demo user. */
  deleteMessage: async (id: number) => unwrap(await api.delete(`/messages/${id}`)),
  /** Toggles a reaction by adding the chosen emoji. */
  addReaction: async (id: number, emoji: string) => unwrap(await api.post(`/messages/${id}/reactions`, { emoji })),
  /** Sends a typing heartbeat. */
  typing: async (conversationId: number) => unwrap(await api.post(`/conversations/${conversationId}/typing`)),
  /** Fetches non-stale typing users. */
  typingUsers: async (conversationId: number) => unwrap<User[]>(await api.get(`/conversations/${conversationId}/typing`)),
  /** Marks a conversation as read through a message id. */
  markRead: async (conversationId: number, messageId: number) => unwrap(await api.post(`/conversations/${conversationId}/read`, { messageId })),
  /** Sends a presence heartbeat for the demo user. */
  heartbeat: async () => unwrap(await api.post("/presence/heartbeat")),
  /** Gets presence for known contacts. */
  presence: async () => unwrap<User[]>(await api.get("/presence/status")),
  /** Searches messages. */
  search: async (q: string, conversationId?: number) => unwrap<Message[]>(await api.get("/messages/search", { params: { q, conversationId } }))
};

