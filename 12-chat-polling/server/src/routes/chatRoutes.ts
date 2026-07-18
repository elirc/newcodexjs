import { Router } from "express";
import * as controller from "../controllers/chatController.js";
import { validateBody } from "../middleware/validate.js";
import { directSchema, groupSchema, groupUpdateSchema, memberSchema, messageSchema, reactionSchema, readSchema } from "../validators/chatValidators.js";

export const chatRouter = Router();

chatRouter.get("/conversations", controller.listConversations);
chatRouter.post("/conversations/direct", validateBody(directSchema), controller.startDirect);
chatRouter.post("/conversations/group", validateBody(groupSchema), controller.createGroup);
chatRouter.put("/conversations/:id", validateBody(groupUpdateSchema), controller.updateConversation);
chatRouter.post("/conversations/:id/members", validateBody(memberSchema), controller.addMember);
chatRouter.delete("/conversations/:id/members/:userId", controller.removeMember);
chatRouter.delete("/conversations/:id/leave", controller.leaveConversation);
chatRouter.get("/conversations/:id/messages", controller.getMessages);
chatRouter.post("/conversations/:id/messages", validateBody(messageSchema), controller.sendMessage);
chatRouter.put("/messages/:id", validateBody(messageSchema), controller.editMessage);
chatRouter.delete("/messages/:id", controller.deleteMessage);
chatRouter.get("/conversations/:id/messages/new", controller.getNewMessages);
chatRouter.get("/messages/search", controller.searchMessages);
chatRouter.post("/messages/:id/reactions", validateBody(reactionSchema), controller.addReaction);
chatRouter.delete("/messages/:id/reactions/:emoji", controller.removeReaction);
chatRouter.post("/presence/heartbeat", controller.heartbeat);
chatRouter.get("/presence/status", controller.presence);
chatRouter.post("/conversations/:id/typing", controller.typing);
chatRouter.get("/conversations/:id/typing", controller.getTyping);
chatRouter.post("/conversations/:id/read", validateBody(readSchema), controller.markRead);

