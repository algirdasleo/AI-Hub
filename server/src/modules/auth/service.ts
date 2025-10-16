import { supabaseServer } from "@server/db/supabase.js";
import { LoginRequestDTO, SignupRequestDTO, SubscriptionTier, UserRole } from "@shared/types/auth/index.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Result } from "@shared/utils/result.js";
import { Request, Response } from "express";
import { verificationEmitter } from "./verification-emitter.js";

export class AuthService {
  static async signup(req: SignupRequestDTO) {
    const { email, password } = req;

    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
        data: {
          display_name: req.display_name || email.split("@")[0],
          role: UserRole.USER,
          subscription_tier: SubscriptionTier.FREE,
        },
      },
    });

    if (error)
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "Failed to create account",
        details: error,
      });

    if (!data.user)
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "Failed to create account",
        details: "No user data returned",
      });

    return Result.ok({
      requiresEmailVerification: !data.session,
    });
  }

  static async login(req: LoginRequestDTO) {
    const { email, password } = req;

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error)
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "Login failed",
        details: "Invalid credentials",
      });

    return Result.ok(data);
  }

  static async verifyTokens(accessToken: string, refreshToken: string) {
    const { data, error } = await supabaseServer.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error)
      return Result.fail({
        type: ErrorType.Unauthorized,
        message: "Invalid or expired tokens",
        details: error.message,
      });

    if (!data.session || !data.user)
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "Failed to verify tokens",
        details: "No session data returned",
      });

    return Result.ok(data);
  }

  static setupVerificationSSE(req: Request, res: Response, email: string) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.write('data: {"status":"connected"}\n\n');

    const verificationHandler = (data: { userId: string; email: string }) => {
      if (data.email === email) {
        res.write(`data: ${JSON.stringify({ status: "verified", userId: data.userId })}\n\n`);
      }
    };

    verificationEmitter.on("verification", verificationHandler);

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      verificationEmitter.off("verification", verificationHandler);
    });
  }
}
