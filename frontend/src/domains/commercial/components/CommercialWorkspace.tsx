import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtlePanelClass,
  tableShellClass,
  workspacePageClass
} from "../../../shared/ui/WorkspaceUi";

type BillingPlan = {
  code: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  includedConversations: number;
  includedAgents: number;
  includedWhatsAppNumbers: number;
  isPopular: boolean;
};

type BillingSubscription = {
  tenantId: string;
  planCode: string;
  planName: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string;
};

type ValueMetrics = {
  conversations30d: number;
  humanHandoffs30d: number;
  automationRate: number;
  estimatedHoursSaved: number;
  estimatedRevenueProtected: number;
};

type CommercialWorkspaceProps = {
  billingSubscription: BillingSubscription | null;
  valueMetrics: ValueMetrics | null;
  billingPlans: BillingPlan[];
  subscribePlan: (planCode: string) => void;
  formatCurrency: (value: number, currency: string) => string;
  formatDate: (value: string) => string;
};

export function CommercialWorkspace({
  billingSubscription,
  valueMetrics,
  billingPlans,
  subscribePlan,
  formatCurrency,
  formatDate
}: CommercialWorkspaceProps) {
  const currentPlan = billingPlans.find((plan) => plan.code === billingSubscription?.planCode) ?? null;

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Comercial</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Monetizacao com leitura de produto SaaS atual</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">Reestruturei a pagina para sair do aspecto de lista simples. Agora o plano atual, o valor entregue e a grade de planos ficam mais sofisticados, objetivos e alinhados com SaaS enterprise.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Plano atual" value={billingSubscription?.planName ?? "-"} detail={billingSubscription?.status ?? "Sem assinatura"} tone="blue" />
            <MetricTile label="Conversas 30d" value={String(valueMetrics?.conversations30d ?? 0)} detail="Volume recente da operacao" tone="emerald" />
            <MetricTile label="Automacao" value={`${valueMetrics?.automationRate ?? 0}%`} detail="Atendimentos resolvidos sem humano" tone="slate" />
            <MetricTile label="Receita protegida" value={formatCurrency(valueMetrics?.estimatedRevenueProtected ?? 0, currentPlan?.currency ?? "BRL")} detail="Estimativa de valor preservado pela automacao" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <WorkspaceSection
          eyebrow="Assinatura"
          title="Resumo da conta"
          description="O plano ativo e os marcos do ciclo atual agora ficam destacados em um card mais executivo e menos operacional."
          actions={billingSubscription ? <StatusPill tone="blue">{billingSubscription.status}</StatusPill> : undefined}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className={subtlePanelClass}>
              <p className="text-sm font-semibold text-slate-900">Plano contratado</p>
              <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950">{billingSubscription?.planName ?? "Sem plano"}</strong>
              <p className="mt-2 text-sm leading-6 text-slate-500">{billingSubscription ? `Ultima atualizacao em ${formatDate(billingSubscription.updatedAt)}.` : "Defina um plano para liberar recursos e limites operacionais."}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fim do periodo</p>
                <strong className="mt-2 block text-lg font-semibold text-slate-950">{billingSubscription?.currentPeriodEnd ? formatDate(billingSubscription.currentPeriodEnd) : "-"}</strong>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fim do trial</p>
                <strong className="mt-2 block text-lg font-semibold text-slate-950">{billingSubscription?.trialEndsAt ? formatDate(billingSubscription.trialEndsAt) : "-"}</strong>
              </div>
            </div>
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Valor entregue"
          title="Indicadores de eficiencia"
          description="Uma leitura mais comercial dos beneficios gerados pelo produto no tenant atual."
        >
          <div className="grid gap-3">
            <MetricTile label="Horas economizadas" value={`${valueMetrics?.estimatedHoursSaved ?? 0}h`} detail="Tempo operacional preservado no periodo." tone="emerald" />
            <MetricTile label="Handoffs" value={String(valueMetrics?.humanHandoffs30d ?? 0)} detail="Conversas que exigiram atendimento humano." tone="amber" />
            <MetricTile label="Receita protegida" value={formatCurrency(valueMetrics?.estimatedRevenueProtected ?? 0, currentPlan?.currency ?? "BRL")} detail="Estimativa financeira baseada na automacao e recuperacao." tone="blue" />
          </div>
        </WorkspaceSection>
      </section>

      <WorkspaceSection
        eyebrow="Planos"
        title="Portfolio comercial"
        description="Transformei a listagem em cards de assinatura mais elegantes, com hierarquia de preco, capacidade e CTA bem definidos."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {billingPlans.map((plan) => {
            const isCurrent = billingSubscription?.planCode === plan.code;
            const toneClass = isCurrent
              ? "border-blue-300 bg-blue-50/60 shadow-blue-100"
              : plan.isPopular
                ? "border-emerald-200 bg-emerald-50/50 shadow-emerald-100"
                : "border-slate-200 bg-white shadow-slate-200/60";

            return (
              <article key={plan.code} className={`relative flex h-full flex-col rounded-[28px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
                      {isCurrent && <StatusPill tone="blue">Plano atual</StatusPill>}
                      {!isCurrent && plan.isPopular && <StatusPill tone="emerald">Popular</StatusPill>}
                    </div>
                    <p className="text-sm text-slate-500">Feito para empresas que querem automacao, escala e controle operacional.</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <strong className="text-4xl font-semibold tracking-tight text-slate-950">{formatCurrency(plan.monthlyPrice, plan.currency)}</strong>
                  <span className="ml-2 text-sm text-slate-500">/mes</span>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Conversas</p>
                    <strong className="mt-2 block text-lg font-semibold text-slate-950">{plan.includedConversations}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Agentes</p>
                      <strong className="mt-2 block text-lg font-semibold text-slate-950">{plan.includedAgents}</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">WhatsApps</p>
                      <strong className="mt-2 block text-lg font-semibold text-slate-950">{plan.includedWhatsAppNumbers}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 items-end">
                  <button type="button" className={isCurrent ? secondaryButtonClass : primaryButtonClass} onClick={() => subscribePlan(plan.code)}>
                    {isCurrent ? "Plano atual" : "Assinar plano"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {billingPlans.length === 0 && <EmptyStatePanel>Nenhum plano disponivel no momento.</EmptyStatePanel>}
      </WorkspaceSection>
    </section>
  );
}



