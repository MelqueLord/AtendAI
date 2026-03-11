import type { Dispatch, SetStateAction } from "react";
import type { TrainingEntry } from "../../../app/types";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  textareaClass,
  subtlePanelClass,
  tableShellClass,
  workspacePageClass
} from "../../../shared/ui/WorkspaceUi";

type AiWorkspaceProps = {
  role: string;
  settingsDraft: {
    businessName: string;
    welcomeMessage: string;
    humanFallbackMessage: string;
  };
  setSettingsDraft: Dispatch<SetStateAction<{ businessName: string; welcomeMessage: string; humanFallbackMessage: string }>>;
  trainingKeyword: string;
  setTrainingKeyword: Dispatch<SetStateAction<string>>;
  trainingAnswer: string;
  setTrainingAnswer: Dispatch<SetStateAction<string>>;
  trainingEntries: TrainingEntry[];
  saveSettings: () => void;
  addTrainingEntry: () => void;
};

export function AiWorkspace({
  role,
  settingsDraft,
  setSettingsDraft,
  trainingKeyword,
  setTrainingKeyword,
  trainingAnswer,
  setTrainingAnswer,
  trainingEntries,
  saveSettings,
  addTrainingEntry
}: AiWorkspaceProps) {
  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">IA</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Configuracao da IA com clareza operacional</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">Centralize a personalidade do atendimento automatico, a mensagem de boas-vindas e os gatilhos mais importantes sem misturar isso com outras areas do sistema.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Perfil" value={role} detail="Nivel atual de permissao" tone="blue" />
            <MetricTile label="Regras" value={String(trainingEntries.length)} detail="Itens de treinamento ativos" tone="emerald" />
            <MetricTile label="Boas-vindas" value={settingsDraft.welcomeMessage ? "OK" : "Pendente"} detail="Mensagem inicial configurada" tone="slate" />
            <MetricTile label="Handoff" value={settingsDraft.humanFallbackMessage ? "OK" : "Pendente"} detail="Fallback humano definido" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <WorkspaceSection
          eyebrow="Personalidade"
          title="Tom e mensagens base"
          description="Defina o contexto principal da empresa e as mensagens que moldam a experiencia automatica do cliente."
          actions={<StatusPill tone="blue">{role}</StatusPill>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className={`${labelClass} md:col-span-2`} htmlFor="ai-business-name">
              Nome do negocio
              <input id="ai-business-name" className={inputClass} value={settingsDraft.businessName} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, businessName: event.target.value }))} placeholder="Ex.: AutoPrime Oficina" />
            </label>
            <label className={`${labelClass} md:col-span-2`} htmlFor="ai-welcome-message">
              Mensagem de boas-vindas
              <textarea id="ai-welcome-message" className={textareaClass} value={settingsDraft.welcomeMessage} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, welcomeMessage: event.target.value }))} />
            </label>
            <label className={`${labelClass} md:col-span-2`} htmlFor="ai-human-fallback">
              Mensagem de handoff humano
              <textarea id="ai-human-fallback" className={textareaClass} value={settingsDraft.humanFallbackMessage} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, humanFallbackMessage: event.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end border-t border-slate-200 pt-2">
            <button type="button" className={primaryButtonClass} onClick={saveSettings}>Salvar configuracoes</button>
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Treinamento"
          title="Gatilhos da IA"
          description="Cadastre respostas objetivas para reduzir handoff desnecessario e manter consistencia."
        >
          <div className="space-y-4">
            <label className={labelClass} htmlFor="ai-training-keyword">
              Palavra-chave
              <input id="ai-training-keyword" className={inputClass} value={trainingKeyword} onChange={(event) => setTrainingKeyword(event.target.value)} placeholder="Ex.: horario, agendamento, preco" />
            </label>
            <label className={labelClass} htmlFor="ai-training-answer">
              Resposta da IA
              <textarea id="ai-training-answer" className={textareaClass} value={trainingAnswer} onChange={(event) => setTrainingAnswer(event.target.value)} placeholder="Resposta que a IA deve usar quando identificar esse gatilho." />
            </label>
            <div className="flex justify-end">
              <button type="button" className={primaryButtonClass} onClick={addTrainingEntry}>Adicionar regra</button>
            </div>
            <div className="grid gap-3">
              {trainingEntries.map((entry) => (
                <article key={entry.id} className={subtlePanelClass}>
                  <strong className="block text-sm font-semibold text-slate-900">{entry.keyword}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{entry.answerTemplate}</p>
                </article>
              ))}
              {trainingEntries.length === 0 && <EmptyStatePanel>Nenhuma regra cadastrada ainda.</EmptyStatePanel>}
            </div>
          </div>
        </WorkspaceSection>
      </section>
    </section>
  );
}



