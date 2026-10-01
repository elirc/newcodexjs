import type { Request, Response } from "express";
import * as model from "../models/chatModel.js";
import * as service from "../services/chatService.js";
import { sendSuccess } from "../utils/http.js";

/** Reads the demo user from headers. */
function userId(req: Request): number {
  return Number(req.header("x-demo-user-id") ?? process.env.DEMO_USER_ID ?? 1);
}

/** Lists conversations for the user. */
export async function listConversations(req: Request, res: Response) {
  sendSuccess(res, await service.listConversations(userId(req)));
}

/** Starts or gets a direct conversation. */
export async function startDirect(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.startDirect(userId(req), req.body.userId),
    201,
  );
}

/** Creates a group conversation. */
export async function createGroup(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.createGroup(userId(req), req.body.name, req.body.memberIds),
    201,
  );
}

/** Updates group metadata. */
export async function updateConversation(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.updateConversation(Number(String(req.params.id)), req.body),
  );
}

/** Adds a group member. */
export async function addMember(req: Request, res: Response) {
  await model.addMember(Number(String(req.params.id)), req.body.userId);
  sendSuccess(res, { added: true });
}

/** Removes a group member. */
export async function removeMember(req: Request, res: Response) {
  await model.removeMember(
    Number(String(req.params.id)),
    Number(req.params.userId),
  );
  sendSuccess(res, { removed: true });
}

/** Leaves a conversation. */
export async function leaveConversation(req: Request, res: Response) {
  await model.removeMember(Number(String(req.params.id)), userId(req));
  sendSuccess(res, { left: true });
}

/** Gets message history. */
export async function getMessages(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.getMessages(
      Number(String(req.params.id)),
      req.query.before ? Number(req.query.before) : undefined,
      Number(req.query.limit ?? 30),
    ),
  );
}

/** Sends a new message. */
export async function sendMessage(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.sendMessage(
      Number(String(req.params.id)),
      userId(req),
      req.body.content,
    ),
    201,
  );
}

/** Edits a message. */
export async function editMessage(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.editMessage(
      Number(String(req.params.id)),
      userId(req),
      req.body.content,
    ),
  );
}

/** Deletes a message. */
export async function deleteMessage(req: Request, res: Response) {
  await model.deleteMessage(Number(String(req.params.id)), userId(req));
  sendSuccess(res, { deleted: true });
}

/** Polls for messages after a cursor. */
export async function getNewMessages(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.getNewMessages(
      Number(String(req.params.id)),
      req.query.after ? Number(req.query.after) : 0,
    ),
  );
}

/** Searches messages. */
export async function searchMessages(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.searchMessages(
      userId(req),
      String(req.query.q ?? ""),
      req.query.conversationId ? Number(req.query.conversationId) : undefined,
    ),
  );
}

/** Adds a reaction. */
export async function addReaction(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.addReaction(
      Number(String(req.params.id)),
      userId(req),
      req.body.emoji,
    ),
    201,
  );
}

/** Removes a reaction. */
export async function removeReaction(req: Request, res: Response) {
  await model.removeReaction(
    Number(String(req.params.id)),
    userId(req),
    String(req.params.emoji),
  );
  sendSuccess(res, { removed: true });
}

/** Updates presence heartbeat. */
export async function heartbeat(req: Request, res: Response) {
  sendSuccess(res, await model.heartbeat(userId(req)));
}

/** Lists contact presence. */
export async function presence(req: Request, res: Response) {
  sendSuccess(res, await service.getPresence(userId(req)));
}

/** Signals typing in a conversation. */
export async function typing(req: Request, res: Response) {
  await model.upsertTyping(Number(String(req.params.id)), userId(req));
  sendSuccess(res, { typing: true });
}

/** Lists non-stale typing users. */
export async function getTyping(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.listTyping(Number(String(req.params.id)), userId(req)),
  );
}

/** Marks a conversation read. */
export async function markRead(req: Request, res: Response) {
  await model.markRead(
    Number(String(req.params.id)),
    userId(req),
    req.body.messageId,
  );
  sendSuccess(res, { read: true });
}
