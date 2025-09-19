import { validateBody } from "@server/middleware/validate-body.js";
import { Router } from "express";
import { ChatStreamSchema } from "@shared/types/chat/index.js";

import { streamChat } from "./controller.js";

const router = Router();

router.post("/", validateBody(ChatStreamSchema), streamChat);

export default router;
