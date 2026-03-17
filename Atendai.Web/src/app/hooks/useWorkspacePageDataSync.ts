import { useEffect, useRef } from "react";
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
  const loadPageDataRef = useRef(loadPageData);

  useEffect(() => {
    loadPageDataRef.current = loadPageData;
  }, [loadPageData]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    void loadPageDataRef.current(currentPage, authToken, authRole, authTenantId);
  }, [authRole, authTenantId, authToken, currentPage]);
}
