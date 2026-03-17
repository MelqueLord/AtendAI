import type { BillingPlan, BillingSubscription, TenantOption, ValueMetrics } from "@shared/types";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtlePanelClass,
  workspacePageClass
} from "@shared/components/WorkspaceUi";

type CommercialWorkspaceProps = {
  billingSubscription: BillingSubscription | null;
  valueMetrics: ValueMetrics | null;
  billingPlans: BillingPlan[];
  subscribePlan: (planCode: string) => void;
  formatCurrency: (value: number, currency: string) => string;
  formatDate: (value: string) => string;
  currentTenantId: string;
  currentTenantName: string;
  canSwitchTenant: boolean;
  tenants: TenantOption[];
  switchTenant: (tenantId: string) => Promise<void>;
  switchingTenant: boolean;
  whatsAppChannelLimit: number;
  whatsAppChannelCount: number;
};

const subscriptionToneByStatus: Record<string, "slate" | "blue" | "emerald" | "amber" | "rose"> = {
  trialing: "blue",
  trial_expired: "rose",
  active: "emerald",
  expired: "amber",
  cancelled: "slate"
};

const subscriptionLabelByStatus: Record<string, string> = {
  trialing: "Trial ativo",
  trial_expired: "Trial expirado",
  active: "Assinatura ativa",
  expired: "Ciclo expirado",
  cancelled: "Cancelado"
};

function formatSubscriptionStatus(status?: string) {
  if (!status) {
    return "Sem assinatura";
  }

  return subscriptionLabelByStatus[status] ?? status;
}

function resolveSubscriptionTone(status?: string) {
  if (!status) {
    return "slate" as const;
  }

  return subscriptionToneByStatus[status] ?? "slate";
}

function renderTrialDetail(subscription: BillingSubscription | null, formatDate: (value: string) => string) {
  if (!subscription?.trialEndsAt) {
    return "Sem periodo de trial em andamento.";
  }

  if (subscription.isTrialExpired) {
    return `O trial encerrou em ${formatDate(subscription.trialEndsAt)}.`;
  }

  if (subscription.trialDaysRemaining === 0) {
    return `O trial encerra hoje em ${formatDate(subscription.trialEndsAt)}.`;
  }

  return `Restam ${subscription.trialDaysRemaining ?? 0} dia(s) ate ${formatDate(subscription.trialEndsAt)}.`;
}

function renderPeriodDetail(subscription: BillingSubscription | null, formatDate: (value: string) => string) {
  if (!subscription?.currentPeriodEnd) {
    return "Nenhum ciclo faturado ativo.";
  }

  if (subscription.currentPeriodDaysRemaining === 0) {
    return `O ciclo atual encerra hoje em ${formatDate(subscription.currentPeriodEnd)}.`;
  }

  return `Restam ${subscription.currentPeriodDaysRemaining ?? 0} dia(s) ate ${formatDate(subscription.currentPeriodEnd)}.`;
}

