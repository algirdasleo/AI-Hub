import { apiFetch } from "@/lib/fetcher";
import { LoginRequestDTO, SignupRequestDTO } from "@shared/types/auth/request";
import {
  LoginResponseDTO,
  SignupResponseDTO,
  LogoutResponseDTO,
  CurrentUserResponseDTO,
} from "@shared/types/auth/response";
import { User } from "@shared/types/auth/user";

const CACHE_DURATION = 5 * 60 * 1000;
const TOKEN_EXPIRY_BUFFER = 60 * 1000;

let userCache: User | null = null;
let lastFetchTime = 0;

function getTokenExpiration(): number | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) => c.trim().startsWith("sb-access-token="));
  if (!tokenCookie) return null;

  const token = tokenCookie.split("=")[1];
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenExpiredOrExpiringSoon(): boolean {
  const expiration = getTokenExpiration();
  if (!expiration) return true;

  return expiration < Date.now() + TOKEN_EXPIRY_BUFFER;
}

function isCacheValid(): boolean {
  return Boolean(userCache && Date.now() - lastFetchTime < CACHE_DURATION && !isTokenExpiredOrExpiringSoon());
}

function clearCache(): void {
  userCache = null;
  lastFetchTime = 0;
}

function updateCache(user: User): void {
  userCache = user;
  lastFetchTime = Date.now();
}

export const authService = {
  async login(credentials: LoginRequestDTO) {
    const result = await apiFetch<LoginResponseDTO>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    clearCache();
    return result;
  },

  async signup(data: SignupRequestDTO) {
    const result = await apiFetch<SignupResponseDTO>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });

    clearCache();
    return result;
  },

  async logout() {
    const result = await apiFetch<LogoutResponseDTO>("/api/auth/logout", {
      method: "POST",
    });

    clearCache();
    return result;
  },

  async getCurrentUser() {
    if (isCacheValid()) {
      return {
        isSuccess: true,
        value: { success: true, user: userCache! },
      } as const;
    }

    const result = await apiFetch<CurrentUserResponseDTO>("/api/auth/me", {
      method: "GET",
    });

    if (result.isSuccess && result.value.success) {
      updateCache(result.value.user);
    } else {
      clearCache();
    }

    return result;
  },

  clearCache,
};
