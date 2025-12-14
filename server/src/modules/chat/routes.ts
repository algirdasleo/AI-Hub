import { Router } from "express";
import { ChatStreamSchema } from "@shared/types/chat/index.js";
import { validateBody, authMiddleware } from "@server/middleware/index.js";
import {
  createChatJob,
  streamChatByUid,
  getConversations,
  getMessages,
  deleteConversation,
} from "./controller.js";

const router = Router();

router.post("/job", authMiddleware, validateBody(ChatStreamSchema), createChatJob);
router.get("/stream", authMiddleware, streamChatByUid);
router.get("/conversations", authMiddleware, getConversations);
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);
router.delete("/conversations/:conversationId", authMiddleware, deleteConversation);

export const chatRouter = router;
