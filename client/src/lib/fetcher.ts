import { ErrorType, Result } from "@shared/utils";
export async function apiFetch<T>(endpoint_path: string, options?: RequestInit): Promise<Result<T>> {
  try {
    console.log(`[apiFetch] Starting fetch to ${endpoint_path}`);

    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      console.error("[apiFetch] NEXT_PUBLIC_SERVER_URL not defined");
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "NEXT_PUBLIC_SERVER_URL is not defined",
      });
    }

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}${endpoint_path}`;
    console.log(`[apiFetch] Full URL: ${url}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        console.log(`[apiFetch] Found access token, adding Bearer token`);
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.log(`[apiFetch] No access token found in localStorage`);
      }
    }

    console.log(`[apiFetch] Making fetch request with credentials: include`);
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    console.log(`[apiFetch] Response status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[apiFetch] Error response: ${text}`);
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: `API Error: ${res.status} ${text}`,
      });
    }

    const data = (await res.json()) as T;
    console.log(`[apiFetch] Success for ${endpoint_path}, data:`, data);
    return Result.ok<T>(data);
  } catch (error) {
    console.error("[apiFetch] Fetch error:", error);
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: error instanceof Error ? error.message : "API Fetch Error",
      details: error,
    });
  }
}
