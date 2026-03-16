namespace Atendai.Domain.Rules;

using Atendai.Domain.Entities;

public static class ConversationStatusPolicy
{
    public static bool TryParse(string status, out ConversationStatus parsedStatus)
    {
        parsedStatus = default;
        if (string.IsNullOrWhiteSpace(status))
        {
            return false;
        }

        return Enum.TryParse(status.Trim(), true, out parsedStatus)
            && parsedStatus is ConversationStatus.BotHandling
                or ConversationStatus.WaitingHuman
                or ConversationStatus.HumanHandling
                or ConversationStatus.Closed;
    }

    public static bool CanTransition(ConversationStatus currentStatus, ConversationStatus nextStatus)
    {
        if (currentStatus == nextStatus)
        {
            return true;
        }

        return currentStatus switch
        {
            ConversationStatus.BotHandling => nextStatus is ConversationStatus.WaitingHuman or ConversationStatus.HumanHandling or ConversationStatus.Closed,
            ConversationStatus.WaitingHuman => nextStatus is ConversationStatus.BotHandling or ConversationStatus.HumanHandling or ConversationStatus.Closed,
            ConversationStatus.HumanHandling => nextStatus is ConversationStatus.BotHandling or ConversationStatus.WaitingHuman or ConversationStatus.Closed,
            ConversationStatus.Closed => nextStatus is ConversationStatus.BotHandling or ConversationStatus.HumanHandling,
            _ => false
        };
    }
}
