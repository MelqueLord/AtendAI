import type { AuthView } from "@app/store";
import { PricingLanding } from "@features/public/pages/PricingLanding";

type PublicEntryScreenProps = {
  authView: AuthView;
  email: string;
  password: string;
  loading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onShowPricing: () => void;
  onShowLogin: () => void;
};

export function SessionRestoreScreen() {
  return (
    <main className="authRoot">
      <section className="authFrame">
        <article className="authHero">
          <span className="brandPill">RESTAURANDO SESSAO</span>
          <h1>Atend.AI</h1>
          <p>Verificando sua sessao.</p>
        </article>
        <article className="authCard">
          <h2>Carregando</h2>
          <p>Aguarde alguns segundos.</p>
        </article>
      </section>
    </main>
  );
}

export function PublicEntryScreen({
  authView,
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onShowPricing,
  onShowLogin
}: PublicEntryScreenProps) {
  if (authView === "PRICING") {
    return <PricingLanding onLoginClick={onShowLogin} />;
  }

  return (
    <main className="authRoot">
      <section className="authFrame">
        <article className="authHero">
          <span className="brandPill">ATENDIMENTO INTELIGENTE</span>
          <h1>Atend.AI</h1>
          <p>Central profissional para orquestrar atendimento automatizado no WhatsApp com handoff humano.</p>
          <button type="button" className="ghostButton" onClick={onShowPricing}>Ver planos</button>
        </article>

        <article className="authCard">
          <h2>Entrar na Plataforma</h2>
          <label>
            Email corporativo
            <input value={email} onChange={(event) => onEmailChange(event.target.value)} />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} />
          </label>
          <button className="primaryButton" onClick={onLogin} disabled={loading}>
            {loading ? "Autenticando..." : "Entrar no Dashboard"}
          </button>
          {error && <div className="errorBanner">{error}</div>}
        </article>
      </section>
    </main>
  );
}


