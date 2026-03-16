import type { MetaBootstrapDraft } from "../services/metaSetupService";
import type { MetaChannelStatus } from "../services/whatsappLaunchService";
import type { MetaWhatsAppSetup } from "@shared/types";
import {
  EmptyStatePanel,
  StatusPill,
  WorkspaceSection,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass
} from "@shared/components/WorkspaceUi";
import { ReadonlyCopyField, SwitchField } from "./WhatsAppWorkspacePrimitives";

type MetaChannelSetupSectionProps = {
  setupLoading: boolean;
  setupFeedback: string;
  metaReady: boolean;
  hasPreparedChannel: boolean;
  remainingChannels: number;
  showSetupForm: boolean;
  setupTesting: boolean;
  setupSaving: boolean;
  setup: MetaWhatsAppSetup | null;
  setupDraft: MetaBootstrapDraft;
  statusTone: "slate" | "blue" | "emerald" | "amber" | "rose";
  statusLabel: string;
  metaDetail: string;
  limitReached: boolean;
  whatsAppChannelLimit: number;
  whatsAppChannels: MetaChannelStatus[];
  onToggleForm: () => void;
  onSetSetupDraft: (updater: (current: MetaBootstrapDraft) => MetaBootstrapDraft) => void;
  onBootstrapMeta: () => void;
  onCloseForm: () => void;
  onTestMetaConnection: () => void;
  onCopy: (value: string, label: string) => Promise<void>;
};

export function MetaChannelSetupSection({
  setupLoading,
  setupFeedback,
  metaReady,
  hasPreparedChannel,
  remainingChannels,
  showSetupForm,
  setupTesting,
  setupSaving,
  setup,
  setupDraft,
  statusTone,
  statusLabel,
  metaDetail,
  limitReached,
  whatsAppChannelLimit,
  whatsAppChannels,
  onToggleForm,
  onSetSetupDraft,
  onBootstrapMeta,
  onCloseForm,
  onTestMetaConnection,
  onCopy
}: MetaChannelSetupSectionProps) {
  return (
    <WorkspaceSection
      eyebrow="Assistente de conexao"
      title={hasPreparedChannel ? "Gerencie os canais da empresa" : "Prepare o primeiro numero"}
      actions={
        hasPreparedChannel ? (
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={remainingChannels > 0 ? "blue" : "amber"}>{remainingChannels} vaga(s) restante(s)</StatusPill>
            <button type="button" className={secondaryButtonClass} onClick={onToggleForm}>
              {showSetupForm ? "Fechar edicao" : "Atualizar credencial"}
            </button>
            <button type="button" className={primaryButtonClass} onClick={onTestMetaConnection} disabled={setupTesting}>
              {setupTesting ? "Testando..." : "Testar conexao"}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {setupLoading ? (
          <EmptyStatePanel>Carregando canais.</EmptyStatePanel>
        ) : (
          <>
            {setupFeedback && (
              <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${metaReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                {setupFeedback}
              </div>
            )}

            {(showSetupForm || !hasPreparedChannel) && (
              <div className="grid gap-4 xl:grid-cols-2">
                <label className={labelClass}>
                  Nome do canal
                  <input
                    className={inputClass}
                    value={setupDraft.displayName}
                    onChange={(event) => onSetSetupDraft((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </label>
                <label className={labelClass}>
                  ID do numero na Meta
                  <input
                    className={inputClass}
                    value={setupDraft.phoneNumberId}
                    onChange={(event) => onSetSetupDraft((current) => ({ ...current, phoneNumberId: event.target.value }))}
                  />
                </label>
                <label className={`${labelClass} lg:col-span-2`}>
                  Token de acesso
                  <textarea
                    className={textareaClass}
                    value={setupDraft.accessToken}
                    onChange={(event) => onSetSetupDraft((current) => ({ ...current, accessToken: event.target.value }))}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2 lg:col-span-2">
                  <SwitchField
                    id="setup-primary"
                    label="Definir como principal"
                    caption="Use este numero como rota padrao da operacao."
                    checked={setupDraft.isPrimary}
                    onChange={(checked) => onSetSetupDraft((current) => ({ ...current, isPrimary: checked }))}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                    {limitReached ? `Seu plano ja atingiu o limite de ${whatsAppChannelLimit} canal(is).` : `Voce ainda pode adicionar ${remainingChannels} canal(is) para esta empresa.`}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={onBootstrapMeta}
                      disabled={setupSaving || (limitReached && !whatsAppChannels.some((channel) => channel.phoneNumberId === setupDraft.phoneNumberId.trim()))}
                    >
                      {setupSaving ? "Preparando..." : hasPreparedChannel ? "Salvar e adicionar canal" : "Preparar conexao"}
                    </button>
                    {hasPreparedChannel && (
                      <button type="button" className={secondaryButtonClass} onClick={onCloseForm}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {hasPreparedChannel && setup && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold text-slate-950">{setup.displayName || "WhatsApp"}</h4>
                        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{setup.phoneNumberId ? `Numero preparado: ${setup.phoneNumberId}` : "Defina o numero da empresa para continuar."}</p>
                      <p className="text-sm leading-6 text-slate-500">{metaDetail}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      {setup.lastError ? `Ultimo alerta: ${setup.lastError}` : setup.lastStatus ? `Ultimo status: ${setup.lastStatus}` : "Ainda nao houve teste final desta conexao."}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ReadonlyCopyField
                    label="URL de retorno"
                    value={setup.callbackUrl}
                    buttonLabel="Copiar URL"
                    onCopy={() => void onCopy(setup.callbackUrl, "URL de retorno")}
                  />
                  <ReadonlyCopyField
                    label="Codigo de validacao"
                    value={setup.verifyToken}
                    buttonLabel="Copiar codigo"
                    onCopy={() => void onCopy(setup.verifyToken, "Codigo de validacao")}
                  />
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-slate-950">Proxima etapa</h4>
                    <ol className="space-y-3 text-sm leading-6 text-slate-700">
                      <li>1. No painel da Meta, abra o produto WhatsApp e va para a configuracao do webhook.</li>
                      <li>2. Cole a URL de retorno e o codigo de validacao que o sistema gerou para voce.</li>
                      <li>3. Marque o evento <strong>messages</strong> para permitir que as mensagens cheguem ao CRM.</li>
                      <li>4. Volte aqui e clique em <strong>Testar conexao</strong>. Quando der certo, o time atende direto em <strong>Atendimento</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </WorkspaceSection>
  );
}
