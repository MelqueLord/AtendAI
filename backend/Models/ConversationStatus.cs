namespace backend.Models;

public enum ConversationStatus
{
    BotHandling = 0,
    WaitingHuman = 1,
    HumanHandling = 2,
    Closed = 3
}
