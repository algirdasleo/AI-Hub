import { Router } from "express";
import { SignupRequestSchema, LoginRequestSchema } from "@shared/types/auth/index.js";
import { validateBody, authMiddleware } from "@server/middleware/index.js";
import { signup, login, logout } from "./controller.js";

const router = Router();

router.post("/signup", validateBody(SignupRequestSchema), signup);
router.post("/login", validateBody(LoginRequestSchema), login);
router.post("/logout", authMiddleware, logout);

export default router;
