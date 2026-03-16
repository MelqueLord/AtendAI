import {
  StatusPill,
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass
} from "@shared/components/WorkspaceUi";

export type WebLaunchState = "idle" | "embedding" | "embedded" | "popup" | "tab" | "error";

type ChannelOptionCardProps = {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "slate" | "blue" | "emerald" | "amber" | "rose";
  helper: string;
  ctaLabel: string;
  onAction: () => void;
  footnote?: string;
  message?: string;
};

type ReadonlyCopyFieldProps = {
  label: string;
  value: string;
  buttonLabel: string;
  onCopy: () => void;
};

type SwitchFieldProps = {
  id: string;
  label: string;
  caption: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type WebViewerStatePanelProps = {
  state: WebLaunchState;
  message: string;
  onOpenPopup: () => void;
  onOpenTab: () => void;
  onRetryEmbed: () => void;
};

export function ChannelOptionCard({
  title,
  description,
  statusLabel,
  statusTone,
  helper,
  ctaLabel,
  onAction,
  footnote,
  message
}: ChannelOptionCardProps) {
  return (
    <article className={`${cardClass} flex h-full flex-col p-6`}>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">WA</span>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </div>
            <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium leading-6 text-slate-700">{helper}</p>
            {footnote && <p className="mt-2 text-sm leading-6 text-slate-500">{footnote}</p>}
          </div>

          {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">{message}</div>}
        </div>

        <div className="flex justify-start pt-1">
          <button type="button" className={primaryButtonClass} onClick={onAction}>{ctaLabel}</button>
        </div>
      </div>
    </article>
  );
}

export function ReadonlyCopyField({ label, value, buttonLabel, onCopy }: ReadonlyCopyFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="min-w-0 flex-1 space-y-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <input className={inputClass} readOnly value={value} />
        </label>
        <button type="button" className={`${secondaryButtonClass} shrink-0`} onClick={onCopy}>{buttonLabel}</button>
      </div>
    </div>
  );
}

export function SwitchField({ id, label, caption, checked, onChange }: SwitchFieldProps) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <span className="space-y-1">
        <strong className="block text-sm font-semibold text-slate-900">{label}</strong>
        <small className="block text-xs leading-5 text-slate-500">{caption}</small>
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full border border-slate-300 bg-slate-200 transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function WebViewerStatePanel({
  state,
  message,
  onOpenPopup,
  onOpenTab,
  onRetryEmbed
}: WebViewerStatePanelProps) {
  const toneMap: Record<WebLaunchState, string> = {
    idle: "border-slate-200 bg-white text-slate-700",
    embedding: "border-blue-200 bg-blue-50/70 text-blue-800",
    embedded: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
    popup: "border-blue-200 bg-blue-50/70 text-blue-800",
    tab: "border-amber-200 bg-amber-50/70 text-amber-800",
    error: "border-rose-200 bg-rose-50/70 text-rose-800"
  };

  const titleMap: Record<WebLaunchState, string> = {
    idle: "WhatsApp Web pronto para abrir",
    embedding: "Tentando abrir dentro do painel",
    embedded: "WhatsApp Web carregado no painel",
    popup: "WhatsApp Web aberto em janela auxiliar",
    tab: "WhatsApp Web aberto em nova aba",
    error: "Nao foi possivel abrir o WhatsApp Web"
  };

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${toneMap[state]}`}>
      <div className="space-y-3">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Status de abertura</span>
          <h4 className="text-lg font-semibold text-slate-950">{titleMap[state]}</h4>
          <p className="text-sm leading-6 text-slate-600">{message}</p>
        </div>

        {(state === "popup" || state === "tab" || state === "error") && (
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm leading-6 text-slate-600">
            O WhatsApp Web costuma bloquear iframe em navegadores comuns por politica do proprio produto. Quando isso acontece, a melhor experiencia possivel e abrir uma janela auxiliar ou uma nova aba sem perder o contexto do CRM.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {(state === "popup" || state === "tab" || state === "error") && (
            <button type="button" className={primaryButtonClass} onClick={onOpenPopup}>Abrir janela auxiliar</button>
          )}
          {(state === "popup" || state === "tab" || state === "error") && (
            <button type="button" className={secondaryButtonClass} onClick={onOpenTab}>Abrir em nova aba</button>
          )}
          {(state === "popup" || state === "tab") && (
            <button type="button" className={secondaryButtonClass} onClick={onRetryEmbed}>Tentar painel novamente</button>
          )}
        </div>
      </div>
    </div>
  );
}
