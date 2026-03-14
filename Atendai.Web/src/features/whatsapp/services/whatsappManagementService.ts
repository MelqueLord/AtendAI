import { api } from "@infrastructure/http/api";
import type { CampaignRule, WhatsAppChannel, WhatsAppChannelsPayload, WhatsAppConnection, WhatsAppLog } from "@shared/types";

export async function fetchWhatsAppSnapshot(token: string) {
  const [config, channelsPayload, campaigns, logs] = await Promise.all([
    api.get<WhatsAppConnection | null>("/engagement/whatsapp", { token }),
    api.get<WhatsAppChannelsPayload>("/engagement/whatsapp/channels", { token }),
    api.get<CampaignRule[]>("/engagement/campaigns", { token }),
    api.get<WhatsAppLog[]>("/engagement/logs?limit=50", { token })
  ]);

  return { config, channelsPayload, campaigns, logs };
}

export function saveWhatsAppConfig(
  token: string,
  payload: {
    wabaId: string | null;
    phoneNumberId: string;
    verifyToken: string;
    accessToken: string | null;
    isActive: boolean;
  }
) {
  return api.put<WhatsAppConnection>("/engagement/whatsapp", payload, { token });
}

export function testWhatsAppConfig(token: string) {
  return api.post<{ success: boolean; status: string; error?: string | null }>("/engagement/whatsapp/test", undefined, { token });
}

export function saveCampaign(
  token: string,
  payload: {
    id?: string;
    name: string;
    delayHours: number;
    template: string;
    isActive: boolean;
  }
) {
  return payload.id
    ? api.put<null>(`/engagement/campaigns/${payload.id}`, {
        name: payload.name,
        delayHours: payload.delayHours,
        template: payload.template,
        isActive: payload.isActive
      }, { token })
    : api.post<null>("/engagement/campaigns", {
        name: payload.name,
        delayHours: payload.delayHours,
        template: payload.template,
        isActive: payload.isActive
      }, { token });
}

export function deleteCampaign(token: string, ruleId: string) {
  return api.delete<null>(`/engagement/campaigns/${ruleId}`, { token });
}

export function saveChannel(
  token: string,
  payload: {
    id?: string;
    displayName: string;
    wabaId: string | null;
    phoneNumberId: string;
    verifyToken: string;
    accessToken: string | null;
    isActive: boolean;
    isPrimary: boolean;
  }
) {
  return payload.id
    ? api.put<null>(`/engagement/whatsapp/channels/${payload.id}`, {
        displayName: payload.displayName,
        wabaId: payload.wabaId,
        phoneNumberId: payload.phoneNumberId,
        verifyToken: payload.verifyToken,
        accessToken: payload.accessToken,
        isActive: payload.isActive,
        isPrimary: payload.isPrimary
      }, { token })
    : api.post<null>("/engagement/whatsapp/channels", {
        displayName: payload.displayName,
        wabaId: payload.wabaId,
        phoneNumberId: payload.phoneNumberId,
        verifyToken: payload.verifyToken,
        accessToken: payload.accessToken,
        isActive: payload.isActive,
        isPrimary: payload.isPrimary
      }, { token });
}

export function deleteChannel(token: string, channelId: string) {
  return api.delete<null>(`/engagement/whatsapp/channels/${channelId}`, { token });
}

export function testChannel(token: string, channelId: string) {
  return api.post<{ success: boolean; status: string; error?: string | null }>(`/engagement/whatsapp/channels/${channelId}/test`, undefined, { token });
}
