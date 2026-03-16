import type { ComponentProps } from "react";
import { AiWorkspace } from "@features/ai/pages/AiWorkspace";
import { InboxWorkspace } from "@features/atendimentos/pages/InboxWorkspace";
import { CrmWorkspace } from "@features/clientes/pages/CrmWorkspace";
import { CommercialWorkspace } from "@features/dashboard/pages/CommercialWorkspace";
import { CompaniesWorkspace } from "@features/empresas/pages/CompaniesWorkspace";
import { UsersWorkspace } from "@features/usuarios/pages/UsersWorkspace";
import { WhatsAppWorkspace } from "@features/whatsapp/pages/WhatsAppWorkspace";
import type { AppPage } from "@shared/types";

type AppWorkspaceContentProps = {
  currentPage: AppPage;
  canManage: boolean;
  canManageCompanies: boolean;
  attendanceProps: ComponentProps<typeof InboxWorkspace>;
  aiProps: ComponentProps<typeof AiWorkspace>;
  usersProps: ComponentProps<typeof UsersWorkspace>;
  commercialProps: ComponentProps<typeof CommercialWorkspace>;
  whatsAppProps: ComponentProps<typeof WhatsAppWorkspace>;
  crmProps: ComponentProps<typeof CrmWorkspace>;
  companiesProps: ComponentProps<typeof CompaniesWorkspace>;
};

export function AppWorkspaceContent({
  currentPage,
  canManage,
  canManageCompanies,
  attendanceProps,
  aiProps,
  usersProps,
  commercialProps,
  whatsAppProps,
  crmProps,
  companiesProps
}: AppWorkspaceContentProps) {
  return (
    <>
      {currentPage === "ATTENDANCE" && <InboxWorkspace {...attendanceProps} />}
      {currentPage === "AI" && canManage && <AiWorkspace {...aiProps} />}
      {currentPage === "USERS" && canManage && <UsersWorkspace {...usersProps} />}
      {currentPage === "COMMERCIAL" && canManage && <CommercialWorkspace {...commercialProps} />}
      {currentPage === "WHATSAPP" && canManage && <WhatsAppWorkspace {...whatsAppProps} />}
      {currentPage === "CRM" && canManage && <CrmWorkspace {...crmProps} />}
      {canManageCompanies && currentPage === "COMPANIES" && <CompaniesWorkspace {...companiesProps} />}
    </>
  );
}

