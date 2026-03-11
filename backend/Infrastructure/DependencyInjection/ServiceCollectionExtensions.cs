using backend.Application.Interfaces;
using backend.Services;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<IDataStore, SupabaseDataStore>();
        services.AddHttpClient<IWhatsAppGateway, WhatsAppCloudService>();
        services.AddHttpClient<IChatCompletionService, GroqChatService>();
        services.AddSingleton<ISecretProtector, SecretProtectorService>();
        services.AddSingleton<INotificationDispatcher, NotificationService>();
        services.AddHostedService<CampaignJobsWorker>();
        services.AddHostedService<BroadcastJobsWorker>();
        return services;
    }
}
