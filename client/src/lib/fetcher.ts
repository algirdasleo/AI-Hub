import { ErrorType, Result } from "@shared/utils";
export async function apiFetch<T>(endpoint_path: string, options?: RequestInit): Promise<Result<T>> {
  try {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: "NEXT_PUBLIC_SERVER_URL is not defined",
      });
    }

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}${endpoint_path}`;

    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("API Error Response:", text);
      return Result.fail({
        type: ErrorType.InternalServerError,
        message: `API Error: ${res.status} ${text}`,
      });
    }

    const data = (await res.json()) as T;
    return Result.ok<T>(data);
  } catch (error) {
    console.error("API Fetch Error:", error);
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: error instanceof Error ? error.message : "API Fetch Error",
      details: error,
    });
  }
}
