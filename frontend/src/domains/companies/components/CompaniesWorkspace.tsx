import type { Dispatch, SetStateAction } from "react";
import type { ManagedCompany } from "../../../app/types";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtlePanelClass,
  tableShellClass,
  workspacePageClass
} from "../../../shared/ui/WorkspaceUi";

type CompaniesWorkspaceProps = {
  managedCompanies: ManagedCompany[];
  filteredCompanies: ManagedCompany[];
  companyDraft: { name: string; segment: string };
  setCompanyDraft: Dispatch<SetStateAction<{ name: string; segment: string }>>;
  editingCompanyId: string;
  saveCompany: () => void;
  cancelCompanyEdit: () => void;
  companySearch: string;
  setCompanySearch: Dispatch<SetStateAction<string>>;
  companySegmentFilter: string;
  setCompanySegmentFilter: Dispatch<SetStateAction<string>>;
  availableSegments: string[];
  editCompany: (company: ManagedCompany) => void;
  deleteCompany: (companyId: string) => void;
  formatDate: (value: string) => string;
};

export function CompaniesWorkspace({
  managedCompanies,
  filteredCompanies,
  companyDraft,
  setCompanyDraft,
  editingCompanyId,
  saveCompany,
  cancelCompanyEdit,
  companySearch,
  setCompanySearch,
  companySegmentFilter,
  setCompanySegmentFilter,
  availableSegments,
  editCompany,
  deleteCompany,
  formatDate
}: CompaniesWorkspaceProps) {
  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Empresas</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Gestao multi-tenant com estrutura mais profissional</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">Organize tenants, segmentos e crescimento da base com uma tela gerencial consistente com o restante do SaaS.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Empresas" value={String(managedCompanies.length)} detail="Tenants cadastrados" tone="blue" />
            <MetricTile label="Segmentos" value={String(new Set(managedCompanies.map((company) => company.segment)).size)} detail="Mercados presentes" tone="emerald" />
            <MetricTile label="Filtro atual" value={companySegmentFilter || "Todos"} detail="Recorte da listagem" tone="slate" />
            <MetricTile label="Resultado" value={String(filteredCompanies.length)} detail="Itens exibidos agora" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <WorkspaceSection
          eyebrow="Cadastro"
          title={editingCompanyId ? "Editar empresa" : "Criar empresa"}
          description="Formulario compacto para manter a administracao objetiva, sem campos espalhados."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass} htmlFor="company-name">
              Nome da empresa
              <input id="company-name" className={inputClass} value={companyDraft.name} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex.: Grupo Nova Saude" />
            </label>
            <label className={labelClass} htmlFor="company-segment">
              Segmento
              <input id="company-segment" className={inputClass} value={companyDraft.segment} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, segment: event.target.value }))} placeholder="Ex.: Saude, Educacao, Varejo" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-2">
            {editingCompanyId && <button type="button" className={secondaryButtonClass} onClick={cancelCompanyEdit}>Cancelar</button>}
            <button type="button" className={primaryButtonClass} onClick={saveCompany}>{editingCompanyId ? "Salvar empresa" : "Criar empresa"}</button>
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Base"
          title="Empresas cadastradas"
          description="Filtre rapidamente por nome e segmento, com uma tabela coerente com o restante da administracao."
          actions={<StatusPill tone="slate">{filteredCompanies.length} empresa(s)</StatusPill>}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_240px_auto]">
            <label className={labelClass} htmlFor="company-search">
              Buscar
              <input id="company-search" className={inputClass} placeholder="Nome da empresa ou segmento" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} />
            </label>
            <label className={labelClass} htmlFor="company-segment-filter">
              Segmento
              <select id="company-segment-filter" className={inputClass} value={companySegmentFilter} onChange={(event) => setCompanySegmentFilter(event.target.value)}>
                <option value="">Todos os segmentos</option>
                {availableSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
              </select>
            </label>
            <div className="flex items-end justify-start lg:justify-end">
              <StatusPill tone="blue">{filteredCompanies.length} resultado(s)</StatusPill>
            </div>
          </div>

          <div className={tableShellClass}>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Segmento</th>
                    <th className="px-4 py-3">Criada em</th>
                    <th className="px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="align-top">
                      <td className="px-4 py-4"><strong className="font-semibold text-slate-900">{company.name}</strong></td>
                      <td className="px-4 py-4"><StatusPill tone="slate">{company.segment}</StatusPill></td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(company.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" className={secondaryButtonClass} onClick={() => editCompany(company)}>Editar</button>
                          <button type="button" className={dangerButtonClass} onClick={() => deleteCompany(company.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredCompanies.length === 0 && <EmptyStatePanel>Nenhuma empresa encontrada com os filtros atuais.</EmptyStatePanel>}
        </WorkspaceSection>
      </section>
    </section>
  );
}



