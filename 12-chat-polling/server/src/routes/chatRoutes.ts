import { db } from "../config/db.js";
import { NotFoundError, ValidationError } from "../middleware/errors.js";
import type { RequestHandler } from "express";
import { Router } from "express";
import * as controller from "../controllers/chatController.js";
import { validateBody } from "../middleware/validate.js";
import {
  directSchema,
  groupSchema,
  groupUpdateSchema,
  memberSchema,
  messageSchema,
  reactionSchema,
  readSchema,
} from "../validators/chatValidators.js";

export const chatRouter = Router();
chatRouter.use(async (req, res, next) => {
  try {
    const user = Number(
      req.header("x-demo-user-id") ?? process.env.DEMO_USER_ID ?? 1,
    );
    if (!Number.isSafeInteger(user) || user < 1)
      throw new ValidationError("Invalid demo user id");
    const match = /^\/(conversations|messages)\/(\d+)(?:\/|$)/.exec(req.path);
    if (!match) return next();
    const id = Number(match[2]);
    const message =
      match[1] === "messages"
        ? await db("messages")
            .where({ id })
            .where({ is_deleted: false })
            .first()
        : null;
    if (match[1] === "messages" && !message)
      throw new NotFoundError("Message not found");
    const conversationId = message?.conversation_id ?? id;
    const member = await db("conversation_members")
      .where({ conversation_id: conversationId, user_id: user })
      .first();
    if (!member) throw new NotFoundError("Conversation not found");
    const managesGroup =
      match[1] === "conversations" &&
      ((req.method === "PUT" && /^\/conversations\/\d+$/.test(req.path)) ||
        req.path.includes("/members"));
    if (managesGroup && member.role !== "admin")
      throw new ValidationError(
        "Only group admins may manage this conversation",
      );
    if (req.path.endsWith("/read") && req.method === "POST") {
      // The guard runs before validateBody(readSchema); reject a missing or
      // malformed id here so the lookup below never sees undefined (500).
      const messageId = Number(req.body?.messageId);
      if (!Number.isSafeInteger(messageId) || messageId < 1)
        throw new ValidationError("messageId must be a positive whole number");
      const read = await db("messages")
        .where({ id: messageId, conversation_id: conversationId })
        .first();
      if (!read)
        throw new ValidationError(
          "Read receipt must reference this conversation",
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/conversations", wrap(controller.listConversations));
chatRouter.post(
  "/conversations/direct",
  validateBody(directSchema),
  wrap(controller.startDirect),
);
chatRouter.post(
  "/conversations/group",
  validateBody(groupSchema),
  wrap(controller.createGroup),
);
chatRouter.put(
  "/conversations/:id",
  validateBody(groupUpdateSchema),
  wrap(controller.updateConversation),
);
chatRouter.post(
  "/conversations/:id/members",
  validateBody(memberSchema),
  wrap(controller.addMember),
);
chatRouter.delete(
  "/conversations/:id/members/:userId",
  wrap(controller.removeMember),
);
chatRouter.delete(
  "/conversations/:id/leave",
  wrap(controller.leaveConversation),
);
chatRouter.get("/conversations/:id/messages", wrap(controller.getMessages));
chatRouter.post(
  "/conversations/:id/messages",
  validateBody(messageSchema),
  wrap(controller.sendMessage),
);
chatRouter.put(
  "/messages/:id",
  validateBody(messageSchema),
  wrap(controller.editMessage),
);
chatRouter.delete("/messages/:id", wrap(controller.deleteMessage));
chatRouter.get(
  "/conversations/:id/messages/new",
  wrap(controller.getNewMessages),
);
chatRouter.get("/messages/search", wrap(controller.searchMessages));
chatRouter.post(
  "/messages/:id/reactions",
  validateBody(reactionSchema),
  wrap(controller.addReaction),
);
chatRouter.delete(
  "/messages/:id/reactions/:emoji",
  wrap(controller.removeReaction),
);
chatRouter.post("/presence/heartbeat", wrap(controller.heartbeat));
chatRouter.get("/presence/status", wrap(controller.presence));
chatRouter.post("/conversations/:id/typing", wrap(controller.typing));
chatRouter.get("/conversations/:id/typing", wrap(controller.getTyping));
chatRouter.post(
  "/conversations/:id/read",
  validateBody(readSchema),
  wrap(controller.markRead),
);

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
