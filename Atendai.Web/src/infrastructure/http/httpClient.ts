import { env } from "@infrastructure/config/env";
import { applyRequestInterceptors, applyResponseInterceptors } from "@infrastructure/http/interceptors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions = {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const prepared = await applyRequestInterceptors({
    path,
    token: options.token,
    body: options.body,
    init: {
      method: options.method ?? "GET",
      headers: options.headers,
      signal: options.signal
    }
  });

  const response = await fetch(`${env.apiBaseUrl}${prepared.path}`, prepared.init);
  const data = await applyResponseInterceptors<T>(response);

  if (!response.ok) {
    throw new HttpError(`HTTP ${response.status}`, response.status, data);
  }

  return data;
}

export const httpClient = {
  request,
  get: <T>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "DELETE" })
};
