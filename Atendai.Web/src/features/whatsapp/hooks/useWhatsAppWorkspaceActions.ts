import {
  deleteCampaign as deleteCampaignRequest,
  deleteChannel as deleteChannelRequest,
  saveCampaign as saveCampaignRequest,
  saveChannel as saveChannelRequest,
  saveWhatsAppConfig as saveWhatsAppConfigRequest,
  testChannel as testChannelRequest,
  testWhatsAppConfig as testWhatsAppConfigRequest
} from "@features/whatsapp/services/whatsappManagementService";
import { subscribeToPlan } from "@features/dashboard/services/dashboardService";
import { resolveApiErrorMessage } from "@shared/utils/http";
import type {
  AppPage,
  AuthResponse,
  BillingSubscription,
  CampaignRule,
  WhatsAppChannel,
  WhatsAppConnection
} from "@shared/types";

type WhatsAppDraft = {
  wabaId: string;
  phoneNumberId: string;
  verifyToken: string;
  accessToken: string;
  isActive: boolean;
};

type CampaignDraft = {
  id: string;
  name: string;
  delayHours: number;
  template: string;
  isActive: boolean;
};

type ChannelDraft = {
  displayName: string;
  wabaId: string;
  phoneNumberId: string;
  verifyToken: string;
  accessToken: string;
  isActive: boolean;
  isPrimary: boolean;
};

type UseWhatsAppWorkspaceActionsParams = {
  auth: AuthResponse | null;
  canManage: boolean;
  whatsAppDraft: WhatsAppDraft;
  setWhatsAppDraft: (value: WhatsAppDraft | ((current: WhatsAppDraft) => WhatsAppDraft)) => void;
  campaignDraft: CampaignDraft;
  setCampaignDraft: (value: CampaignDraft) => void;
  editingChannelId: string;
  setEditingChannelId: (value: string) => void;
  channelDraft: ChannelDraft;
  setChannelDraft: (value: ChannelDraft) => void;
  loadCommercial: (token?: string, role?: string) => Promise<void>;
  loadEngagement: (token?: string, role?: string) => Promise<void>;
  setWhatsAppConfig: (value: WhatsAppConnection | null) => void;
  setBillingSubscription: (value: BillingSubscription | null) => void;
  setCurrentPage: (page: AppPage) => void;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
};

const emptyCampaignDraft = { id: "", name: "", delayHours: 24, template: "", isActive: true };
const emptyChannelDraft = {
  displayName: "",
  wabaId: "",
  phoneNumberId: "",
  verifyToken: "",
  accessToken: "",
  isActive: true,
  isPrimary: false
};