export function CommercialWorkspace({
  billingSubscription,
  valueMetrics,
  billingPlans,
  subscribePlan,
  formatCurrency,
  formatDate,
  currentTenantId,
  currentTenantName,
  canSwitchTenant,
  tenants,
  switchTenant,
  switchingTenant,
  whatsAppChannelLimit,
  whatsAppChannelCount
}: CommercialWorkspaceProps) {
  const currentPlan = billingPlans.find((plan) => plan.code === billingSubscription?.planCode) ?? null;
  const effectiveWhatsAppLimit = whatsAppChannelLimit || currentPlan?.includedWhatsAppNumbers || 0;
  const remainingWhatsAppSlots = Math.max(0, effectiveWhatsAppLimit - whatsAppChannelCount);
  const exceedsWhatsAppLimit = effectiveWhatsAppLimit > 0 && whatsAppChannelCount > effectiveWhatsAppLimit;
  const includedMessages = currentPlan?.includedMessages ?? 0;
  const consumedMessages = valueMetrics?.messages30d ?? 0;
  const remainingMessages = Math.max(0, includedMessages - consumedMessages);
  const subscriptionStatus = billingSubscription?.effectiveStatus ?? billingSubscription?.status;
  const subscriptionStatusTone = resolveSubscriptionTone(subscriptionStatus);
  const subscriptionStatusLabel = formatSubscriptionStatus(subscriptionStatus);

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Comercial</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Comercial</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">Os planos agora controlam ciclo de trial, capacidade mensal de mensagens e quantidade de numeros de WhatsApp liberados para cada empresa.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone="blue">Empresa ativa: {currentTenantName || "Empresa"}</StatusPill>
              {canSwitchTenant && <StatusPill tone="slate">SuperAdmin</StatusPill>}
              <StatusPill tone={subscriptionStatusTone}>{subscriptionStatusLabel}</StatusPill>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="Plano atual" value={billingSubscription?.planName ?? "-"} detail="Plano associado ao tenant ativo" tone="blue" />
            <MetricTile label="Mensagens 30d" value={`${consumedMessages}/${includedMessages || 0}`} detail="Uso recente comparado a capacidade contratada" tone={includedMessages > 0 && consumedMessages > includedMessages ? "amber" : "emerald"} />
            <MetricTile label="WhatsApps" value={`${whatsAppChannelCount}/${effectiveWhatsAppLimit || 0}`} detail="Numeros cadastrados versus limite do plano" tone={exceedsWhatsAppLimit ? "amber" : "slate"} />
            <MetricTile label="Receita protegida" value={formatCurrency(valueMetrics?.estimatedRevenueProtected ?? 0, currentPlan?.currency ?? "BRL")} detail="Estimativa de valor preservado pela automacao" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <WorkspaceSection
            eyebrow="Assinatura"
            title="Resumo da conta"
            actions={billingSubscription ? <StatusPill tone={subscriptionStatusTone}>{subscriptionStatusLabel}</StatusPill> : undefined}
          >
            <div className="grid gap-4 lg:grid-cols-12">
              <div className={`${subtlePanelClass} space-y-4 lg:col-span-7`}>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Empresa vinculada</p>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950">{currentTenantName || "Empresa sem contexto"}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {billingSubscription
                      ? `Ultima atualizacao em ${formatDate(billingSubscription.updatedAt)}. O status efetivo da conta considera trial e vencimento do ciclo.`
                      : "Defina um plano para liberar recursos, trial e limites operacionais."}
                  </p>
                </div>

                {canSwitchTenant && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Associar plano a empresa</span>
                    <select
                      className={inputClass}
                      value={currentTenantId}
                      onChange={(event) => { void switchTenant(event.target.value); }}
                      disabled={switchingTenant}
                    >
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.segment})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="grid gap-3 lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Periodo de trial</p>
                  <strong className="mt-2 block text-lg font-semibold text-slate-950">{billingSubscription?.trialEndsAt ? formatDate(billingSubscription.trialEndsAt) : "-"}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{renderTrialDetail(billingSubscription, formatDate)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ciclo vigente</p>
                  <strong className="mt-2 block text-lg font-semibold text-slate-950">{billingSubscription?.currentPeriodEnd ? formatDate(billingSubscription.currentPeriodEnd) : "-"}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{renderPeriodDetail(billingSubscription, formatDate)}</p>
                </div>
              </div>
            </div>
          </WorkspaceSection>
        </div>

        <div className="xl:col-span-5">
          <WorkspaceSection eyebrow="Capacidade" title="Limites operacionais do plano">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricTile label="Mensagens contratadas" value={String(includedMessages)} detail="Capacidade mensal prevista no plano vigente." tone="blue" />
              <MetricTile label="Mensagens restantes" value={String(remainingMessages)} detail="Espaco livre antes de atingir o limite mensal observado." tone={remainingMessages > 0 ? "emerald" : "amber"} />
              <MetricTile label="WhatsApps liberados" value={String(effectiveWhatsAppLimit)} detail="Quantidade maxima de numeros que a empresa pode cadastrar." tone="blue" />
              <MetricTile label="Vagas restantes" value={String(remainingWhatsAppSlots)} detail="Novos numeros permitidos antes de atingir o limite." tone={remainingWhatsAppSlots > 0 ? "emerald" : "amber"} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm leading-6 text-slate-600 shadow-sm shadow-slate-200/60">
                {billingSubscription?.effectiveStatus === "trial_expired"
                  ? "O trial expirou. Se a operacao continuar ativa, o ideal e migrar a empresa para um plano pago para manter os limites e recursos liberados."
                  : exceedsWhatsAppLimit
                    ? `A empresa esta com ${whatsAppChannelCount} numero(s) cadastrados para um limite atual de ${effectiveWhatsAppLimit}. Nenhum novo numero podera ser criado ate reduzir o total ou subir o plano.`
                    : `O plano atual libera ${includedMessages} mensagem(ns) de capacidade mensal e ate ${effectiveWhatsAppLimit} numero(s) de WhatsApp para esta empresa.`}
              </div>
            </div>
          </WorkspaceSection>
        </div>
      </section>

      <WorkspaceSection eyebrow="Planos" title="Portfolio comercial">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {billingPlans.map((plan) => {
            const isCurrent = billingSubscription?.planCode === plan.code;
            const toneClass = isCurrent
              ? "border-blue-300 bg-blue-50/60 shadow-blue-100"
              : plan.isPopular
                ? "border-emerald-200 bg-emerald-50/50 shadow-emerald-100"
                : "border-slate-200 bg-white shadow-slate-200/60";

            return (
              <article key={plan.code} className={`relative flex h-full flex-col rounded-[28px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
                      {isCurrent && <StatusPill tone="blue">Plano atual</StatusPill>}
                      {!isCurrent && plan.isPopular && <StatusPill tone="emerald">Popular</StatusPill>}
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {canSwitchTenant ? `Aplicar este plano para ${currentTenantName}.` : "Plano aplicado a empresa logada."}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <strong className="text-4xl font-semibold tracking-tight text-slate-950">{formatCurrency(plan.monthlyPrice, plan.currency)}</strong>
                    <span className="ml-2 text-sm text-slate-500">/mes</span>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mensagens</p>
                      <strong className="mt-2 block text-lg font-semibold text-slate-950">{plan.includedMessages}</strong>
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
                </div>

                <div className="mt-6 flex flex-1 items-end">
                  <button type="button" className={isCurrent ? secondaryButtonClass : primaryButtonClass} onClick={() => subscribePlan(plan.code)} disabled={switchingTenant}>
                    {isCurrent ? "Plano atual" : canSwitchTenant ? "Aplicar a empresa" : "Assinar plano"}
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
