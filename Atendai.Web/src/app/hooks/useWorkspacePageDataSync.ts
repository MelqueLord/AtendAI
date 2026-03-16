import { useEffect } from "react";
import type { AppPage } from "@shared/types";

type UseWorkspacePageDataSyncParams = {
  authToken?: string;
  authRole?: string;
  authTenantId?: string;
  currentPage: AppPage;
  loadPageData: (page: AppPage, token?: string, role?: string, tenantId?: string, force?: boolean) => Promise<void>;
};

export function useWorkspacePageDataSync({
  authToken,
  authRole,
  authTenantId,
  currentPage,
  loadPageData
}: UseWorkspacePageDataSyncParams) {
  useEffect(() => {
    if (!authToken) {
      return;
    }

    void loadPageData(currentPage, authToken, authRole, authTenantId);
  }, [authRole, authTenantId, authToken, currentPage, loadPageData]);
}