export function useWhatsAppWorkspaceActions({
  auth,
  canManage,
  whatsAppDraft,
  setWhatsAppDraft,
  campaignDraft,
  setCampaignDraft,
  editingChannelId,
  setEditingChannelId,
  channelDraft,
  setChannelDraft,
  loadCommercial,
  loadEngagement,
  setWhatsAppConfig,
  setBillingSubscription,
  setCurrentPage,
  setNotice,
  setError
}: UseWhatsAppWorkspaceActionsParams) {
  async function subscribePlanAction(planCode: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      setBillingSubscription(await subscribeToPlan(auth.token, planCode));
      await Promise.all([loadCommercial(auth.token, auth.role), loadEngagement(auth.token, auth.role)]);
      setNotice("Plano atualizado com sucesso e limites de WhatsApp atualizados.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao atualizar plano."));
    }
  }

  async function saveWhatsAppConfig() {
    if (!auth || !canManage) {
      return;
    }

    if (!whatsAppDraft.phoneNumberId.trim() || !whatsAppDraft.verifyToken.trim()) {
      setError("Phone Number ID e Verify Token sao obrigatorios.");
      return;
    }

    try {
      setWhatsAppConfig(
        await saveWhatsAppConfigRequest(auth.token, {
          wabaId: whatsAppDraft.wabaId || null,
          phoneNumberId: whatsAppDraft.phoneNumberId,
          verifyToken: whatsAppDraft.verifyToken,
          accessToken: whatsAppDraft.accessToken || null,
          isActive: whatsAppDraft.isActive
        })
      );
      setWhatsAppDraft((current) => ({ ...current, accessToken: "" }));
      await loadEngagement(auth.token, auth.role);
      setNotice("Configuracao do WhatsApp salva.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar configuracao do WhatsApp."));
    }
  }

  async function testWhatsAppConfig() {
    if (!auth || !canManage) {
      return;
    }

    try {
      const data = await testWhatsAppConfigRequest(auth.token);
      setNotice(data.success ? "WhatsApp conectado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao testar conexao com WhatsApp."));
    }
  }

  async function saveCampaign() {
    if (!auth || !canManage) {
      return;
    }

    if (!campaignDraft.name.trim() || !campaignDraft.template.trim() || campaignDraft.delayHours < 1) {
      setError("Preencha nome, template e delay >= 1 hora.");
      return;
    }

    const isEditing = Boolean(campaignDraft.id);

    try {
      await saveCampaignRequest(auth.token, {
        id: campaignDraft.id || undefined,
        name: campaignDraft.name,
        delayHours: campaignDraft.delayHours,
        template: campaignDraft.template,
        isActive: campaignDraft.isActive
      });
      setCampaignDraft(emptyCampaignDraft);
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Campanha atualizada." : "Campanha criada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar campanha."));
    }
  }

  function editCampaign(campaign: CampaignRule) {
    setCampaignDraft({
      id: campaign.id,
      name: campaign.name,
      delayHours: campaign.delayHours,
      template: campaign.template,
      isActive: campaign.isActive
    });
  }

  async function deleteCampaign(ruleId: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      await deleteCampaignRequest(auth.token, ruleId);
      await loadEngagement(auth.token, auth.role);
      setNotice("Campanha excluida.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir campanha."));
    }
  }

  async function saveChannel() {
    if (!auth || !canManage) {
      return;
    }

    if (!channelDraft.displayName.trim() || !channelDraft.phoneNumberId.trim() || !channelDraft.verifyToken.trim()) {
      setError("Preencha nome do canal, Phone Number ID e Verify Token.");
      return;
    }

    const isEditing = Boolean(editingChannelId);

    try {
      await saveChannelRequest(auth.token, {
        id: editingChannelId || undefined,
        displayName: channelDraft.displayName,
        wabaId: channelDraft.wabaId || null,
        phoneNumberId: channelDraft.phoneNumberId,
        verifyToken: channelDraft.verifyToken,
        accessToken: channelDraft.accessToken || null,
        isActive: channelDraft.isActive,
        isPrimary: channelDraft.isPrimary
      });
      setChannelDraft(emptyChannelDraft);
      setEditingChannelId("");
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Canal atualizado." : "Canal adicionado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar canal WhatsApp."));
    }
  }

  function editChannel(channel: WhatsAppChannel) {
    setEditingChannelId(channel.id);
    setChannelDraft({
      displayName: channel.displayName,
      wabaId: channel.wabaId ?? "",
      phoneNumberId: channel.phoneNumberId,
      verifyToken: channel.verifyToken,
      accessToken: "",
      isActive: channel.isActive,
      isPrimary: channel.isPrimary
    });
    setCurrentPage("WHATSAPP");
  }

  function cancelChannelEdit() {
    setEditingChannelId("");
    setChannelDraft(emptyChannelDraft);
  }

  async function deleteChannel(channelId: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      await deleteChannelRequest(auth.token, channelId);
      await loadEngagement(auth.token, auth.role);
      setNotice("Canal removido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir canal WhatsApp."));
    }
  }

  async function testChannel(channelId: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      const data = await testChannelRequest(auth.token, channelId);
      setNotice(data.success ? "Canal testado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao testar canal WhatsApp."));
    }
  }

  return {
    subscribePlan: subscribePlanAction,
    saveWhatsAppConfig,
    testWhatsAppConfig,
    saveCampaign,
    editCampaign,
    deleteCampaign,
    saveChannel,
    editChannel,
    cancelChannelEdit,
    deleteChannel,
    testChannel
  };
}
