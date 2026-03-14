export type HttpRequestConfig = {
  path: string;
  init: RequestInit;
  token?: string | null;
  body?: unknown;
};

export async function applyRequestInterceptors(config: HttpRequestConfig) {
  const headers = new Headers(config.init.headers);

  if (config.token) {
    headers.set("Authorization", `Bearer ${config.token}`);
  }

  if (config.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  return {
    path: config.path,
    init: {
      ...config.init,
      headers,
      body: config.body === undefined ? config.init.body : JSON.stringify(config.body)
    }
  };
}

export async function applyResponseInterceptors<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}
