import { useMemo, type PropsWithChildren } from "react";
import { pageMeta } from "@shared/constants/workspace";
import { formatSeconds } from "@shared/utils/formatting";
import type { AnalyticsOverview, AppPage, AuthResponse, TenantOption } from "@shared/types";

type AppShellProps = PropsWithChildren<{
  auth: AuthResponse;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  canManage: boolean;
  canManageCompanies: boolean;
  workspaceName: string;
  workspacePlanName: string;
  analytics: AnalyticsOverview | null;
  tenants: TenantOption[];
  switchingTenant: boolean;
  onSwitchTenant: (tenantId: string) => void;
  onRefreshAll: () => void;
  onLogout: () => void;
  notice: string;
  error: string;
}>;

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "success" | "alert";
};

type SidebarNavButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

export function AppShell({
  auth,
  currentPage,
  onNavigate,
  canManage,
  canManageCompanies,
  workspaceName,
  workspacePlanName,
  analytics,
  tenants,
  switchingTenant,
  onSwitchTenant,
  onRefreshAll,
  onLogout,
  notice,
  error,
  children
}: AppShellProps) {
  const tenantOptions = useMemo(() => {
    if (auth.role !== "SuperAdmin") {
      return tenants;
    }

    const hasActiveTenant = tenants.some((tenant) => tenant.id === auth.tenantId);
    if (hasActiveTenant) {
      return tenants;
    }

    return [
      {
        id: auth.tenantId,
        name: auth.tenantName,
        segment: "Tenant ativo"
      },
      ...tenants
    ];
  }, [auth.role, auth.tenantId, auth.tenantName, tenants]);

  return (
    <main className="appRoot min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_42%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[296px_minmax(0,1fr)]">
          <aside className="sticky top-4 flex flex-col gap-5 rounded-[32px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_30px_80px_-58px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-5 text-white shadow-sm shadow-slate-900/20">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                  Atend.AI
                </span>
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold tracking-tight text-white">{workspaceName}</p>
                  <p className="text-sm leading-6 text-slate-300">{workspacePlanName}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold uppercase text-white shadow-sm shadow-slate-300/50">
                  {auth.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{auth.name}</p>
                  <p className="truncate text-xs text-slate-500">{auth.role} - {auth.tenantName}</p>
                </div>
              </div>
            </div>

            <div className="sidebarGroup">
              <span className="sidebarGroupLabel">Operacao</span>
              <SidebarNavButton active={currentPage === "ATTENDANCE"} label="Atendimento" onClick={() => onNavigate("ATTENDANCE")} />
              {canManage && <SidebarNavButton active={currentPage === "AI"} label="Configuracao da IA" onClick={() => onNavigate("AI")} />}
            </div>
            {canManage && (
              <>
                <div className="sidebarGroup">
                  <span className="sidebarGroupLabel">Relacionamento</span>
                  <SidebarNavButton active={currentPage === "CRM"} label="CRM" onClick={() => onNavigate("CRM")} />
                  <SidebarNavButton active={currentPage === "WHATSAPP"} label="WhatsApp" onClick={() => onNavigate("WHATSAPP")} />
                  <SidebarNavButton active={currentPage === "COMMERCIAL"} label="Comercial" onClick={() => onNavigate("COMMERCIAL")} />
                </div>
                <div className="sidebarGroup">
                  <span className="sidebarGroupLabel">Administracao</span>
                  <SidebarNavButton active={currentPage === "USERS"} label="Usuarios" onClick={() => onNavigate("USERS")} />
                  {canManageCompanies && <SidebarNavButton active={currentPage === "COMPANIES"} label="Empresas" onClick={() => onNavigate("COMPANIES")} />}
                </div>
              </>
            )}
          </aside>

          <section className="min-w-0 space-y-6">
            <header className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white/95 px-5 py-5 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.4)] backdrop-blur sm:px-6 lg:px-7">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-blue-100/70 via-blue-50/35 to-transparent" aria-hidden="true" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Workspace ativo
                  </span>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">{pageMeta[currentPage].title}</h1>
                    {pageMeta[currentPage].description && <p className="max-w-3xl text-sm leading-6 text-slate-600">{pageMeta[currentPage].description}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
                  {auth.role === "SuperAdmin" && (
                    <label className="flex min-h-12 min-w-[290px] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm shadow-slate-200/60">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant ativo</span>
                      <select
                        className="mt-1 h-7 border-0 bg-transparent px-0 text-sm font-medium text-slate-700 outline-none focus:ring-0"
                        value={auth.tenantId}
                        onChange={(event) => onSwitchTenant(event.target.value)}
                        disabled={switchingTenant}
                      >
                        {tenantOptions.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.segment})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                      onClick={onRefreshAll}
                    >
                      Atualizar tudo
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                      onClick={onLogout}
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard label="SLA <= 5 min" value={`${analytics?.slaWithinFiveMinutesRate ?? 0}%`} detail="Primeira resposta no prazo" tone="success" />
              <MetricCard label="FCR" value={`${analytics?.firstContactResolutionRate ?? 0}%`} detail="Resolvidas sem humano" tone="neutral" />
              <MetricCard label="Tempo 1a resposta" value={formatSeconds(analytics?.averageFirstResponseSeconds ?? 0)} detail="Media de atendimento" tone="alert" />
              <MetricCard label="Conversao" value={`${analytics?.schedulingConversionRate ?? 0}%`} detail="Intencao de agendamento" tone="success" />
            </section>

            {children}
          </section>
        </section>
      </div>
      {notice && <div className="noticeBanner">{notice}</div>}
      {error && <div className="errorBanner floating">{error}</div>}
    </main>
  );
}

function MetricCard({ label, value, detail, tone }: MetricCardProps) {
  const toneMap = {
    neutral: "border-slate-200 bg-white text-slate-700 shadow-slate-200/70",
    success: "border-emerald-200 bg-emerald-50/75 text-emerald-800 shadow-emerald-100",
    alert: "border-amber-200 bg-amber-50/75 text-amber-800 shadow-amber-100"
  } satisfies Record<MetricCardProps["tone"], string>;

  return (
    <article className={`relative overflow-hidden rounded-[24px] border p-5 shadow-sm ${toneMap[tone]}`}>
      <span className="absolute inset-x-0 top-0 h-px bg-white/70" aria-hidden="true" />
      <div className="relative flex min-h-[132px] flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <strong className="text-[2rem] font-semibold leading-none tracking-tight text-slate-950">{value}</strong>
        <small className="mt-auto text-sm leading-5 text-slate-500">{detail}</small>
      </div>
    </article>
  );
}

function SidebarNavButton({ active, label, onClick }: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      className={`group flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-4 ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200 focus-visible:ring-blue-100"
          : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white focus-visible:ring-slate-100"
      }`}
      onClick={onClick}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold uppercase transition ${
        active ? "bg-white/15 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:bg-slate-100"
      }`}>
        {label.slice(0, 1)}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
