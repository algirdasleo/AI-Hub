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
  if (typeof localStorage === "undefined") return null;

  const token = localStorage.getItem("access_token");
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
    console.log(`[authService.login] Starting login for ${credentials.email}`);
    const result = await apiFetch<LoginResponseDTO>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    console.log(`[authService.login] Login result:`, result);
    if (result.isSuccess && result.value.success) {
      console.log(`[authService.login] Login successful, storing tokens in localStorage`);
      localStorage.setItem("access_token", result.value.access_token);
      localStorage.setItem("refresh_token", result.value.refresh_token);
      console.log(
        `[authService.login] Tokens stored. Access token preview:`,
        result.value.access_token.substring(0, 50),
      );
    } else {
      console.log(`[authService.login] Login failed, result:`, result);
    }

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
    console.log("[authService.logout] Starting logout");
    console.log("[authService.logout] Removing access_token from localStorage");
    localStorage.removeItem("access_token");
    console.log("[authService.logout] Removing refresh_token from localStorage");
    localStorage.removeItem("refresh_token");
    console.log("[authService.logout] Clearing cache");
    clearCache();
    console.log("[authService.logout] Calling logout endpoint");
    const result = await apiFetch<LogoutResponseDTO>("/api/auth/logout", { method: "POST" });
    console.log("[authService.logout] Logout result:", result);
    return result;
  },

  async getCurrentUser() {
    console.log(`[authService.getCurrentUser] Checking cache validity`);
    if (isCacheValid()) {
      console.log("[authService.getCurrentUser] Returning cached user:", userCache?.email);
      return {
        isSuccess: true,
        value: { success: true, user: userCache! },
      } as const;
    }

    console.log(`[authService.getCurrentUser] Cache invalid, fetching from server`);
    const result = await apiFetch<CurrentUserResponseDTO>("/api/auth/me", {
      method: "GET",
    });

    console.log(`[authService.getCurrentUser] Result:`, result);
    if (result.isSuccess && result.value.success) {
      console.log(`[authService.getCurrentUser] Got user:`, result.value.user.email);
      updateCache(result.value.user);
    } else {
      console.log(`[authService.getCurrentUser] Request failed or no success`);
      clearCache();
    }

    return result;
  },

  clearCache,
};
