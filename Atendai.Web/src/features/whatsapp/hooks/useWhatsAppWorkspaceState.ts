import { useState } from "react";
import type { CampaignRule, WhatsAppChannel, WhatsAppConnection, WhatsAppLog } from "@shared/types";

const emptyWhatsAppDraft = {
  wabaId: "",
  phoneNumberId: "",
  verifyToken: "",
  accessToken: "",
  isActive: true
};

const emptyCampaignDraft = {
  id: "",
  name: "",
  delayHours: 24,
  template: "",
  isActive: true
};

const emptyChannelDraft = {
  displayName: "",
  wabaId: "",
  phoneNumberId: "",
  verifyToken: "",
  accessToken: "",
  isActive: true,
  isPrimary: false
};

export function useWhatsAppWorkspaceState() {
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConnection | null>(null);
  const [whatsAppDraft, setWhatsAppDraft] = useState(emptyWhatsAppDraft);
  const [campaigns, setCampaigns] = useState<CampaignRule[]>([]);
  const [campaignDraft, setCampaignDraft] = useState(emptyCampaignDraft);
  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>([]);
  const [whatsAppChannels, setWhatsAppChannels] = useState<WhatsAppChannel[]>([]);
  const [whatsAppChannelLimit, setWhatsAppChannelLimit] = useState(0);
  const [editingChannelId, setEditingChannelId] = useState("");
  const [channelDraft, setChannelDraft] = useState(emptyChannelDraft);

  function resetWhatsAppWorkspaceState() {
    setWhatsAppConfig(null);
    setWhatsAppDraft(emptyWhatsAppDraft);
    setCampaigns([]);
    setCampaignDraft(emptyCampaignDraft);
    setWhatsAppLogs([]);
    setWhatsAppChannels([]);
    setWhatsAppChannelLimit(0);
    setEditingChannelId("");
    setChannelDraft(emptyChannelDraft);
  }

  return {
    whatsAppConfig,
    setWhatsAppConfig,
    whatsAppDraft,
    setWhatsAppDraft,
    campaigns,
    setCampaigns,
    campaignDraft,
    setCampaignDraft,
    whatsAppLogs,
    setWhatsAppLogs,
    whatsAppChannels,
    setWhatsAppChannels,
    whatsAppChannelLimit,
    setWhatsAppChannelLimit,
    editingChannelId,
    setEditingChannelId,
    channelDraft,
    setChannelDraft,
    resetWhatsAppWorkspaceState
  };
}
