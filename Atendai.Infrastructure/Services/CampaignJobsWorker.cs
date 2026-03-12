using Atendai.Application.Interfaces;
using Microsoft.Extensions.Hosting;

namespace Atendai.Infrastructure.Services;

public sealed class CampaignJobsWorker(
    IServiceProvider serviceProvider,
    ILogger<CampaignJobsWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var automation = scope.ServiceProvider.GetRequiredService<ICampaignAutomationService>();
                var whatsapp = scope.ServiceProvider.GetRequiredService<ITenantWhatsAppService>();

                var dueJobs = await automation.GetDueJobsAsync(50, stoppingToken);
                foreach (var job in dueJobs)
                {
                    var message = job.Template.Replace(
                        "{cliente}",
                        string.IsNullOrWhiteSpace(job.CustomerName) ? "Cliente" : job.CustomerName,
                        StringComparison.OrdinalIgnoreCase);
                    var send = await whatsapp.SendMessageAsync(job.TenantId, job.ConversationId, job.CustomerPhone, message, stoppingToken);

                    if (send.Success)
                    {
                        await automation.MarkSentAsync(job.Id, stoppingToken);
                    }
                    else
                    {
                        await automation.MarkFailedAsync(job.Id, send.Error ?? "Falha no envio WhatsApp.", stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                try
                {
                    logger.LogError(ex, "Erro no worker de campanhas agendadas.");
                }
                catch
                {
                    // Evita que falhas do provider de log derrubem o worker em ambiente Windows restrito.
                }
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
