import type { Dispatch, SetStateAction } from "react";
import type { ManagedCompany } from "@shared/types";
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
  tableBodyCellClass,
  tableHeaderCellClass,
  tableShellClass,
  workspacePageClass
} from "@shared/components/WorkspaceUi";

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
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Empresas</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Empresas</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="Empresas" value={String(managedCompanies.length)} detail="Tenants cadastrados" tone="blue" />
            <MetricTile label="Segmentos" value={String(new Set(managedCompanies.map((company) => company.segment)).size)} detail="Mercados presentes" tone="emerald" />
            <MetricTile label="Filtro atual" value={companySegmentFilter || "Todos"} detail="Recorte da listagem" tone="slate" />
            <MetricTile label="Resultado" value={String(filteredCompanies.length)} detail="Itens exibidos agora" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <WorkspaceSection
            eyebrow="Cadastro"
            title={editingCompanyId ? "Editar empresa" : "Criar empresa"}
         >
            <div className="grid gap-4">
              <label className={labelClass} htmlFor="company-name">
                Nome da empresa
                <input id="company-name" className={inputClass} value={companyDraft.name} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label className={labelClass} htmlFor="company-segment">
                Segmento
                <input id="company-segment" className={inputClass} value={companyDraft.segment} onChange={(event) => setCompanyDraft((prev) => ({ ...prev, segment: event.target.value }))} />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
              {editingCompanyId && <button type="button" className={secondaryButtonClass} onClick={cancelCompanyEdit}>Cancelar</button>}
              <button type="button" className={primaryButtonClass} onClick={saveCompany}>{editingCompanyId ? "Salvar empresa" : "Criar empresa"}</button>
            </div>
          </WorkspaceSection>
        </div>

        <div className="xl:col-span-8">
          <WorkspaceSection
            eyebrow="Base"
            title="Empresas cadastradas"
           actions={<StatusPill tone="slate">{filteredCompanies.length} empresa(s)</StatusPill>}
          >
            <div className={`${filterBarClass} xl:grid-cols-12`}>
              <label className={`${labelClass} xl:col-span-7`} htmlFor="company-search">
                Buscar
                <input id="company-search" className={inputClass} placeholder="Nome da empresa ou segmento" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} />
              </label>
              <label className={`${labelClass} xl:col-span-4`} htmlFor="company-segment-filter">
                Segmento
                <select id="company-segment-filter" className={inputClass} value={companySegmentFilter} onChange={(event) => setCompanySegmentFilter(event.target.value)}>
                  <option value="">Todos os segmentos</option>
                  {availableSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
                </select>
              </label>
              <div className="flex items-end justify-start xl:col-span-1 xl:justify-end">
                <StatusPill tone="blue">{filteredCompanies.length} resultado(s)</StatusPill>
              </div>
            </div>

            <div className={tableShellClass}>
              <div className="overflow-auto">
                <table className="min-w-[760px] divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50/90">
                    <tr>
                      <th className={tableHeaderCellClass}>Empresa</th>
                      <th className={tableHeaderCellClass}>Segmento</th>
                      <th className={tableHeaderCellClass}>Criada em</th>
                      <th className={tableHeaderCellClass}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="align-top">
                        <td className={tableBodyCellClass}><strong className="font-semibold text-slate-900">{company.name}</strong></td>
                        <td className={tableBodyCellClass}><StatusPill tone="slate">{company.segment}</StatusPill></td>
                        <td className={tableBodyCellClass}>{formatDate(company.createdAt)}</td>
                        <td className={tableBodyCellClass}>
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
        </div>
      </section>
    </section>
  );
}
