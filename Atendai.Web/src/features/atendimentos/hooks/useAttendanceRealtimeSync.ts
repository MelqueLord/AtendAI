import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { AppPage } from "@shared/types";
import type { AttendanceRealtimeState } from "@app/store";
import { createAttendanceHubConnection, type AttendanceRefreshPayload } from "@infrastructure/realtime/attendanceHub";

type UseAttendanceRealtimeSyncParams = {
  apiBase: string;
  authToken?: string;
  tenantScopeKey?: string;
  currentPage: AppPage;
  selectedIdRef: MutableRefObject<string>;
  loadConversationDetail: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<unknown>;
  loadConversations: (token?: string, options?: { background?: boolean }) => Promise<void>;
  loadConversationNotes: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<void>;
  setAttendanceRealtimeState: Dispatch<SetStateAction<AttendanceRealtimeState>>;
  setAttendanceRealtimeLastPublishedAt: Dispatch<SetStateAction<string | null>>;
  setAttendanceRealtimeLastReceivedAt: Dispatch<SetStateAction<string | null>>;
};

export function useAttendanceRealtimeSync({
  apiBase,
  authToken,
  tenantScopeKey,
  currentPage,
  selectedIdRef,
  loadConversationDetail,
  loadConversations,
  loadConversationNotes,
  setAttendanceRealtimeState,
  setAttendanceRealtimeLastPublishedAt,
  setAttendanceRealtimeLastReceivedAt
}: UseAttendanceRealtimeSyncParams) {
  const loadConversationDetailRef = useRef(loadConversationDetail);
  const loadConversationsRef = useRef(loadConversations);
  const loadConversationNotesRef = useRef(loadConversationNotes);
  const tenantScopeRef = useRef(tenantScopeKey ?? "");

  useEffect(() => {
    loadConversationDetailRef.current = loadConversationDetail;
  }, [loadConversationDetail]);

  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  useEffect(() => {
    loadConversationNotesRef.current = loadConversationNotes;
  }, [loadConversationNotes]);

  useEffect(() => {
    tenantScopeRef.current = tenantScopeKey ?? "";
  }, [tenantScopeKey]);

  useEffect(() => {
    if (!authToken || currentPage !== "ATTENDANCE") {
      setAttendanceRealtimeState("disconnected");
      return;
    }

    let cancelled = false;
    const connection = createAttendanceHubConnection(apiBase, authToken);
    const scopeSnapshot = tenantScopeRef.current;

    const refreshFromRealtime = async (payload?: AttendanceRefreshPayload) => {
      if (cancelled || tenantScopeRef.current !== scopeSnapshot) {
        return;
      }

      if (payload?.publishedAtUtc) {
        setAttendanceRealtimeLastPublishedAt(payload.publishedAtUtc);
      }
      setAttendanceRealtimeLastReceivedAt(new Date().toISOString());

      if (payload?.conversationId) {
        const refreshedConversation = await loadConversationDetailRef.current(payload.conversationId, authToken, { background: true });
        if (cancelled || tenantScopeRef.current !== scopeSnapshot) {
          return;
        }

        if (!refreshedConversation) {
          await loadConversationsRef.current(authToken, { background: true });
        }

        if (payload.conversationId === selectedIdRef.current) {
          await loadConversationNotesRef.current(payload.conversationId, authToken, { background: true });
        }

        return;
      }

      await loadConversationsRef.current(authToken, { background: true });
      if (cancelled || tenantScopeRef.current !== scopeSnapshot) {
        return;
      }

      if (selectedIdRef.current) {
        await Promise.all([
          loadConversationDetailRef.current(selectedIdRef.current, authToken, { background: true }),
          loadConversationNotesRef.current(selectedIdRef.current, authToken, { background: true })
        ]);
      }
    };

    connection.on("attendance:refresh", (payload?: AttendanceRefreshPayload) => {
      void refreshFromRealtime(payload);
    });

    connection.onreconnecting(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("reconnecting");
      }
    });

    connection.onreconnected(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("connected");
      }
    });

    connection.onclose(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("fallback");
      }
    });

    setAttendanceRealtimeState("connecting");
    void connection.start().then(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("connected");
      }
    }).catch(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("fallback");
      }
    });

    const interval = window.setInterval(() => {
      if (!cancelled && connection.state !== "Connected") {
        setAttendanceRealtimeState("fallback");
      }

      if (!cancelled) {
        void refreshFromRealtime();
      }
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      connection.off("attendance:refresh");
      void connection.stop();
    };
  }, [
    apiBase,
    authToken,
    currentPage,
    selectedIdRef,
    tenantScopeKey,
    setAttendanceRealtimeLastPublishedAt,
    setAttendanceRealtimeLastReceivedAt,
    setAttendanceRealtimeState
  ]);
}
