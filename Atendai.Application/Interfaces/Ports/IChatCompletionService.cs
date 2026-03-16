namespace Atendai.Application.Interfaces;

public interface IChatCompletionService
{
    Task<string?> GenerateReplyAsync(
        string businessName,
        string customerName,
        string incomingMessage,
        IReadOnlyCollection<string> trainingRules,
        CancellationToken cancellationToken = default);
}
