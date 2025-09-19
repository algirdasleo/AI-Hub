import { JWTPayload } from "jose";
import { Request } from "express";
import { User } from "@shared/types/auth/index.js";

export interface SupabaseJWTPayload extends JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  aud: string; // audience
  exp: number; // expiration time
  iat: number; // issued at time
  user_metadata: {
    display_name: string;
  };
  app_metadata: {
    subscription_tier: string;
  };
}

export interface AuthRequest extends Request {
  user?: User;
}
