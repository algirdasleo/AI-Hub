import { supabaseServer } from "@server/db/supabase.js";
import { LoginRequestDTO, SignupRequestDTO } from "@shared/types/auth/index.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Result } from "@shared/utils/result.js";

export class AuthService {
  static async signup(req: SignupRequestDTO) {
    const { email, password } = req;

    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
      },
    });

    if (error)
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "Failed to create account",
        cause: error,
      });

    return Result.okVoid();
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
        cause: error.message,
      });

    return Result.ok(data);
  }
}
