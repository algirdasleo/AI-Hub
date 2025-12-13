import { ErrorType, Result } from "@shared/utils";

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verify-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: localStorage.getItem("access_token"),
        refreshToken,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      console.error("[refreshAccessToken] Token refresh failed:", response.status);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return null;
    }

    const data = (await response.json()) as { access_token: string; refresh_token: string };
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch (error) {
    console.error("[refreshAccessToken] Error:", error);
    return null;
  }
}

export async function apiFetch<T>(endpoint_path: string, options?: RequestInit): Promise<Result<T>> {
  try {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      console.error("[apiFetch] NEXT_PUBLIC_SERVER_URL not defined");
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "NEXT_PUBLIC_SERVER_URL is not defined",
      });
    }

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}${endpoint_path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (refreshToken) {
        headers["X-Refresh-Token"] = refreshToken;
      }
    }

    let res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const newAccessToken = res.headers.get("X-New-Access-Token");
    const newRefreshToken = res.headers.get("X-New-Refresh-Token");
    if (newAccessToken && newRefreshToken) {
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);
    }

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`[apiFetch] Error: ${res.status} ${text}`);

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }

      return Result.fail({
        type: ErrorType.InternalServerError,
        message: `API Error: ${res.status} ${text}`,
      });
    }

    const data = (await res.json()) as T;
    return Result.ok<T>(data);
  } catch (error) {
    console.error("[apiFetch] Error:", error);
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: error instanceof Error ? error.message : "API Fetch Error",
      details: error,
    });
  }
}
