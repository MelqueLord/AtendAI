import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export type AttendanceRefreshPayload = {
  conversationId?: string | null;
  publishedAtUtc?: string | null;
};

export function createAttendanceHubConnection(apiBase: string, token: string) {
  const hubUrl = resolveHubUrl(apiBase);

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

function resolveHubUrl(apiBase: string) {
  const base = apiBase.trim();
  if (!base || base === "/api") {
    return "/hubs/attendance";
  }

  if (base.endsWith("/api")) {
    return `${base.slice(0, -4)}/hubs/attendance`;
  }

  return `${base.replace(/\/+$/, "")}/hubs/attendance`;
}

export type { HubConnection };
