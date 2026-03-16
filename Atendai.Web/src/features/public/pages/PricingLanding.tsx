type PricingLandingProps = {
  onLoginClick: () => void;
};

type PricingPlan = {
  code: "START" | "GROWTH" | "PRO" | "SCALE";
  name: string;
  monthlyPrice: string;
  summary: string;
  numbers: string;
  messages: string;
  recommended?: boolean;
  badge?: string;
  cta: string;
};

type Pillar = {
  eyebrow: string;
  title: string;
  description: string;
};

const pricingPlans: PricingPlan[] = [
  {
    code: "START",
    name: "Start",
    monthlyPrice: "79,90",
    summary: "Para iniciar com um canal estruturado e atendimento com IA.",
    numbers: "1 numero conectado",
    messages: "1.000 mensagens por mes",
    cta: "Comecar agora"
  },
  {
    code: "GROWTH",
    name: "Growth",
    monthlyPrice: "159,90",
    summary: "O melhor ponto para operacoes em aceleracao.",
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
    summary: "Mais volume para times com varias frentes de atendimento.",
    numbers: "4 numeros conectados",
    messages: "8.000 mensagens por mes",
    cta: "Comecar agora"
  },
  {
    code: "SCALE",
    name: "Scale",
    monthlyPrice: "699,90",
    summary: "Capacidade alta para operacoes que precisam distribuir demanda.",
    numbers: "10 numeros conectados",
    messages: "15.000 mensagens por mes",
    cta: "Falar com vendas"
  }
];

const proofItems = [
  "IA responde o primeiro contato",
  "CRM acompanha toda a conversa",
  "Time humano entra no momento certo"
];

const pillars: Pillar[] = [
  {
    eyebrow: "Resposta imediata",
    title: "Seu cliente percebe agilidade desde a primeira mensagem.",
    description: "A IA inicia a conversa, entende o contexto e reduz o tempo perdido com triagem manual."
  },
  {
    eyebrow: "Operacao organizada",
    title: "O CRM deixa de ser retrabalho e vira parte do fluxo.",
    description: "Historico, dados e andamento comercial acompanham o atendimento sem depender de ferramenta separada."
  },
  {
    eyebrow: "Escala limpa",
    title: "Voce cresce por capacidade, nao por gambiarra.",
    description: "Todos os planos entregam a mesma base de produto. O que muda e o volume que a operacao suporta."
  }
];

const includedFeatures = [
  "Atendimento com IA",
  "CRM completo",
  "Automacoes e follow-up",
  "WhatsApp oficial",
  "Painel gerencial",
  "Campanhas e distribuicao"
];

const faqItems = [
  {
    question: "Todos os planos tem os mesmos recursos?",
    answer: "Sim. O que muda entre os planos e a quantidade de mensagens incluidas e o numero de conexoes disponiveis."
  },
  {
    question: "O que acontece se eu ultrapassar o limite?",
    answer: "As mensagens excedentes sao cobradas sob demanda para a operacao continuar sem interrupcao."
  },
  {
    question: "Posso trocar de plano depois?",
    answer: "Sim. A ideia e comecar no volume ideal agora e ampliar a capacidade conforme a operacao cresce."
  }
];

const primaryCtaClass =
  "inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_48px_-20px_rgba(34,211,238,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200";
const darkSecondaryCtaClass =
  "inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full border border-white/14 bg-white/8 px-6 py-3 text-sm font-medium text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20";
const lightPrimaryCtaClass =
  "inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_48px_-24px_rgba(15,23,42,0.7)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";
const lightSecondaryCtaClass =
  "inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";

function splitPrice(monthlyPrice: string) {
  const [whole, cents] = monthlyPrice.split(",");
  return { whole, cents };
}

