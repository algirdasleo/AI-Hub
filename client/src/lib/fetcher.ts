import { ErrorType } from "@shared-utils/error-type";
import { Result } from "../../../shared/utils/result";
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return Result.fail({
        name: ErrorType.InternalServerError,
        message: `API Error: ${res.status} ${text}`,
      });
    }
    const data = (await res.json()) as T;
    return Result.ok<T>(data);
  } catch (error) {
    return Result.fail({
      name: ErrorType.InternalServerError,
      message: "API Fetch Error",
      cause: error,
    });
  }
}
