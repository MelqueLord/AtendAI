using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Infrastructure.Repositories;
using Atendai.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Atendai.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<SupabaseDataStore>();
        services.AddScoped<IAuthRepository, SupabaseAuthRepository>();
        services.AddScoped<ITenantRepository, SupabaseTenantRepository>();
        services.AddScoped<IBillingRepository, SupabaseBillingRepository>();
        services.AddScoped<ICompanyRepository, SupabaseCompanyRepository>();
        services.AddScoped<IUserRepository, SupabaseUserRepository>();
        services.AddScoped<ISettingsRepository, SupabaseSettingsRepository>();
        services.AddScoped<IAutomationRepository, SupabaseAutomationRepository>();
        services.AddScoped<IConversationRepository, SupabaseConversationRepository>();
        services.AddScoped<IContactRepository, SupabaseContactRepository>();
        services.AddScoped<IWhatsAppRepository, SupabaseWhatsAppRepository>();
        services.AddScoped<ICampaignRepository, SupabaseCampaignRepository>();
        services.AddScoped<IBroadcastRepository, SupabaseBroadcastRepository>();
        services.AddScoped<IFeedbackRepository, SupabaseFeedbackRepository>();
        services.AddScoped<IInboxRepository, SupabaseInboxRepository>();
        services.AddHttpClient<IWhatsAppGateway, WhatsAppCloudService>();
        services.AddHttpClient<IChatCompletionService, GroqChatService>();
        services.AddScoped<IMetaEmbeddedSignupGateway, MetaEmbeddedSignupGateway>();
        services.AddScoped<IWhatsAppWebSessionService, WhatsAppWebSessionService>();
        services.AddSingleton<IAuthTokenIssuer, JwtAccessTokenIssuer>();
        services.AddSingleton<IWhatsAppPlatformSettings, WhatsAppPlatformSettings>();
        services.AddSingleton<ISecretProtector, SecretProtectorService>();
        services.AddSingleton<INotificationDispatcher, NotificationService>();
        services.AddHostedService<CampaignJobsWorker>();
        services.AddHostedService<BroadcastJobsWorker>();
        return services;
    }
}