function PricingCard({ plan, onLoginClick }: { plan: PricingPlan; onLoginClick: () => void }) {
  const price = splitPrice(plan.monthlyPrice);
  const isRecommended = Boolean(plan.recommended);

  return (
    <article
      className={
        isRecommended
          ? "flex h-full flex-col rounded-[30px] border border-slate-950 bg-slate-950 p-6 text-white shadow-[0_28px_90px_-52px_rgba(15,23,42,0.85)] sm:p-7"
          : "flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.32)] sm:p-7"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={
              isRecommended
                ? "inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200"
                : "inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600"
            }
          >
            {plan.code}
          </span>
          <div className="space-y-2">
            <h3 className="text-[1.8rem] font-semibold tracking-tight">{plan.name}</h3>
            <p className={isRecommended ? "text-sm leading-6 text-slate-300" : "text-sm leading-6 text-slate-600"}>{plan.summary}</p>
          </div>
        </div>

        {plan.badge && (
          <span className="inline-flex rounded-full bg-cyan-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950">
            {plan.badge}
          </span>
        )}
      </div>

      <div className="mt-8 flex items-end gap-1">
        <span className={isRecommended ? "pb-2 text-sm font-semibold text-slate-300" : "pb-2 text-sm font-semibold text-slate-500"}>R$</span>
        <span className="text-5xl font-semibold tracking-tight">{price.whole}</span>
        <span className={isRecommended ? "pb-1 text-lg font-semibold text-slate-300" : "pb-1 text-lg font-semibold text-slate-600"}>,{price.cents}</span>
      </div>
      <p className={isRecommended ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-500"}>por mes</p>

      <div
        className={
          isRecommended
            ? "mt-6 rounded-[24px] border border-white/10 bg-white/6 p-4"
            : "mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4"
        }
      >
        <div className="flex items-center justify-between gap-4 py-2">
          <span className={isRecommended ? "text-sm text-slate-300" : "text-sm text-slate-500"}>Numeros conectados</span>
          <strong className="text-sm font-semibold">{plan.numbers}</strong>
        </div>
        <div className={isRecommended ? "h-px bg-white/10" : "h-px bg-slate-200"} />
        <div className="flex items-center justify-between gap-4 py-2">
          <span className={isRecommended ? "text-sm text-slate-300" : "text-sm text-slate-500"}>Mensagens</span>
          <strong className="text-sm font-semibold">{plan.messages}</strong>
        </div>
      </div>

      <button
        type="button"
        className={
          isRecommended
            ? "mt-auto inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-center text-sm font-semibold leading-tight text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200"
            : "mt-auto inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-5 py-3 text-center text-sm font-semibold leading-tight text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        }
        onClick={onLoginClick}
      >
        {plan.cta}
      </button>
    </article>
  );
}

export function PricingLanding({ onLoginClick }: PricingLandingProps) {
  return (
    <main className="min-h-screen bg-[#f5efe7] text-slate-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),linear-gradient(145deg,#09111d_0%,#112133_54%,#183550_100%)] text-white">
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-bold text-slate-950 shadow-[0_16px_40px_-24px_rgba(34,211,238,0.75)]">
              A
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Atend.AI</p>
              <p className="text-sm text-slate-300">IA, CRM e WhatsApp oficial para uma operacao que parece grande desde o primeiro contato.</p>
            </div>
          </div>

          <button type="button" className={darkSecondaryCtaClass} onClick={onLoginClick}>
            Entrar
          </button>
        </header>

        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
          <div className="space-y-7">
            <span className="inline-flex rounded-full border border-cyan-200/20 bg-white/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur">
              Atendimento mais rapido e mais organizado
            </span>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-[2.9rem] font-semibold tracking-[-0.07em] text-white sm:text-[3.6rem] lg:text-[4.7rem] lg:leading-[0.95]">
                Seu WhatsApp pode vender e atender sem parecer uma operacao improvisada.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                O Atend.AI responde o primeiro contato com IA, organiza tudo no CRM e deixa seu time entrar so quando isso realmente faz diferenca.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className={primaryCtaClass} onClick={onLoginClick}>
                Comecar agora
              </button>
              <button type="button" className={darkSecondaryCtaClass} onClick={onLoginClick}>
                Ver planos
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {proofItems.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm font-medium text-slate-100 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-[0_26px_90px_-56px_rgba(2,8,23,0.95)] backdrop-blur-xl sm:p-7">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Fluxo da operacao
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Menos triagem manual. Mais controle do atendimento.</h2>
              <p className="text-sm leading-7 text-slate-300">
                A experiencia foi pensada para tirar peso do primeiro contato e entregar contexto pronto para quem vai vender, atender ou resolver.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/35 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">01</p>
                <p className="mt-2 text-sm font-semibold text-white">IA recebe e qualifica o cliente</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-950/35 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">02</p>
                <p className="mt-2 text-sm font-semibold text-white">CRM registra historico e andamento</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-950/35 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">03</p>
                <p className="mt-2 text-sm font-semibold text-white">Equipe humana assume so o que importa</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_-56px_rgba(15,23,42,0.28)] sm:p-7">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {pillar.eyebrow}
              </span>
              <div className="mt-4 space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{pillar.title}</h2>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">{pillar.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="rounded-[36px] border border-slate-200 bg-[#fbf8f3] p-6 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.3)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                Planos e precos
              </span>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.6rem]">
                  A mesma plataforma. O plano muda so a capacidade.
                </h2>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                  Voce escolhe o volume ideal agora e mantem a mesma base de produto quando precisar crescer.
                </p>
              </div>

              <div className="grid gap-3">
                {includedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                      +
                    </span>
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-7 text-slate-500">
                Mensagens excedentes sao cobradas sob demanda para a operacao continuar rodando sem travar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pricingPlans.map((plan) => (
                <PricingCard key={plan.code} plan={plan} onLoginClick={onLoginClick} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.28)] sm:p-7">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              FAQ rapido
            </span>

            <div className="mt-4 space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
                O que normalmente pesa antes de escolher o plano.
              </h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                As respostas abaixo ajudam a comparar capacidade sem perder de vista a experiencia do produto.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {faqItems.map((item, index) => (
                <details
                  key={item.question}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                  open={index === 0}
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950 marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-950 bg-slate-950 p-6 text-white shadow-[0_30px_90px_-58px_rgba(15,23,42,0.8)] sm:p-7">
            <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Proximo passo
            </span>

            <div className="mt-4 space-y-4">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-[2.55rem]">
                Se a meta e parecer profissional desde o primeiro contato, a base precisa nascer certa.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Escolha o plano pelo ritmo da sua operacao hoje e mantenha a mesma experiencia quando o volume crescer.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Base unica</p>
                <p className="mt-2 text-sm font-medium text-white">Mesmo produto em todos os planos.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Escala gradual</p>
                <p className="mt-2 text-sm font-medium text-white">Capacidade cresce sem refazer fluxo.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Mais controle</p>
                <p className="mt-2 text-sm font-medium text-white">IA, CRM e time trabalhando juntos.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className={primaryCtaClass} onClick={onLoginClick}>
                Comecar agora
              </button>
              <button type="button" className={lightSecondaryCtaClass} onClick={onLoginClick}>
                Falar com vendas
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
