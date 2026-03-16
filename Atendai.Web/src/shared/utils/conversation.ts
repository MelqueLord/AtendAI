export type ConversationStatusValue = "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed";

export function normalizeConversationStatus(status: string | number): ConversationStatusValue {
  if (typeof status === "number") {
    if (status === 0) return "BotHandling";
    if (status === 1) return "WaitingHuman";
    if (status === 2) return "HumanHandling";
    return "Closed";
  }

  if (status === "WaitingHuman" || status === "HumanHandling" || status === "Closed") {
    return status;
  }

  return "BotHandling";
}
