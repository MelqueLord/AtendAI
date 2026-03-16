import { HttpError } from "@infrastructure/http/httpClient";

type ErrorPayload = {
  message?: string;
  detail?: string;
  error?: string | null;
  title?: string;
  status?: string;
};

export function resolveApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof HttpError) {
    const data = error.data;

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    const payload = data as ErrorPayload | null;
    return payload?.message || payload?.detail || payload?.error || payload?.title || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function extractApiErrorData<T>(error: unknown) {
  if (error instanceof HttpError) {
    return (error.data as T | null) ?? null;
  }

  return null;
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
