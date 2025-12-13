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
        const path = typeof window !== "undefined" ? window.location.pathname : "/";
        const isProtectedRoute = path.startsWith("/app");

        if (!isProtectedRoute) {
          return;
        }

        const cachedUser = getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
        }

        const result = await authService.getCurrentUser();

        if (result.isSuccess && result.value.success) {
          setUser(result.value.user);
          cacheUser(result.value.user);
        } else {
          setUser(null);
          clearUserCache();
          if (isProtectedRoute) {
            router.push("/auth/login");
          }
        }
      } catch (err) {
        console.error("Auth validation error:", err);
      }
    };

    validateAuth();
  }, [router]);

  const logout = async () => {
    setUser(null);
    clearUserCache();
    await authService.logout();
    router.push("/auth/login");
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
