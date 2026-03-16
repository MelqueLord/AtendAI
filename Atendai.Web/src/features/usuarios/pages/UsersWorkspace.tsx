import type { Dispatch, SetStateAction } from "react";
import type { ManagedUser, TenantOption } from "@shared/types";
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
  workspacePageClass
} from "@shared/components/WorkspaceUi";

type UserDraft = {
  tenantId: string;
  name: string;
  email: string;
  role: string;
  password: string;
};

type UsersWorkspaceProps = {
  canManageCompanies: boolean;
  tenants: TenantOption[];
  managedUsers: ManagedUser[];
  filteredUsers: ManagedUser[];
  userDraft: UserDraft;
  setUserDraft: Dispatch<SetStateAction<UserDraft>>;
  editingUserId: string;
  saveUser: () => void;
  cancelUserEdit: () => void;
  userSearch: string;
  setUserSearch: Dispatch<SetStateAction<string>>;
  userRoleFilter: string;
  setUserRoleFilter: Dispatch<SetStateAction<string>>;
  userTenantFilter: string;
  setUserTenantFilter: Dispatch<SetStateAction<string>>;
  editUser: (user: ManagedUser) => void;
  deleteUser: (userId: string) => void;
  formatDate: (value: string) => string;
};

export function UsersWorkspace({
  canManageCompanies,
  tenants,
  managedUsers,
  filteredUsers,
  userDraft,
  setUserDraft,
  editingUserId,
  saveUser,
  cancelUserEdit,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  userTenantFilter,
  setUserTenantFilter,
  editUser,
  deleteUser,
  formatDate
}: UsersWorkspaceProps) {
  const adminCount = managedUsers.filter((user) => user.role === "Admin").length;
  const agentCount = managedUsers.filter((user) => user.role === "Agent").length;
  const coveredTenants = new Set(managedUsers.map((user) => user.tenantId)).size;

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Usuarios</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Usuarios</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="Usuarios" value={String(managedUsers.length)} detail="Base total cadastrada" tone="blue" />
            <MetricTile label="Admins" value={String(adminCount)} detail="Gestores com acesso ampliado" tone="emerald" />
            <MetricTile label="Agents" value={String(agentCount)} detail="Atendentes operacionais" tone="slate" />
            <MetricTile label="Empresas" value={String(coveredTenants)} detail="Tenants com acessos ativos" tone="amber" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <WorkspaceSection
            eyebrow="Acesso"
            title={editingUserId ? "Editar usuario gerencial" : "Criar usuario gerencial"}
         >
            <div className="grid gap-4 xl:grid-cols-12">
              {canManageCompanies && (
                <label className={`${labelClass} xl:col-span-6`} htmlFor="user-tenant">
                  Empresa
                  <select
                    id="user-tenant"
                    className={inputClass}
                    value={userDraft.tenantId}
                    onChange={(event) => setUserDraft((prev) => ({ ...prev, tenantId: event.target.value }))}
                  >
                    {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
                  </select>
                </label>
              )}
              <label className={`${labelClass} xl:col-span-6`} htmlFor="user-role">
                Papel
                <select
                  id="user-role"
                  className={inputClass}
                  value={userDraft.role}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="Agent">Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <label className={`${labelClass} xl:col-span-6`} htmlFor="user-name">
                Nome do usuario
                <input
                  id="user-name"
                  className={inputClass}
                  value={userDraft.name}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, name: event.target.value }))}
                 
                />
              </label>
              <label className={`${labelClass} xl:col-span-6`} htmlFor="user-email">
                Email
                <input
                  id="user-email"
                  className={inputClass}
                  value={userDraft.email}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, email: event.target.value }))}
                 
                />
              </label>
              <label className={`${labelClass} xl:col-span-12`} htmlFor="user-password">
                {editingUserId ? "Nova senha" : "Senha inicial"}
                <input
                  id="user-password"
                  type="password"
                  className={inputClass}
                  value={userDraft.password}
                  onChange={(event) => setUserDraft((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder=""
                />
             </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
              {editingUserId && <button type="button" className={secondaryButtonClass} onClick={cancelUserEdit}>Cancelar</button>}
              <button type="button" className={primaryButtonClass} onClick={saveUser}>{editingUserId ? "Salvar usuario" : "Criar usuario"}</button>
            </div>
          </WorkspaceSection>
        </div>

        <div className="xl:col-span-5">
          <WorkspaceSection
            eyebrow="Panorama"
            title="Distribuicao de acessos"
         >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className={subtlePanelClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cobertura por perfil</p>
                 </div>
                  <StatusPill tone="blue">{managedUsers.length} ativos</StatusPill>
                </div>
              </div>
              <MetricTile label="Admins" value={String(adminCount)} detail="Responsaveis por gestao, configuracao e supervisao." tone="emerald" />
              <MetricTile label="Agents" value={String(agentCount)} detail="Operadores focados em atendimento e rotina diaria." tone="slate" />
              <MetricTile label="Tenants cobertos" value={String(coveredTenants)} detail="Empresas com pelo menos um usuario configurado." tone="amber" />
            </div>
          </WorkspaceSection>
        </div>
      </section>

      <WorkspaceSection
        eyebrow="Base gerencial"
        title="Usuarios cadastrados"
       actions={<StatusPill tone="slate">{filteredUsers.length} resultado(s)</StatusPill>}
      >
        <div className={`${filterBarClass} xl:grid-cols-12`}>
          <label className={`${labelClass} xl:col-span-5`} htmlFor="user-search">
            Buscar
            <input id="user-search" className={inputClass} placeholder="Nome, email ou empresa" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
          </label>
          <label className={`${labelClass} xl:col-span-3`} htmlFor="user-role-filter">
            Papel
            <select id="user-role-filter" className={inputClass} value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
              <option value="">Todos os papeis</option>
              <option value="Admin">Admin</option>
              <option value="Agent">Agent</option>
            </select>
          </label>
          {canManageCompanies ? (
            <label className={`${labelClass} xl:col-span-3`} htmlFor="user-tenant-filter">
              Empresa
              <select id="user-tenant-filter" className={inputClass} value={userTenantFilter} onChange={(event) => setUserTenantFilter(event.target.value)}>
                <option value="">Todas as empresas</option>
                {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            </label>
          ) : <div className="hidden xl:block xl:col-span-3" aria-hidden="true" />}
          <div className="flex items-end justify-start xl:col-span-1 xl:justify-end">
            <StatusPill tone="blue">{filteredUsers.length} usuario(s)</StatusPill>
          </div>
        </div>

        <div className={tableShellClass}>
          <div className="overflow-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className={tableHeaderCellClass}>Nome</th>
                  <th className={tableHeaderCellClass}>Email</th>
                  <th className={tableHeaderCellClass}>Papel</th>
                  <th className={tableHeaderCellClass}>Empresa</th>
                  <th className={tableHeaderCellClass}>Criado em</th>
                  <th className={tableHeaderCellClass}>Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.map((managedUser) => (
                  <tr key={managedUser.id} className="align-top">
                    <td className={tableBodyCellClass}>
                      <div className="space-y-1">
                        <strong className="block font-semibold text-slate-900">{managedUser.name}</strong>
                        <span className="text-xs text-slate-500">ID {managedUser.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>{managedUser.email}</td>
                    <td className={tableBodyCellClass}><StatusPill tone={managedUser.role === "Admin" ? "emerald" : "slate"}>{managedUser.role}</StatusPill></td>
                    <td className={tableBodyCellClass}>{managedUser.tenantName}</td>
                    <td className={tableBodyCellClass}>{formatDate(managedUser.createdAt)}</td>
                    <td className={tableBodyCellClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={secondaryButtonClass} onClick={() => editUser(managedUser)}>Editar</button>
                        <button type="button" className={dangerButtonClass} onClick={() => deleteUser(managedUser.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && <EmptyStatePanel>Nenhum usuario encontrado com os filtros atuais.</EmptyStatePanel>}
      </WorkspaceSection>
    </section>
  );
}


