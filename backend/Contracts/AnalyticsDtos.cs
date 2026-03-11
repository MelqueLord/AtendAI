namespace backend.Contracts;

public sealed record AnalyticsOverviewResponse(
    int TotalConversations,
    int WaitingHumanConversations,
    double SlaWithinFiveMinutesRate,
    double FirstContactResolutionRate,
    double AverageFirstResponseSeconds,
    double SchedulingConversionRate,
    List<AnalyticsDailyPoint> Last7Days);

public sealed record AnalyticsDailyPoint(
    string Date,
    int Total,
    int WaitingHuman,
    int SchedulingIntent);
