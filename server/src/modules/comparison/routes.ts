import { Router } from "express";
import { ComparisonStreamSchema } from "@shared/types/comparison/comparison-request.js";
import { validateBody, authMiddleware } from "@server/middleware/index.js";
import {
  createComparisonJob,
  streamComparisonByUid,
  getComparisonConversations,
  getComparisonMessages,
} from "./controller.js";

const router = Router();

router.post("/job", authMiddleware, validateBody(ComparisonStreamSchema), createComparisonJob);
router.get("/stream", authMiddleware, streamComparisonByUid);
router.get("/conversations", authMiddleware, getComparisonConversations);
router.get("/conversations/:conversationId/messages", authMiddleware, getComparisonMessages);

export const comparisonRouter = router;
