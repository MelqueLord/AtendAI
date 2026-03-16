import { api } from "@infrastructure/http/api";
import type { MetaWhatsAppBootstrapResult, MetaWhatsAppSetup } from "@shared/types";

export type MetaBootstrapDraft = {
  displayName: string;
  phoneNumberId: string;
  accessToken: string;
  isPrimary: boolean;
};

export type MetaTestResult = {
  success: boolean;
  status: string;
  error?: string | null;
};

export function fetchMetaSetup(token: string) {
  return api.get<MetaWhatsAppSetup>("/engagement/whatsapp/meta/setup", { token });
}

export function bootstrapMetaChannel(token: string, draft: MetaBootstrapDraft) {
  return api.post<MetaWhatsAppBootstrapResult>(
    "/engagement/whatsapp/meta/bootstrap",
    {
      displayName: draft.displayName,
      phoneNumberId: draft.phoneNumberId,
      accessToken: draft.accessToken,
      verifyToken: null,
      wabaId: null,
      isActive: true,
      isPrimary: draft.isPrimary,
      publicBaseUrl: null
    },
    { token }
  );
}

export function testMetaConnection(token: string, channelId?: string) {
  const path = channelId
    ? `/engagement/whatsapp/channels/${channelId}/test`
    : "/engagement/whatsapp/test";

  return api.post<MetaTestResult>(path, undefined, { token });
}

export function updateMetaChannel(
  token: string,
  channel: {
    id: string;
    displayName: string;
    wabaId: string | null;
    phoneNumberId: string;
    verifyToken: string;
    isActive: boolean;
    isPrimary: boolean;
  },
  changes: { displayName?: string; isActive?: boolean; isPrimary?: boolean }
) {
  return api.put<null>(
    `/engagement/whatsapp/channels/${channel.id}`,
    {
      displayName: changes.displayName ?? channel.displayName,
      wabaId: channel.wabaId,
      phoneNumberId: channel.phoneNumberId,
      verifyToken: channel.verifyToken,
      accessToken: null,
      isActive: changes.isActive ?? channel.isActive,
      isPrimary: changes.isPrimary ?? channel.isPrimary
    },
    { token }
  );
}

export function deleteMetaChannel(token: string, channelId: string) {
  return api.delete<null>(`/engagement/whatsapp/channels/${channelId}`, { token });
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

