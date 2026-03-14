import type { Dispatch, SetStateAction } from "react";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  dangerButtonClass,
  filterBarClass,
  heroPanelClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtlePanelClass,
  tableBodyCellClass,
  tableHeaderCellClass,
  tableShellClass,
  textareaClass,
  workspacePageClass
} from "@shared/components/WorkspaceUi";


type Contact = {
  id: string;
  name: string;
  phone: string;
  state: string | null;
  status: string | null;
  tags: string[];
  ownerName: string | null;
  createdAt: string;
};

type ScheduledBroadcast = {
  id: string;
  tenantId: string;
  name: string;
  messageTemplate: string;
  scheduledAt: string;
  status: string;
  tagFilter: string | null;
  targetCount: number;
  deliveredCount: number;
  createdAt: string;
};

type QueueAttentionItem = {
  conversationId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  waitingMinutes: number;
  firstHumanReplyMinutes: number | null;
};

type QueueHealth = {
  unattendedCount: number;
  averageFirstHumanReplyMinutes: number;
  averageCustomerRating: number;
  feedbackCount: number;
  unattended: QueueAttentionItem[];
};

type CustomerFeedback = {
  id: string;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type AutomationOption = {
  id: string;
  tenantId: string;
  name: string;
  triggerKeywords: string;
  responseTemplate: string;
  escalateToHuman: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ContactDraft = {
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

type BroadcastDraft = {
  name: string;
  messageTemplate: string;
  scheduledAt: string;
  tagFilter: string;
};

type AutomationDraft = {
  name: string;
  triggerKeywords: string;
  responseTemplate: string;
  escalateToHuman: boolean;
  sortOrder: number;
  isActive: boolean;
};

type CrmWorkspaceProps = {
  contacts: Contact[];
  filteredContacts: Contact[];
  contactDraft: ContactDraft;
  setContactDraft: Dispatch<SetStateAction<ContactDraft>>;
  editingContactId: string;
  saveContact: () => void;
  cancelContactEdit: () => void;
  contactImportRaw: string;
  setContactImportRaw: Dispatch<SetStateAction<string>>;
  importContacts: () => void;
  contactSearch: string;
  setContactSearch: Dispatch<SetStateAction<string>>;
  contactStateFilter: string;
  setContactStateFilter: Dispatch<SetStateAction<string>>;
  contactStatusFilter: string;
  setContactStatusFilter: Dispatch<SetStateAction<string>>;
  contactTagFilter: string;
  setContactTagFilter: Dispatch<SetStateAction<string>>;
  stateOptions: string[];
  contactStatusOptions: string[];
  availableTags: string[];
  selectedBroadcastContacts: string[];
  toggleBroadcastContact: (contactId: string) => void;
  editContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  scheduledBroadcasts: ScheduledBroadcast[];
  broadcastDraft: BroadcastDraft;
  setBroadcastDraft: Dispatch<SetStateAction<BroadcastDraft>>;
  saveBroadcast: () => void;
  queueHealth: QueueHealth | null;
  feedbackList: CustomerFeedback[];
  automationOptions: AutomationOption[];
  automationDraft: AutomationDraft;
  setAutomationDraft: Dispatch<SetStateAction<AutomationDraft>>;
  automationPriorityOptions: number[];
  editingAutomationId: string;
  saveAutomationOption: () => void;
  cancelAutomationEdit: () => void;
  editAutomationOption: (option: AutomationOption) => void;
  deleteAutomationOption: (optionId: string) => void;
  openInternalConversation: (contact?: Contact) => void;
  formatDate: (value: string) => string;
};

function broadcastTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error")) return "rose" as const;
  if (normalized.includes("done") || normalized.includes("sent") || normalized.includes("complete")) return "emerald" as const;
  if (normalized.includes("pending") || normalized.includes("schedule")) return "amber" as const;
  return "slate" as const;
}

export function CrmWorkspace({
  contacts,
  filteredContacts,
  contactDraft,
  setContactDraft,
  editingContactId,
  saveContact,
  cancelContactEdit,
  contactImportRaw,
  setContactImportRaw,
  importContacts,
  contactSearch,
  setContactSearch,
  contactStateFilter,
  setContactStateFilter,
  contactStatusFilter,
  setContactStatusFilter,
  contactTagFilter,
  setContactTagFilter,
  stateOptions,
  contactStatusOptions,
  availableTags,
  selectedBroadcastContacts,
  toggleBroadcastContact,
  editContact,
  deleteContact,
  scheduledBroadcasts,
  broadcastDraft,
  setBroadcastDraft,
  saveBroadcast,
  queueHealth,
  feedbackList,
  automationOptions,
  automationDraft,
  setAutomationDraft,
  automationPriorityOptions,
  editingAutomationId,
  saveAutomationOption,
  cancelAutomationEdit,
  editAutomationOption,
  deleteAutomationOption,
  openInternalConversation,
  formatDate
}: CrmWorkspaceProps) {
  const activeAutomations = automationOptions.filter((option) => option.isActive).length;

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">CRM</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">CRM</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">Gerencie contatos, campanhas e abra o atendimento interno da plataforma sem sair da ferramenta.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="button" className={secondaryButtonClass} onClick={() => openInternalConversation()}>Abrir atendimento interno</button>
              <StatusPill tone="blue">Acesso rapido para operacao manual</StatusPill>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="Contatos" value={String(contacts.length)} detail="Base ativa de clientes e leads" tone="blue" />
            <MetricTile label="Campanhas" value={String(scheduledBroadcasts.length)} detail="Disparos criados na plataforma" tone="emerald" />
            <MetricTile label="Fluxos ativos" value={String(activeAutomations)} detail="Automacoes operando no tenant" tone="slate" />
            <MetricTile label="Sem atendimento" value={String(queueHealth?.unattendedCount ?? 0)} detail="Conversas aguardando retorno humano" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <WorkspaceSection
          eyebrow="Contatos"
          title={editingContactId ? "Editar contato" : "Cadastrar contato"}
       >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            <label className={labelClass} htmlFor="contact-name">
              Nome do contato
              <input id="contact-name" className={inputClass} value={contactDraft.name} onChange={(event) => setContactDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="contact-phone">
              WhatsApp
              <input id="contact-phone" className={inputClass} placeholder="5511999999999" value={contactDraft.phone} onChange={(event) => setContactDraft((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="contact-state">
              UF
              <select id="contact-state" className={inputClass} value={contactDraft.state} onChange={(event) => setContactDraft((prev) => ({ ...prev, state: event.target.value }))}>
                {stateOptions.map((state) => <option key={state || "empty"} value={state}>{state || "Selecione o estado"}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor="contact-status">
              Status da jornada
              <select id="contact-status" className={inputClass} value={contactDraft.status} onChange={(event) => setContactDraft((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="">Status da jornada</option>
                {contactStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className={`${labelClass} md:col-span-2`} htmlFor="contact-tags">
              Tags
              <input id="contact-tags" className={inputClass} value={contactDraft.tags} onChange={(event) => setContactDraft((prev) => ({ ...prev, tags: event.target.value }))} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
            {editingContactId && <button type="button" className={secondaryButtonClass} onClick={cancelContactEdit}>Cancelar</button>}
            <button type="button" className={primaryButtonClass} onClick={saveContact}>{editingContactId ? "Salvar contato" : "Cadastrar contato"}</button>
          </div>

          <div className={subtlePanelClass}>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Importacao rapida</p>
                <p className="text-sm leading-6 text-slate-500">nome;telefone;estado;status;tag1,tag2</p>
              </div>
              <textarea className={textareaClass} value={contactImportRaw} onChange={(event) => setContactImportRaw(event.target.value)} />
              <div className="flex justify-end">
                <button type="button" className={secondaryButtonClass} onClick={importContacts}>Importar contatos</button>
              </div>
            </div>
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Campanhas"
          title="Disparos para lista de clientes"
         actions={<StatusPill tone="blue">{selectedBroadcastContacts.length} selecionado(s)</StatusPill>}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            <label className={labelClass} htmlFor="broadcast-name">
              Nome da campanha
              <input id="broadcast-name" className={inputClass} value={broadcastDraft.name} onChange={(event) => setBroadcastDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="broadcast-date">
              Data e horario
              <input id="broadcast-date" type="datetime-local" className={inputClass} value={broadcastDraft.scheduledAt} onChange={(event) => setBroadcastDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="broadcast-tag-filter">
              Filtro por tag
              <select id="broadcast-tag-filter" className={inputClass} value={broadcastDraft.tagFilter} onChange={(event) => setBroadcastDraft((prev) => ({ ...prev, tagFilter: event.target.value }))}>
                <option value="">Todas as tags</option>
                {availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </label>
            <div className={subtlePanelClass}>
              <p className="text-sm font-semibold text-slate-900">Publico atual</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedBroadcastContacts.length > 0 ? `${selectedBroadcastContacts.length} contato(s) selecionado(s) manualmente.` : "Selecione contatos na tabela abaixo ou use filtro por tag."}</p>
            </div>
            <label className={`${labelClass} md:col-span-2`} htmlFor="broadcast-template">
              Mensagem da campanha
              <textarea id="broadcast-template" className={textareaClass} value={broadcastDraft.messageTemplate} onChange={(event) => setBroadcastDraft((prev) => ({ ...prev, messageTemplate: event.target.value }))} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
            <button type="button" className={primaryButtonClass} onClick={saveBroadcast}>Agendar disparo</button>
          </div>

          <div className="grid gap-3">
            {scheduledBroadcasts.map((item) => (
              <article key={item.id} className={subtlePanelClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-semibold text-slate-900">{item.name}</strong>
                      <StatusPill tone={broadcastTone(item.status)}>{item.status}</StatusPill>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(item.scheduledAt)} - {item.deliveredCount}/{item.targetCount} entregues</p>
                    {item.tagFilter && <p className="text-sm text-slate-500">Filtro por tag: {item.tagFilter}</p>}
                  </div>
                </div>
              </article>
            ))}
            {scheduledBroadcasts.length === 0 && <EmptyStatePanel>Nenhuma campanha agendada ainda.</EmptyStatePanel>}
          </div>
        </WorkspaceSection>
      </section>

      <WorkspaceSection
        eyebrow="Base de contatos"
        title="Contatos da empresa"
       actions={<StatusPill tone="slate">{filteredContacts.length} contato(s)</StatusPill>}
      >
        <div className={`${filterBarClass} xl:grid-cols-12`}>
          <label className={`${labelClass} xl:col-span-5`} htmlFor="contact-search">
            Buscar
            <input id="contact-search" className={inputClass} placeholder="Nome, telefone ou responsavel" value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} />
          </label>
          <label className={`${labelClass} xl:col-span-2`} htmlFor="contact-state-filter">
            UF
            <select id="contact-state-filter" className={inputClass} value={contactStateFilter} onChange={(event) => setContactStateFilter(event.target.value)}>
              <option value="">Todos os estados</option>
              {stateOptions.filter(Boolean).map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label className={`${labelClass} xl:col-span-2`} htmlFor="contact-status-filter">
            Status
            <select id="contact-status-filter" className={inputClass} value={contactStatusFilter} onChange={(event) => setContactStatusFilter(event.target.value)}>
              <option value="">Todos os status</option>
              {contactStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className={`${labelClass} xl:col-span-2`} htmlFor="contact-tag-filter">
            Tag
            <select id="contact-tag-filter" className={inputClass} value={contactTagFilter} onChange={(event) => setContactTagFilter(event.target.value)}>
              <option value="">Todas as tags</option>
              {availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
          <div className="flex items-end justify-start xl:col-span-1 xl:justify-end">
            <StatusPill tone="blue">{selectedBroadcastContacts.length} selecionado(s)</StatusPill>
          </div>
        </div>

        <div className={tableShellClass}>
          <div className="overflow-auto">
            <table className="min-w-[1080px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className={tableHeaderCellClass}>Selecionar</th>
                  <th className={tableHeaderCellClass}>Nome</th>
                  <th className={tableHeaderCellClass}>WhatsApp</th>
                  <th className={tableHeaderCellClass}>UF</th>
                  <th className={tableHeaderCellClass}>Status</th>
                  <th className={tableHeaderCellClass}>Tags</th>
                  <th className={tableHeaderCellClass}>Responsavel</th>
                  <th className={tableHeaderCellClass}>Criado em</th>
                  <th className={tableHeaderCellClass}>Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="align-top">
                    <td className={tableBodyCellClass}>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <input className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" type="checkbox" checked={selectedBroadcastContacts.includes(contact.id)} onChange={() => toggleBroadcastContact(contact.id)} />
                        Selecionar
                      </label>
                    </td>
                    <td className={tableBodyCellClass}>
                      <div className="space-y-1">
                        <strong className="block font-semibold text-slate-900">{contact.name}</strong>
                        <span className="text-xs text-slate-500">ID {contact.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>{contact.phone}</td>
                    <td className={tableBodyCellClass}>{contact.state ?? "-"}</td>
                    <td className={tableBodyCellClass}>{contact.status ? <StatusPill tone="emerald">{contact.status}</StatusPill> : <span className="text-slate-400">Sem status</span>}</td>
                    <td className={tableBodyCellClass}>
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.length > 0 ? contact.tags.map((tag) => <StatusPill key={tag} tone="slate">{tag}</StatusPill>) : <span className="text-slate-400">Sem tags</span>}
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>{contact.ownerName ?? "Nao definido"}</td>
                    <td className={tableBodyCellClass}>{formatDate(contact.createdAt)}</td>
                    <td className={tableBodyCellClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={primaryButtonClass} onClick={() => openInternalConversation(contact)}>Atender</button>
                        <button type="button" className={secondaryButtonClass} onClick={() => editContact(contact)}>Editar</button>
                        <button type="button" className={dangerButtonClass} onClick={() => deleteContact(contact.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredContacts.length === 0 && <EmptyStatePanel>Nenhum contato encontrado com os filtros atuais.</EmptyStatePanel>}
      </WorkspaceSection>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <WorkspaceSection
          eyebrow="Fluxos"
          title={editingAutomationId ? "Editar fluxo automatico" : "Fluxos de atendimento automatico"}
       >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            <label className={labelClass} htmlFor="automation-name">
              Nome do fluxo
              <input id="automation-name" className={inputClass} value={automationDraft.name} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="automation-priority">
              Prioridade
              <select id="automation-priority" className={inputClass} value={automationDraft.sortOrder} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 1 }))}>
                {automationPriorityOptions.map((priority) => <option key={priority} value={priority}>Prioridade {priority}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor="automation-keywords">
              Palavras-chave
              <input id="automation-keywords" className={inputClass} value={automationDraft.triggerKeywords} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, triggerKeywords: event.target.value }))} />
            </label>
            <label className={labelClass} htmlFor="automation-escalate">
              Tratamento
              <select id="automation-escalate" className={inputClass} value={automationDraft.escalateToHuman ? "ESCALATE" : "RESOLVE"} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, escalateToHuman: event.target.value === "ESCALATE" }))}>
                <option value="RESOLVE">Resolver na IA</option>
                <option value="ESCALATE">Escalar para humano</option>
              </select>
            </label>
            <label className={labelClass} htmlFor="automation-status">
              Status do fluxo
              <select id="automation-status" className={inputClass} value={automationDraft.isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, isActive: event.target.value === "ACTIVE" }))}>
                <option value="ACTIVE">Fluxo ativo</option>
                <option value="INACTIVE">Fluxo inativo</option>
              </select>
            </label>
            <div className="hidden md:block" aria-hidden="true" />
            <label className={`${labelClass} md:col-span-2`} htmlFor="automation-template">
              Resposta automatica
              <textarea id="automation-template" className={textareaClass} value={automationDraft.responseTemplate} onChange={(event) => setAutomationDraft((prev) => ({ ...prev, responseTemplate: event.target.value }))} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
            {editingAutomationId && <button type="button" className={secondaryButtonClass} onClick={cancelAutomationEdit}>Cancelar</button>}
            <button type="button" className={primaryButtonClass} onClick={saveAutomationOption}>{editingAutomationId ? "Salvar fluxo" : "Criar fluxo"}</button>
          </div>

          <div className="grid gap-3">
            {automationOptions.map((option) => (
              <article key={option.id} className={subtlePanelClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-semibold text-slate-900">{option.name}</strong>
                      <StatusPill tone={option.isActive ? "emerald" : "slate"}>{option.isActive ? "Ativo" : "Inativo"}</StatusPill>
                      <StatusPill tone={option.escalateToHuman ? "amber" : "blue"}>{option.escalateToHuman ? "Escala humano" : "Resolve na IA"}</StatusPill>
                    </div>
                    <p className="text-sm text-slate-500">Prioridade {option.sortOrder} - Gatilhos: {option.triggerKeywords}</p>
                    <p className="text-sm leading-6 text-slate-600">{option.responseTemplate}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={secondaryButtonClass} onClick={() => editAutomationOption(option)}>Editar</button>
                    <button type="button" className={dangerButtonClass} onClick={() => deleteAutomationOption(option.id)}>Excluir</button>
                  </div>
                </div>
              </article>
            ))}
            {automationOptions.length === 0 && <EmptyStatePanel>Nenhum fluxo automatico configurado.</EmptyStatePanel>}
          </div>
        </WorkspaceSection>

        <div className="flex flex-col gap-6">
          <WorkspaceSection
            eyebrow="Fila"
            title="Clientes aguardando atendimento"
         >
            <div className="grid gap-3">
              {queueHealth?.unattended.map((item) => (
                <article key={item.conversationId} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <strong className="text-sm font-semibold text-slate-900">{item.customerName}</strong>
                      <p className="text-sm text-slate-500">{item.customerPhone} - {item.status}</p>
                    </div>
                    <StatusPill tone="amber">{item.waitingMinutes} min</StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Aguardando ha {item.waitingMinutes} minutos.</p>
                </article>
              ))}
              {!(queueHealth?.unattended.length) && <EmptyStatePanel>Nenhum cliente aguardando atendimento neste momento.</EmptyStatePanel>}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Feedback"
            title="Avaliacoes registradas"
         >
            <div className="grid gap-3">
              {feedbackList.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <strong className="text-sm font-semibold text-slate-900">{item.customerName}</strong>
                      <p className="text-sm text-slate-500">{item.customerPhone} - {formatDate(item.createdAt)}</p>
                    </div>
                    <StatusPill tone={item.rating >= 4 ? "emerald" : item.rating === 3 ? "amber" : "rose"}>{item.rating}/5</StatusPill>
                  </div>
                  {item.comment && <p className="mt-3 text-sm leading-6 text-slate-600">{item.comment}</p>}
                </article>
              ))}
              {feedbackList.length === 0 && <EmptyStatePanel>Nenhuma avaliacao registrada ainda.</EmptyStatePanel>}
            </div>
          </WorkspaceSection>
        </div>
      </section>
    </section>
  );
}
