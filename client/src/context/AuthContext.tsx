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
      const cachedUser = getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      const result = await authService.getCurrentUser();

      if (result.isSuccess && result.value.success) {
        const authenticatedUser = result.value.user;
        setUser(authenticatedUser);
        cacheUser(authenticatedUser);
      } else {
        setUser(null);
        clearUserCache();
      }
    };

    validateAuth();
  }, []);

  const logout = async () => {
    await authService.logout();
    setUser(null);
    clearUserCache();
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
