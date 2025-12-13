"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { User } from "@shared/types/auth/user";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = "user-cache";

const cacheUser = (user: User) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
};

const getCachedUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const clearUserCache = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(USER_CACHE_KEY);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // Get current path
        const path = typeof window !== "undefined" ? window.location.pathname : "/";
        console.log("[AuthProvider] useEffect running, current path:", path);

        // Only validate on protected routes or auth pages
        const isProtectedRoute = path.startsWith("/dashboard");

        const isAuthPage = path.startsWith("/auth/");

        if (!isProtectedRoute && !isAuthPage) {
          console.log("[AuthProvider] Public route, skipping validation");
          return;
        }

        console.log("[AuthProvider] Starting validation");
        const cachedUser = getCachedUser();
        if (cachedUser) {
          console.log("[AuthProvider] Found cached user:", cachedUser.email);
          setUser(cachedUser);
        }

        console.log("[AuthProvider] Calling getCurrentUser()");
        const result = await authService.getCurrentUser();
        console.log("[AuthProvider] getCurrentUser result:", result);

        if (result.isSuccess && result.value.success) {
          const authenticatedUser = result.value.user;
          console.log("[AuthProvider] User authenticated:", authenticatedUser.email);
          setUser(authenticatedUser);
          cacheUser(authenticatedUser);
          console.log("[AuthProvider] User set and cached successfully");
        } else {
          console.log("[AuthProvider] Authentication failed", result);
          setUser(null);
          clearUserCache();
          // Redirect to login if accessing a protected route
          console.log("[AuthProvider] Is protected route:", isProtectedRoute);
          if (isProtectedRoute) {
            console.log("[AuthProvider] Protected route detected, redirecting to login");
            router.push("/auth/login");
          }
        }
      } catch (err) {
        console.error("[AuthProvider] Error during validation:", err);
      }
    };

    validateAuth();
  }, [router]);

  const logout = async () => {
    console.log("[AuthProvider] Logging out user");
    setUser(null);
    console.log("[AuthProvider] User set to null immediately");
    clearUserCache();
    console.log("[AuthProvider] User cache cleared");
    await authService.logout();
    console.log("[AuthProvider] authService.logout() completed");
    router.push("/auth/login");
    console.log("[AuthProvider] Navigated to login");
  };

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
