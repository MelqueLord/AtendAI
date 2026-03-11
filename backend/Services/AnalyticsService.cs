using backend.Application.Interfaces;
using backend.Contracts;

namespace backend.Services;

public sealed class AnalyticsService(IDataStore store) : IAnalyticsService
{
    private static readonly string[] SchedulingKeywords =
    [
        "agendar", "agendamento", "consulta", "marcar", "horario", "agenda"
    ];

    public async Task<AnalyticsOverviewResponse> GetOverviewAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await store.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
        var total = conversations.Count;

        if (total == 0)
        {
            return new AnalyticsOverviewResponse(0, 0, 0, 0, 0, 0, BuildDailySeries(conversations));
        }

        var waitingHuman = conversations.Count(c => c.Status == Models.ConversationStatus.WaitingHuman);

        var firstResponseTimes = new List<double>();
        var withinSlaCount = 0;

        foreach (var conversation in conversations)
        {
            var firstCustomer = conversation.Messages
                .Where(m => string.Equals(m.Sender, "Customer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(m => m.CreatedAt)
                .FirstOrDefault();

            var firstReply = conversation.Messages
                .Where(m => !string.Equals(m.Sender, "Customer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(m => m.CreatedAt)
                .FirstOrDefault();

            if (firstCustomer is null || firstReply is null)
            {
                continue;
            }

            var seconds = (firstReply.CreatedAt - firstCustomer.CreatedAt).TotalSeconds;
            if (seconds < 0)
            {
                continue;
            }

            firstResponseTimes.Add(seconds);
            if (seconds <= 300)
            {
                withinSlaCount++;
            }
        }

        var aiResolved = conversations.Count(c =>
            c.Messages.Any(m => string.Equals(m.Sender, "AI", StringComparison.OrdinalIgnoreCase)) &&
            c.Messages.All(m => !string.Equals(m.Sender, "HumanAgent", StringComparison.OrdinalIgnoreCase)) &&
            c.Status != Models.ConversationStatus.WaitingHuman);

        var schedulingIntent = conversations.Count(HasSchedulingIntent);

        var avgFirstResponse = firstResponseTimes.Count == 0 ? 0 : firstResponseTimes.Average();
        var slaRate = firstResponseTimes.Count == 0 ? 0 : (double)withinSlaCount / firstResponseTimes.Count * 100;
        var fcrRate = (double)aiResolved / total * 100;
        var schedulingRate = (double)schedulingIntent / total * 100;

        return new AnalyticsOverviewResponse(
            total,
            waitingHuman,
            Math.Round(slaRate, 1),
            Math.Round(fcrRate, 1),
            Math.Round(avgFirstResponse, 1),
            Math.Round(schedulingRate, 1),
            BuildDailySeries(conversations));
    }

    private static List<AnalyticsDailyPoint> BuildDailySeries(List<Models.Conversation> conversations)
    {
        var start = DateTime.UtcNow.Date.AddDays(-6);
        var result = new List<AnalyticsDailyPoint>(7);

        for (var i = 0; i < 7; i++)
        {
            var day = start.AddDays(i);
            var nextDay = day.AddDays(1);
            var inDay = conversations.Where(c => c.CreatedAt.UtcDateTime >= day && c.CreatedAt.UtcDateTime < nextDay).ToList();

            result.Add(new AnalyticsDailyPoint(
                day.ToString("MM-dd"),
                inDay.Count,
                inDay.Count(c => c.Status == Models.ConversationStatus.WaitingHuman),
                inDay.Count(HasSchedulingIntent)));
        }

        return result;
    }

    private static bool HasSchedulingIntent(Models.Conversation conversation)
    {
        return conversation.Messages.Any(m =>
            string.Equals(m.Sender, "Customer", StringComparison.OrdinalIgnoreCase) &&
            SchedulingKeywords.Any(keyword => m.Text.Contains(keyword, StringComparison.OrdinalIgnoreCase)));
    }
}
