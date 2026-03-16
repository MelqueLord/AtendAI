import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InboxWorkspace } from "@features/atendimentos/pages/InboxWorkspace";

const baseConversation = {
  id: "conv-1",
  customerPhone: "5511999999999",
  customerName: "Maria Silva",
  status: "BotHandling",
  transport: "meta",
  channelId: "channel-1",
  channelName: "Principal",
  assignedUserId: null,
  assignedUserName: null,
  lastCustomerMessageAt: "2026-03-16T10:00:00Z",
  lastHumanMessageAt: null,
  closedAt: null,
  updatedAt: "2026-03-16T10:05:00Z",
  messages: [
    {
      id: "msg-1",
      sender: "Customer",
      text: "Oi, preciso de ajuda",
      createdAt: "2026-03-16T10:00:00Z"
    }
  ]
};

function renderInbox() {
  return render(
    <InboxWorkspace
      queue={[baseConversation]}
      conversations={[baseConversation]}
      selectedConversation={null}
      selectedConversationId=""
      onSelectConversation={vi.fn()}
      search=""
      setSearch={vi.fn()}
      queueFilter="ALL"
      setQueueFilter={vi.fn()}
      reply=""
      setReply={vi.fn()}
      outboundDraft={{ customerName: "", customerPhone: "", channelId: "", message: "" }}
      setOutboundDraft={vi.fn()}
      outboundSubmitting={false}
      queueLoading={false}
      queueRefreshing={false}
      conversationLoading={false}
      notesLoading={false}
      replySubmitting={false}
      noteSubmitting={false}
      contactSaving={false}
      quickReplySaving={false}
      statusPendingConversationId={null}
      assignmentPendingConversationId={null}
      whatsAppChannels={[]}
      startOutboundConversation={vi.fn().mockResolvedValue(true)}
      sendHumanReply={vi.fn().mockResolvedValue(undefined)}
      refreshInbox={vi.fn().mockResolvedValue(undefined)}
      feedbackDraft={{ rating: 5, comment: "" }}
      setFeedbackDraft={vi.fn()}
      saveConversationFeedback={vi.fn().mockResolvedValue(undefined)}
      contactPanelDraft={{ id: "", name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" }}
      setContactPanelDraft={vi.fn()}
      saveContactPanelDraft={vi.fn().mockResolvedValue(undefined)}
      hasSelectedContact={false}
      stateOptions={[]}
      contactStatusOptions={[]}
      managedUsers={[]}
      canAssignConversations={false}
      assignConversation={vi.fn().mockResolvedValue(undefined)}
      updateConversationStatus={vi.fn().mockResolvedValue(undefined)}
      attendanceRealtimeState="connected"
      attendanceRealtimeLastPublishedAt={null}
      attendanceRealtimeLastReceivedAt={null}
      notes={[]}
      noteDraft=""
      setNoteDraft={vi.fn()}
      addConversationNote={vi.fn().mockResolvedValue(undefined)}
      quickReplies={[]}
      quickReplyDraft={{ id: "", title: "", body: "" }}
      setQuickReplyDraft={vi.fn()}
      saveQuickReply={vi.fn().mockResolvedValue(undefined)}
      editQuickReply={vi.fn()}
      deleteQuickReply={vi.fn().mockResolvedValue(undefined)}
      applyQuickReply={vi.fn()}
      formatDate={(value) => value}
    />
  );
}

describe("InboxWorkspace", () => {
  it("renderiza a fila e o estado vazio da conversa", () => {
    renderInbox();

    expect(screen.getByText("Caixa de entrada")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText(/assim que voce selecionar uma conversa/i)).toBeInTheDocument();
  });

  it("abre o modal de outbound", async () => {
    const user = userEvent.setup();
    renderInbox();

    await user.click(screen.getByRole("button", { name: "Nova conversa" }));

    expect(screen.getByText("Iniciar nova conversa pelo CRM")).toBeInTheDocument();
  });
});
