import { primaryButtonClass, secondaryButtonClass } from "@shared/components/WorkspaceUi";

type PricingLandingProps = {
  onLoginClick: () => void;
};

type PricingPlan = {
  code: "START" | "GROWTH" | "PRO" | "SCALE";
  name: string;
  monthlyPrice: string;
  numbers: string;
  messages: string;
  recommended?: boolean;
  badge?: string;
  cta: string;
};

const pricingPlans: PricingPlan[] = [
  {
    code: "START",
    name: "Start",
    monthlyPrice: "79,90",
    numbers: "1 numero conectado",
    messages: "1.000 mensagens por mes",
    cta: "Comecar agora"
  },
  {
    code: "GROWTH",
    name: "Growth",
    monthlyPrice: "159,90",
    numbers: "2 numeros conectados",
    messages: "3.000 mensagens por mes",
    recommended: true,
    badge: "Mais escolhido",
    cta: "Comecar agora"
  },
  {
    code: "PRO",
    name: "Pro",
    monthlyPrice: "329,90",
    numbers: "4 numeros conectados",
    messages: "8.000 mensagens por mes",
    cta: "Comecar agora"
  },
  {
    code: "SCALE",
    name: "Scale",
    monthlyPrice: "699,90",
    numbers: "10 numeros conectados",
    messages: "15.000 mensagens por mes",
    cta: "Falar com especialista"
  }
];

const includedFeatures = [
  "CRM completo",
  "Automacoes",
  "Atendimento com IA",
  "WhatsApp oficial",
  "Painel gerencial",
  "Relatorios e acompanhamento"
];

const faqItems = [
  {
    question: "Todos os planos tem os mesmos recursos?",
    answer: "Sim. O que muda entre os planos e a quantidade de mensagens incluidas e o numero de conexoes disponiveis."
  },
  {
    question: "O que acontece se eu ultrapassar o limite?",
    answer: "As mensagens excedentes sao cobradas sob demanda, para que sua operacao continue funcionando sem interrupcoes."
  },
  {
    question: "O atendimento com IA esta incluido?",
    answer: "Sim. Todos os planos incluem atendimento com IA integrado a operacao."
  },
  {
    question: "Posso escalar conforme meu negocio cresce?",
    answer: "Sim. Voce pode evoluir para planos com maior volume de mensagens e mais numeros conectados."
  }
];

function splitPrice(monthlyPrice: string) {
  const [whole, cents] = monthlyPrice.split(",");
  return { whole, cents };
}

function PricingCard({ plan, onLoginClick }: { plan: PricingPlan; onLoginClick: () => void }) {
  const price = splitPrice(plan.monthlyPrice);
  const cardClass = plan.recommended
    ? "relative flex h-full flex-col rounded-[28px] border border-blue-500/80 bg-white p-6 shadow-[0_28px_90px_-48px_rgba(37,99,235,0.42)] ring-2 ring-blue-100"
    : "relative flex h-full flex-col rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-[0_24px_70px_-56px_rgba(15,23,42,0.28)]";

  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{plan.name}</p>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Plano {plan.name}</h3>
        </div>
        {plan.badge && (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
            {plan.badge}
          </span>
        )}
      </div>

      <div className="mt-8 flex items-end gap-1">
        <span className="pb-2 text-sm font-semibold text-slate-500">R$</span>
        <span className="text-4xl font-bold tracking-tight text-slate-950">{price.whole}</span>
        <span className="pb-1 text-lg font-semibold text-slate-700">,{price.cents}</span>
      </div>
      <p className="mt-2 text-sm text-slate-500">por mes</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Numeros conectados</span>
          <strong className="text-slate-950">{plan.numbers.replace(" numeros conectados", "").replace(" numero conectado", "")}</strong>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Mensagens incluidas</span>
          <strong className="text-slate-950">{plan.messages.replace(" por mes", "")}</strong>
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
        <li className="flex items-start gap-3">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-950" aria-hidden="true" />
          <span>Todos os recursos inclusos</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
          <span>Atendimento com IA</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
          <span>Mensagens excedentes cobradas sob demanda</span>
        </li>
      </ul>

      <div className="mt-8 pt-2">
        <button
          type="button"
          className={plan.recommended ? `${primaryButtonClass} w-full` : `${secondaryButtonClass} w-full`}
          onClick={onLoginClick}
        >
          {plan.cta}
        </button>
      </div>
    </article>
  );
}

export function PricingLanding({ onLoginClick }: PricingLandingProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] text-slate-900">
      <section className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-base font-bold text-white shadow-sm">A</span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Atend.AI</p>
              <p className="text-sm text-slate-500">Atendente virtual com IA, CRM e WhatsApp oficial em uma unica plataforma</p>
            </div>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={onLoginClick}>
            Entrar na plataforma
          </button>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Planos e precos
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]">
                Sua atendente virtual no WhatsApp
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                O Atend.AI assume o primeiro atendimento, responde clientes automaticamente, organiza tudo no CRM e aciona o time humano quando a conversa exige intervencao. Todos os planos incluem a plataforma completa com IA, automacao e WhatsApp oficial.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={primaryButtonClass} onClick={onLoginClick}>
                Comecar agora
              </button>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                Mensagens excedentes sao cobradas sob demanda.
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.28)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Modelo comercial</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Todos os planos entregam a mesma plataforma completa.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">O que muda</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Somente mensagens incluidas, numeros conectados e preco mensal.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/80 px-5 py-8 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.28)] backdrop-blur sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Escolha o plano ideal para colocar sua atendente virtual em operacao</h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                A plataforma e a mesma em todos os planos. Voce escolhe o volume de mensagens e a quantidade de numeros conectados que fazem sentido agora, com espaco para crescer depois.
              </p>
            </div>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
              Excedente cobrado sob demanda
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan) => <PricingCard key={plan.code} plan={plan} onLoginClick={onLoginClick} />)}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_-56px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                Todos os planos incluem
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                A mesma base premium em qualquer escolha
              </h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                Isso deixa a decisao comercial simples: voce escolhe por capacidade, nao por restricao de recurso.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                    +
                  </span>
                  <p className="text-sm font-medium text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_-56px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                FAQ rapido
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Duvidas comuns
              </h2>
            </div>
            <div className="mt-6 space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4" open>
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950 marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-blue-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.96))] px-6 py-8 shadow-[0_24px_80px_-56px_rgba(37,99,235,0.28)] sm:px-8 lg:py-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
            <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              Proximo passo
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Comece com o plano ideal e escale conforme sua operacao cresce
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Tenha CRM, automacao, IA e WhatsApp oficial em uma unica plataforma, com planos pensados para acompanhar sua evolucao sem complicar a operacao.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className={primaryButtonClass} onClick={onLoginClick}>
                Comecar agora
              </button>
              <button type="button" className={secondaryButtonClass} onClick={onLoginClick}>
                Falar com especialista
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

