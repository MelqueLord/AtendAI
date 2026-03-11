using backend.Application.Interfaces;
using Microsoft.Extensions.Hosting;

namespace backend.Services;

public sealed class BroadcastJobsWorker(
    IServiceProvider serviceProvider,
    ILogger<BroadcastJobsWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var store = scope.ServiceProvider.GetRequiredService<IDataStore>();
                var whatsapp = scope.ServiceProvider.GetRequiredService<ITenantWhatsAppService>();

                var dueJobs = await store.GetDueScheduledBroadcastJobsAsync(DateTimeOffset.UtcNow, 50, stoppingToken);
                foreach (var job in dueJobs)
                {
                    var message = job.MessageTemplate.Replace("{cliente}", job.CustomerName, StringComparison.OrdinalIgnoreCase);
                    var send = await whatsapp.SendMessageAsync(job.TenantId, null, job.CustomerPhone, message, stoppingToken);

                    if (send.Success)
                    {
                        await store.MarkScheduledBroadcastJobSentAsync(job.Id, stoppingToken);
                    }
                    else
                    {
                        await store.MarkScheduledBroadcastJobFailedAsync(job.Id, send.Error ?? "Falha no envio WhatsApp.", stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                try
                {
                    logger.LogError(ex, "Erro no worker de disparos agendados do CRM.");
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
