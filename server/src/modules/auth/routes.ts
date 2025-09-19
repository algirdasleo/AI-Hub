import { Router } from "express";
import { validateBody } from "@server/middleware/validate-body.js";
import { authMiddleware } from "@server/middleware/auth-middleware.js";
import { SignupRequestSchema, LoginRequestSchema } from "@shared/types/auth/index.js";

import { signup, login, logout } from "./controller.js";

const router = Router();

router.post("/signup", validateBody(SignupRequestSchema), signup);
router.post("/login", validateBody(LoginRequestSchema), login);
router.post("/logout", authMiddleware, logout);

export default router;
