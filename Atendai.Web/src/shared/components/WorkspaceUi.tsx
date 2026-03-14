import type { ReactNode } from "react";

type WorkspaceSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type MetricTileProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
};

type StatusPillProps = {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
};

export const workspacePageClass = "mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 pb-10 sm:px-6 xl:px-0";
export const heroPanelClass = "relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,0.98))] p-5 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.4)] sm:p-6 lg:p-7";
export const cardClass = "rounded-[28px] border border-slate-200/90 bg-white shadow-[0_24px_64px_-44px_rgba(15,23,42,0.34)]";
export const subtlePanelClass = "rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";
export const tableShellClass = "overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_20px_56px_-42px_rgba(15,23,42,0.32)]";
export const filterBarClass = "grid grid-cols-1 gap-4 rounded-[24px] border border-slate-200/90 bg-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] xl:p-5";
export const tableHeaderCellClass = "px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";
export const tableBodyCellClass = "px-5 py-4 align-top text-sm text-slate-600";
export const labelClass = "flex flex-col gap-2.5 text-sm font-medium text-slate-700";
export const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";
export const textareaClass = "min-h-[132px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";
export const primaryButtonClass = "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass = "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
export const dangerButtonClass = "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60";

const metricToneMap: Record<NonNullable<MetricTileProps["tone"]>, string> = {
  slate: "border-slate-200 bg-white text-slate-700",
  blue: "border-blue-200 bg-blue-50/75 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50/75 text-emerald-800",
  amber: "border-amber-200 bg-amber-50/75 text-amber-800",
  rose: "border-rose-200 bg-rose-50/75 text-rose-800"
};

const pillToneMap: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200"
};

export function WorkspaceSection({ eyebrow, title, description, actions, children }: WorkspaceSectionProps) {
  return (
    <section className={`${cardClass} overflow-hidden p-5 sm:p-6 lg:p-7`}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            {eyebrow && <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</span>}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-[1.05rem]">{title}</h3>
              {description && <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function MetricTile({ label, value, detail, tone = "slate" }: MetricTileProps) {
  return (
    <article className={`relative overflow-hidden rounded-[24px] border p-5 shadow-sm shadow-slate-200/60 ${metricToneMap[tone]}`}>
      <span className="absolute inset-x-0 top-0 h-px bg-white/70" aria-hidden="true" />
      <div className="relative flex min-h-[128px] flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <strong className="block text-[1.9rem] font-semibold tracking-tight text-slate-950">{value}</strong>
        <p className="mt-auto text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </article>
  );
}

export function StatusPill({ children, tone = "slate" }: StatusPillProps) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pillToneMap[tone]}`}>{children}</span>;
}

export function EmptyStatePanel({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 px-5 py-6 text-sm leading-6 text-slate-500">{children}</p>;
}
