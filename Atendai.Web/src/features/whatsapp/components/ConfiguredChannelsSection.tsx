import { EmptyStatePanel, StatusPill, WorkspaceSection, cardClass, secondaryButtonClass } from "@shared/components/WorkspaceUi";
import { ReadonlyCopyField } from "./WhatsAppWorkspacePrimitives";
import type { MetaChannelStatus } from "../services/whatsappLaunchService";

type ConfiguredChannelsSectionProps = {
  channels: MetaChannelStatus[];
  setupCallbackUrl?: string;
  busyChannelId: string;
  onCopy: (value: string, label: string) => Promise<void>;
  onTestChannel: (channelId: string) => Promise<void>;
  onSetPrimary: (channel: MetaChannelStatus) => Promise<void>;
  onToggleChannelState: (channel: MetaChannelStatus) => Promise<void>;
  onDeleteChannel: (channel: MetaChannelStatus) => Promise<void>;
  formatDate: (value: string) => string;
};

function resolveChannelTone(channel: MetaChannelStatus): "slate" | "blue" | "emerald" | "amber" | "rose" {
  if (channel.lastError) {
    return "rose";
  }

  if (channel.lastStatus?.toLowerCase() === "connected") {
    return "emerald";
  }

  if (channel.isActive) {
    return "amber";
  }

  return "slate";
}

function resolveChannelLabel(channel: MetaChannelStatus): string {
  if (channel.lastError) {
    return "Com alerta";
  }

  if (channel.lastStatus?.toLowerCase() === "connected") {
    return "Conectado";
  }

  return channel.isActive ? "Em preparo" : "Inativo";
}

export function ConfiguredChannelsSection({
  channels,
  setupCallbackUrl,
  busyChannelId,
  onCopy,
  onTestChannel,
  onSetPrimary,
  onToggleChannelState,
  onDeleteChannel,
  formatDate
}: ConfiguredChannelsSectionProps) {
  return (
    <div className="relative z-0 pt-2">
      <WorkspaceSection
        eyebrow="Canais configurados"
        title="Numeros da empresa"
        actions={<StatusPill tone="slate">{channels.length} canal(is)</StatusPill>}
      >
        {channels.length === 0 ? (
          <EmptyStatePanel>Nenhum canal cadastrado.</EmptyStatePanel>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {channels.map((channel) => (
              <article key={channel.id} className={`${cardClass} flex h-full flex-col p-5`}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">{channel.displayName}</h3>
                        <StatusPill tone={resolveChannelTone(channel)}>{resolveChannelLabel(channel)}</StatusPill>
                        {channel.isPrimary && <StatusPill tone="blue">Principal</StatusPill>}
                      </div>
                      <p className="text-sm text-slate-500">Numero preparado: {channel.phoneNumberId}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{channel.lastTestedAt ? formatDate(channel.lastTestedAt) : "Sem teste"}</p>
                      <p>Ultima verificacao</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ReadonlyCopyField
                      label="URL de retorno"
                      value={setupCallbackUrl ?? "/api/whatsapp/webhook"}
                      buttonLabel="Copiar URL"
                      onCopy={() => void onCopy(setupCallbackUrl ?? "/api/whatsapp/webhook", `URL do canal ${channel.displayName}`)}
                    />
                    <ReadonlyCopyField
                      label="Codigo de validacao"
                      value={channel.verifyToken}
                      buttonLabel="Copiar codigo"
                      onCopy={() => void onCopy(channel.verifyToken, `Codigo do canal ${channel.displayName}`)}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                    {channel.lastError ? channel.lastError : channel.lastStatus ? `Status atual: ${channel.lastStatus}` : "Depois de confirmar esse canal na Meta, rode o teste para liberar o uso dentro do CRM."}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  <button type="button" className={secondaryButtonClass} onClick={() => void onTestChannel(channel.id)} disabled={busyChannelId === channel.id}>
                    {busyChannelId === channel.id ? "Testando..." : "Testar conexao"}
                  </button>
                  {!channel.isPrimary && (
                    <button type="button" className={secondaryButtonClass} onClick={() => void onSetPrimary(channel)} disabled={busyChannelId === channel.id}>
                      Tornar principal
                    </button>
                  )}
                  <button type="button" className={secondaryButtonClass} onClick={() => void onToggleChannelState(channel)} disabled={busyChannelId === channel.id}>
                    {channel.isActive ? "Pausar canal" : "Ativar canal"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                    onClick={() => void onDeleteChannel(channel)}
                    disabled={busyChannelId === channel.id}
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </WorkspaceSection>
    </div>
  );
}
