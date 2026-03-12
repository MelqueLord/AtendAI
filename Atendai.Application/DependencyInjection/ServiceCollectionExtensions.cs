using Atendai.Application.Interfaces;
using Atendai.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Atendai.Application.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAiResponderService, AiResponderService>();
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<ICrmService, CrmService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<ITenantWhatsAppService, TenantWhatsAppService>();
        services.AddScoped<ICampaignAutomationService, CampaignAutomationService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IManagementService, ManagementService>();
        services.AddScoped<IAdminService, AdminService>();
        return services;
    }
}
