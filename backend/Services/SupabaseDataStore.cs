using backend.Application.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public sealed partial class SupabaseDataStore : IDataStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _http;
    private readonly ILogger<SupabaseDataStore> _logger;

    public SupabaseDataStore(HttpClient http, IConfiguration configuration, ILogger<SupabaseDataStore> logger)
    {
        _http = http;
        _logger = logger;

        var url = configuration["Supabase:Url"];
        var key = configuration["Supabase:ServiceRoleKey"];
        if (string.IsNullOrWhiteSpace(key) || key.Contains("COLE_A_SERVICE_ROLE_KEY_AQUI", StringComparison.OrdinalIgnoreCase))
        {
            key = configuration["Supabase:AnonKey"];
        }

        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException("Configure Supabase:Url e (ServiceRoleKey ou AnonKey) em appsettings ou variaveis de ambiente.");
        }

        _http.BaseAddress = new Uri($"{url.TrimEnd('/')}/rest/v1/");
        _http.DefaultRequestHeaders.Clear();
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        _http.DefaultRequestHeaders.Add("apikey", key);
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
    }

    public async Task<User?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(email);
        var rows = await GetAsync<List<UserRow>>(
            $"users?email=eq.{encoded}&deleted_at=is.null&select=id,name,email,password_hash,role,tenant_id,tenants(name)&limit=1",
            cancellationToken);

        return MapUser(rows.FirstOrDefault());
    }

    public async Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<UserRow>>(
            $"users?id=eq.{userId}&deleted_at=is.null&select=id,name,email,password_hash,role,tenant_id,tenants(name)&limit=1",
            cancellationToken);

        return MapUser(rows.FirstOrDefault());
    }

    public Task CreateRefreshSessionAsync(Guid userId, Guid tenantId, string refreshTokenHash, DateTimeOffset expiresAt, CancellationToken cancellationToken = default)
    {
        return PostAsync("auth_refresh_tokens", new[]
        {
            new
            {
                user_id = userId,
                tenant_id = tenantId,
                refresh_token_hash = refreshTokenHash,
                expires_at = expiresAt
            }
        }, cancellationToken);
    }

    public async Task<RefreshTokenSession?> GetRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(refreshTokenHash);
        var rows = await GetAsync<List<RefreshTokenRow>>(
            $"auth_refresh_tokens?refresh_token_hash=eq.{encoded}&revoked_at=is.null&select=user_id,tenant_id,expires_at&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        if (row is null)
        {
            return null;
        }

        return new RefreshTokenSession
        {
            UserId = row.UserId,
            TenantId = row.TenantId,
            ExpiresAt = row.ExpiresAt
        };
    }

    public Task RevokeRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(refreshTokenHash);
        return PatchAsync($"auth_refresh_tokens?refresh_token_hash=eq.{encoded}&revoked_at=is.null", new
        {
            revoked_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public async Task<List<BillingPlanResponse>> GetBillingPlansAsync(CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<BillingPlanRow>>(
            "billing_plans?active=eq.true&select=code,name,monthly_price,currency,included_conversations,included_agents,included_whatsapp_numbers,is_popular&order=monthly_price.asc",
            cancellationToken);

        return rows.Select(r => new BillingPlanResponse(
            r.Code,
            r.Name,
            r.MonthlyPrice,
            r.Currency,
            r.IncludedConversations,
            r.IncludedAgents,
            r.IncludedWhatsAppNumbers,
            r.IsPopular)).ToList();
    }

    public async Task<BillingSubscriptionResponse> GetTenantSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<BillingSubscriptionRow>>(
            $"tenant_subscriptions?tenant_id=eq.{tenantId}&select=tenant_id,plan_code,status,trial_ends_at,current_period_end,updated_at,billing_plans(name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        if (row is null)
        {
            var trialEnds = DateTimeOffset.UtcNow.AddDays(14);
            await PostAsync("tenant_subscriptions", new[]
            {
                new
                {
                    tenant_id = tenantId,
                    plan_code = "TRIAL",
                    status = "trialing",
                    trial_ends_at = trialEnds,
                    current_period_end = (DateTimeOffset?)null
                }
            }, cancellationToken);

            rows = await GetAsync<List<BillingSubscriptionRow>>(
                $"tenant_subscriptions?tenant_id=eq.{tenantId}&select=tenant_id,plan_code,status,trial_ends_at,current_period_end,updated_at,billing_plans(name)&limit=1",
                cancellationToken);
            row = rows.First();
        }

        return MapSubscription(row);
    }

    public async Task<BillingSubscriptionResponse> UpsertTenantSubscriptionAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default)
    {
        var normalizedPlan = planCode.Trim().ToUpperInvariant();
        var plans = await GetAsync<List<BillingPlanRow>>(
            $"billing_plans?code=eq.{Uri.EscapeDataString(normalizedPlan)}&active=eq.true&select=code,name&limit=1",
            cancellationToken);

        var plan = plans.FirstOrDefault() ?? throw new InvalidOperationException("Plano invalido.");

        var existing = await GetAsync<List<BillingSubscriptionRow>>(
            $"tenant_subscriptions?tenant_id=eq.{tenantId}&select=tenant_id,plan_code,status,trial_ends_at,current_period_end,updated_at,billing_plans(name)&limit=1",
            cancellationToken);

        if (existing.Count == 0)
        {
            await PostAsync("tenant_subscriptions", new[]
            {
                new
                {
                    tenant_id = tenantId,
                    plan_code = plan.Code,
                    status = "active",
                    trial_ends_at = (DateTimeOffset?)null,
                    current_period_end = DateTimeOffset.UtcNow.AddDays(30),
                    updated_at = DateTimeOffset.UtcNow
                }
            }, cancellationToken);
        }
        else
        {
            await PatchAsync($"tenant_subscriptions?tenant_id=eq.{tenantId}", new
            {
                plan_code = plan.Code,
                status = "active",
                trial_ends_at = (DateTimeOffset?)null,
                current_period_end = DateTimeOffset.UtcNow.AddDays(30),
                updated_at = DateTimeOffset.UtcNow
            }, cancellationToken);
        }

        return await GetTenantSubscriptionAsync(tenantId, cancellationToken);
    }
    public async Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<TenantRow>>("tenants?deleted_at=is.null&select=id,name,segment&order=name.asc", cancellationToken);
        return rows.Select(t => new TenantResponse(t.Id, t.Name, t.Segment)).ToList();
    }

    public async Task<TenantResponse?> GetTenantByIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<TenantRow>>($"tenants?id=eq.{tenantId}&deleted_at=is.null&select=id,name,segment&limit=1", cancellationToken);
        var row = rows.FirstOrDefault();
        return row is null ? null : new TenantResponse(row.Id, row.Name, row.Segment);
    }

    public async Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var offset = (page - 1) * pageSize;
        var filters = "deleted_at=is.null";
        if (!string.IsNullOrWhiteSpace(search))
        {
            var encoded = Uri.EscapeDataString($"*{search.Trim()}*");
            filters += $"&name=ilike.{encoded}";
        }

        var url = $"tenants?{filters}&select=id,name,segment,created_at&order=created_at.desc&offset={offset}&limit={pageSize}";
        var rows = await GetAsync<List<TenantAdminRow>>(url, cancellationToken);
        return rows.Select(MapCompany).ToList();
    }

    public async Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<TenantAdminRow>>($"tenants?id=eq.{companyId}&deleted_at=is.null&select=id,name,segment,created_at&limit=1", cancellationToken);
        var row = rows.FirstOrDefault();
        return row is null ? null : MapCompany(row);
    }

    public async Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<TenantAdminRow>>("tenants", new[]
        {
            new
            {
                id = Guid.NewGuid(),
                name = request.Name.Trim(),
                segment = request.Segment.Trim()
            }
        }, cancellationToken);

        return MapCompany(created.First());
    }

    public async Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"tenants?id=eq.{companyId}&deleted_at=is.null", new
        {
            name = request.Name.Trim(),
            segment = request.Segment.Trim()
        }, cancellationToken);

        return await GetCompanyByIdAsync(companyId, cancellationToken);
    }

    public async Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"tenants?id=eq.{companyId}&deleted_at=is.null", new { deleted_at = DateTimeOffset.UtcNow }, cancellationToken);
        return true;
    }

    public async Task<List<ManagedUserResponse>> GetManagedUsersAsync(Guid? tenantId = null, string? search = null, string? role = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var offset = (page - 1) * pageSize;
        var filters = "deleted_at=is.null";

        if (tenantId.HasValue)
        {
            filters += $"&tenant_id=eq.{tenantId.Value}";
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var encoded = Uri.EscapeDataString($"*{search.Trim()}*");
            filters += $"&name=ilike.{encoded}";
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var encodedRole = Uri.EscapeDataString(role.Trim());
            filters += $"&role=eq.{encodedRole}";
        }

        var url = $"users?{filters}&select=id,tenant_id,name,email,role,created_at,tenants(name)&order=created_at.desc&offset={offset}&limit={pageSize}";
        var rows = await GetAsync<List<ManagedUserRow>>(url, cancellationToken);
        return rows.Select(MapManagedUser).ToList();
    }

    public async Task<ManagedUserResponse?> GetManagedUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<ManagedUserRow>>(
            $"users?id=eq.{userId}&deleted_at=is.null&select=id,tenant_id,name,email,role,created_at,tenants(name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapManagedUser(row);
    }

    public async Task<ManagedUserResponse> CreateManagedUserAsync(UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<ManagedUserRow>>("users", new[]
        {
            new
            {
                tenant_id = request.TenantId,
                name = request.Name.Trim(),
                email = request.Email.Trim().ToLowerInvariant(),
                password_hash = AuthService.HashPassword(request.Password),
                role = request.Role.Trim()
            }
        }, cancellationToken);

        return MapManagedUser(created.First());
    }

    public async Task<ManagedUserResponse?> UpdateManagedUserAsync(Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, object>
        {
            ["name"] = request.Name.Trim(),
            ["email"] = request.Email.Trim().ToLowerInvariant(),
            ["role"] = request.Role.Trim()
        };

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            payload["password_hash"] = AuthService.HashPassword(request.Password.Trim());
        }

        await PatchAsync($"users?id=eq.{userId}&deleted_at=is.null", payload, cancellationToken);
        return await GetManagedUserByIdAsync(userId, cancellationToken);
    }

    public async Task<bool> DeleteManagedUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"users?id=eq.{userId}&deleted_at=is.null", new { deleted_at = DateTimeOffset.UtcNow }, cancellationToken);
        return true;
    }

    public async Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var settingsRows = await GetAsync<List<SettingsRow>>(
            $"tenant_settings?tenant_id=eq.{tenantId}&select=*&limit=1",
            cancellationToken);

        var settings = settingsRows.FirstOrDefault();

        if (settings is null)
        {
            var tenant = await GetTenantByIdAsync(tenantId, cancellationToken);
            return new BusinessSettings
            {
                BusinessName = tenant?.Name ?? string.Empty,
                WelcomeMessage = string.Empty,
                HumanFallbackMessage = string.Empty,
                TrainingEntries = await GetTrainingEntriesAsync(tenantId, cancellationToken)
            };
        }

        var training = await GetTrainingEntriesAsync(tenantId, cancellationToken);

        return new BusinessSettings
        {
            BusinessName = settings.BusinessName,
            WelcomeMessage = settings.WelcomeMessage,
            HumanFallbackMessage = settings.HumanFallbackMessage,
            TrainingEntries = training
        };
    }
    public Task<List<TrainingEntry>> GetTrainingEntriesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return GetTrainingInternalAsync(tenantId, cancellationToken);
    }

    public async Task UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<SettingsRow>>(
            $"tenant_settings?tenant_id=eq.{tenantId}&select=tenant_id&limit=1",
            cancellationToken);

        if (rows.Count == 0)
        {
            await PostAsync("tenant_settings", new[]
            {
                new
                {
                    tenant_id = tenantId,
                    business_name = request.BusinessName,
                    welcome_message = request.WelcomeMessage,
                    human_fallback_message = request.HumanFallbackMessage,
                    updated_at = DateTimeOffset.UtcNow
                }
            }, cancellationToken);
            return;
        }

        await PatchAsync($"tenant_settings?tenant_id=eq.{tenantId}", new
        {
            business_name = request.BusinessName,
            welcome_message = request.WelcomeMessage,
            human_fallback_message = request.HumanFallbackMessage,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }
    public async Task AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default)
    {
        await PostAsync("training_entries", new[]
        {
            new
            {
                tenant_id = tenantId,
                keyword = request.Keyword.Trim(),
                answer_template = request.AnswerTemplate.Trim()
            }
        }, cancellationToken);
    }

    public async Task<Conversation> GetOrCreateConversationAsync(Guid tenantId, string customerPhone, string? customerName, Guid? channelId = null, CancellationToken cancellationToken = default)
    {
        var encodedPhone = Uri.EscapeDataString(customerPhone);
        var channelFilter = channelId.HasValue
            ? $"&channel_id=eq.{channelId.Value}"
            : "&channel_id=is.null";
        var rows = await GetAsync<List<ConversationRow>>(
            $"conversations?tenant_id=eq.{tenantId}&customer_phone=eq.{encodedPhone}{channelFilter}&select=id,customer_phone,customer_name,status,channel_id,assigned_user_id,closed_at,last_customer_message_at,last_human_message_at,created_at,updated_at,users(name),whatsapp_connections(display_name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();

        if (row is null)
        {
            var insertRows = await PostAsync<List<ConversationRow>>("conversations", new[]
            {
                new
                {
                    tenant_id = tenantId,
                    customer_phone = customerPhone,
                    customer_name = string.IsNullOrWhiteSpace(customerName) ? "Cliente" : customerName,
                    channel_id = channelId,
                    status = nameof(ConversationStatus.BotHandling)
                }
            }, cancellationToken);

            row = insertRows.First();
        }

        return MapConversation(row, []);
    }

    public async Task AddConversationMessageAsync(Guid tenantId, Guid conversationId, string sender, string text, CancellationToken cancellationToken = default)
    {
        await PostAsync("conversation_messages", new[] { new { conversation_id = conversationId, sender, text } }, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var payload = new Dictionary<string, object?>
        {
            ["updated_at"] = now
        };

        if (string.Equals(sender, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            payload["last_customer_message_at"] = now;
        }

        if (string.Equals(sender, "HumanAgent", StringComparison.OrdinalIgnoreCase))
        {
            payload["last_human_message_at"] = now;
        }

        await PatchAsync($"conversations?id=eq.{conversationId}&tenant_id=eq.{tenantId}", payload, cancellationToken);
    }

    public async Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, ConversationStatus status, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"conversations?id=eq.{conversationId}&tenant_id=eq.{tenantId}", new
        {
            status = status.ToString(),
            closed_at = status == ConversationStatus.Closed ? DateTimeOffset.UtcNow : (DateTimeOffset?)null,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public async Task<List<Conversation>> GetConversationsWithMessagesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await GetAsync<List<ConversationRow>>(
            $"conversations?tenant_id=eq.{tenantId}&select=id,customer_phone,customer_name,status,channel_id,assigned_user_id,closed_at,last_customer_message_at,last_human_message_at,created_at,updated_at,users(name),whatsapp_connections(display_name)&order=updated_at.desc",
            cancellationToken);

        var result = new List<Conversation>(conversations.Count);

        foreach (var row in conversations)
        {
            var messages = await GetAsync<List<MessageRow>>(
                $"conversation_messages?conversation_id=eq.{row.Id}&select=*&order=created_at.asc",
                cancellationToken);
            result.Add(MapConversation(row, messages));
        }

        return result;
    }

    public async Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<ConversationRow>>(
            $"conversations?id=eq.{conversationId}&tenant_id=eq.{tenantId}&select=id,customer_phone,customer_name,status,channel_id,assigned_user_id,closed_at,last_customer_message_at,last_human_message_at,created_at,updated_at,users(name),whatsapp_connections(display_name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        if (row is null)
        {
            return null;
        }

        var messages = await GetAsync<List<MessageRow>>(
            $"conversation_messages?conversation_id=eq.{conversationId}&select=*&order=created_at.asc",
            cancellationToken);

        return MapConversation(row, messages);
    }
    public async Task<WhatsAppConnectionResponse?> GetWhatsAppConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var channels = await GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        var channel = channels.FirstOrDefault(c => c.IsPrimary) ?? channels.FirstOrDefault();
        return channel is null
            ? null
            : new WhatsAppConnectionResponse(channel.TenantId, channel.WabaId, channel.PhoneNumberId, channel.VerifyToken, channel.IsActive, channel.LastTestedAt, channel.LastStatus, channel.LastError, channel.UpdatedAt);
    }

    public async Task<string?> GetWhatsAppEncryptedTokenAsync(Guid tenantId, CancellationToken cancellationToken = default, Guid? channelId = null)
    {
        var filters = $"tenant_id=eq.{tenantId}";
        if (channelId.HasValue)
        {
            filters += $"&id=eq.{channelId.Value}";
        }
        else
        {
            filters += "&order=is_primary.desc,updated_at.desc&limit=1";
        }

        var rows = await GetAsync<List<WhatsAppConnectionTokenRow>>(
            $"whatsapp_connections?{filters}&select=access_token_encrypted",
            cancellationToken);

        return rows.FirstOrDefault()?.AccessTokenEncrypted;
    }

    public async Task<WhatsAppConnectionResponse> UpsertWhatsAppConnectionAsync(Guid tenantId, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, CancellationToken cancellationToken = default)
    {
        var channels = await GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        var current = channels.FirstOrDefault(c => c.IsPrimary) ?? channels.FirstOrDefault();

        if (current is null)
        {
            var created = await CreateWhatsAppChannelAsync(tenantId, "Canal principal", wabaId, phoneNumberId, verifyToken, encryptedAccessToken, isActive, true, cancellationToken);
            return new WhatsAppConnectionResponse(created.TenantId, created.WabaId, created.PhoneNumberId, created.VerifyToken, created.IsActive, created.LastTestedAt, created.LastStatus, created.LastError, created.UpdatedAt);
        }

        var updated = await UpdateWhatsAppChannelAsync(tenantId, current.Id, current.DisplayName, wabaId, phoneNumberId, verifyToken, encryptedAccessToken, isActive, true, cancellationToken);
        return new WhatsAppConnectionResponse(updated!.TenantId, updated.WabaId, updated.PhoneNumberId, updated.VerifyToken, updated.IsActive, updated.LastTestedAt, updated.LastStatus, updated.LastError, updated.UpdatedAt);
    }

    public async Task<Guid?> FindTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(phoneNumberId);
        var rows = await GetAsync<List<WhatsAppConnectionTenantRow>>(
            $"whatsapp_connections?phone_number_id=eq.{encoded}&is_active=eq.true&select=tenant_id&order=is_primary.desc,updated_at.desc&limit=1",
            cancellationToken);

        return rows.FirstOrDefault()?.TenantId;
    }

    public async Task<Guid?> FindTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(verifyToken);
        var rows = await GetAsync<List<WhatsAppConnectionTenantRow>>(
            $"whatsapp_connections?verify_token=eq.{encoded}&is_active=eq.true&select=tenant_id&order=is_primary.desc,updated_at.desc&limit=1",
            cancellationToken);

        return rows.FirstOrDefault()?.TenantId;
    }

    public Task MarkWhatsAppConnectionTestResultAsync(Guid tenantId, bool success, string status, string? error, CancellationToken cancellationToken = default, Guid? channelId = null)
    {
        var filters = channelId.HasValue
            ? $"id=eq.{channelId.Value}&tenant_id=eq.{tenantId}"
            : $"tenant_id=eq.{tenantId}&is_primary=eq.true";

        return PatchAsync($"whatsapp_connections?{filters}", new
        {
            last_tested_at = DateTimeOffset.UtcNow,
            last_status = status,
            last_error = error,
            is_active = success ? true : (bool?)null,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public async Task<List<CampaignRuleResponse>> GetCampaignRulesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<CampaignRuleRow>>(
            $"campaign_rules?tenant_id=eq.{tenantId}&select=id,tenant_id,name,delay_hours,template,is_active,created_at,updated_at&order=created_at.desc",
            cancellationToken);

        return rows.Select(MapCampaignRule).ToList();
    }

    public async Task<CampaignRuleResponse> CreateCampaignRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<CampaignRuleRow>>("campaign_rules", new[]
        {
            new
            {
                tenant_id = tenantId,
                name = request.Name.Trim(),
                delay_hours = request.DelayHours,
                template = request.Template.Trim(),
                is_active = request.IsActive
            }
        }, cancellationToken);

        return MapCampaignRule(created.First());
    }

    public async Task<CampaignRuleResponse?> UpdateCampaignRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"campaign_rules?id=eq.{ruleId}&tenant_id=eq.{tenantId}", new
        {
            name = request.Name.Trim(),
            delay_hours = request.DelayHours,
            template = request.Template.Trim(),
            is_active = request.IsActive,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        var rows = await GetAsync<List<CampaignRuleRow>>(
            $"campaign_rules?id=eq.{ruleId}&tenant_id=eq.{tenantId}&select=id,tenant_id,name,delay_hours,template,is_active,created_at,updated_at&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapCampaignRule(row);
    }

    public async Task<bool> DeleteCampaignRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"campaign_rules?id=eq.{ruleId}&tenant_id=eq.{tenantId}");
        request.Headers.TryAddWithoutValidation("Prefer", "return=minimal");

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
        return true;
    }

    public async Task EnqueueCampaignJobsAsync(Guid tenantId, Guid conversationId, string customerPhone, string customerName, DateTimeOffset baseTimeUtc, CancellationToken cancellationToken = default)
    {
        var rules = await GetAsync<List<CampaignRuleRow>>(
            $"campaign_rules?tenant_id=eq.{tenantId}&is_active=eq.true&select=id,delay_hours,template",
            cancellationToken);

        if (rules.Count == 0)
        {
            return;
        }

        var jobs = rules.Select(rule => new
        {
            tenant_id = tenantId,
            conversation_id = conversationId,
            customer_phone = customerPhone,
            customer_name = customerName,
            rule_id = rule.Id,
            scheduled_at = baseTimeUtc.AddHours(rule.DelayHours),
            status = "pending",
            attempt_count = 0,
            created_at = DateTimeOffset.UtcNow,
            updated_at = DateTimeOffset.UtcNow
        }).ToList();

        await UpsertAsync("campaign_jobs?on_conflict=conversation_id,rule_id", jobs, cancellationToken);
    }

    public async Task<List<ScheduledCampaignJob>> GetDueCampaignJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<CampaignJobRow>>(
            $"campaign_jobs?status=eq.pending&scheduled_at=lte.{Uri.EscapeDataString(nowUtc.ToString("O"))}&select=id,tenant_id,conversation_id,rule_id,customer_phone,customer_name,scheduled_at,attempt_count,campaign_rules(template)&order=scheduled_at.asc&limit={limit}",
            cancellationToken);

        return rows.Select(row => new ScheduledCampaignJob
        {
            Id = row.Id,
            TenantId = row.TenantId,
            ConversationId = row.ConversationId,
            RuleId = row.RuleId,
            CustomerPhone = row.CustomerPhone,
            CustomerName = row.CustomerName,
            Template = row.Rule?.Template ?? "",
            ScheduledAt = row.ScheduledAt,
            AttemptCount = row.AttemptCount
        }).ToList();
    }

    public Task MarkCampaignJobSentAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return PatchAsync($"campaign_jobs?id=eq.{jobId}", new
        {
            status = "sent",
            sent_at = DateTimeOffset.UtcNow,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public Task MarkCampaignJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        return PatchAsync($"campaign_jobs?id=eq.{jobId}", new
        {
            status = "failed",
            last_error = error,
            attempt_count = 1,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public Task AddWhatsAppMessageLogAsync(Guid tenantId, Guid? conversationId, string toPhone, string direction, string status, string? errorDetail, string? payload, CancellationToken cancellationToken = default)
    {
        return PostAsync("whatsapp_message_logs", new[]
        {
            new
            {
                tenant_id = tenantId,
                conversation_id = conversationId,
                to_phone = toPhone,
                direction,
                status,
                error_detail = errorDetail,
                payload
            }
        }, cancellationToken);
    }

    public async Task<List<WhatsAppMessageLogResponse>> GetWhatsAppMessageLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<WhatsAppMessageLogRow>>(
            $"whatsapp_message_logs?tenant_id=eq.{tenantId}&select=id,tenant_id,conversation_id,to_phone,direction,status,error_detail,created_at&order=created_at.desc&limit={limit}",
            cancellationToken);

        return rows.Select(row => new WhatsAppMessageLogResponse(
            row.Id,
            row.TenantId,
            row.ConversationId,
            row.ToPhone,
            row.Direction,
            row.Status,
            row.ErrorDetail,
            row.CreatedAt)).ToList();
    }

    private async Task<List<TrainingEntry>> GetTrainingInternalAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var rows = await GetAsync<List<TrainingRow>>(
            $"training_entries?tenant_id=eq.{tenantId}&select=*&order=created_at.desc",
            cancellationToken);

        return rows.Select(row => new TrainingEntry
        {
            Id = row.Id,
            Keyword = row.Keyword,
            AnswerTemplate = row.AnswerTemplate
        }).ToList();
    }

    private static User? MapUser(UserRow? row)
    {
        if (row is null)
        {
            return null;
        }

        return new User
        {
            Id = row.Id,
            TenantId = row.TenantId,
            TenantName = row.Tenant?.Name ?? "Negocio",
            Name = row.Name,
            Email = row.Email,
            PasswordHash = row.PasswordHash,
            Role = row.Role
        };
    }

    private static ManagedCompanyResponse MapCompany(TenantAdminRow row)
    {
        return new ManagedCompanyResponse(row.Id, row.Name, row.Segment, row.CreatedAt);
    }

    private static ManagedUserResponse MapManagedUser(ManagedUserRow row)
    {
        return new ManagedUserResponse(row.Id, row.TenantId, row.Tenant?.Name ?? "Negocio", row.Name, row.Email, row.Role, row.CreatedAt);
    }

    private static BillingSubscriptionResponse MapSubscription(BillingSubscriptionRow row)
    {
        return new BillingSubscriptionResponse(
            row.TenantId,
            row.PlanCode,
            row.Plan?.Name ?? row.PlanCode,
            row.Status,
            row.TrialEndsAt,
            row.CurrentPeriodEnd,
            row.UpdatedAt);
    }

    private static WhatsAppConnectionResponse MapWhatsAppConnection(WhatsAppConnectionRow row)
    {
        return new WhatsAppConnectionResponse(
            row.TenantId,
            row.WabaId,
            row.PhoneNumberId,
            row.VerifyToken,
            row.IsActive,
            row.LastTestedAt,
            row.LastStatus,
            row.LastError,
            row.UpdatedAt);
    }

    private static CampaignRuleResponse MapCampaignRule(CampaignRuleRow row)
    {
        return new CampaignRuleResponse(
            row.Id,
            row.TenantId,
            row.Name,
            row.DelayHours,
            row.Template,
            row.IsActive,
            row.CreatedAt,
            row.UpdatedAt);
    }

    private static Conversation MapConversation(ConversationRow row, List<MessageRow> messages)
    {
        return new Conversation
        {
            Id = row.Id,
            CustomerPhone = row.CustomerPhone,
            CustomerName = row.CustomerName,
            Status = ParseStatus(row.Status),
            ChannelId = row.ChannelId,
            ChannelName = row.WhatsAppChannel?.DisplayName,
            AssignedUserId = row.AssignedUserId,
            AssignedUserName = row.User?.Name,
            LastCustomerMessageAt = row.LastCustomerMessageAt,
            LastHumanMessageAt = row.LastHumanMessageAt,
            ClosedAt = row.ClosedAt,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt,
            Messages = messages.Select(m => new ConversationMessage
            {
                Id = m.Id,
                Sender = m.Sender,
                Text = m.Text,
                CreatedAt = m.CreatedAt
            }).ToList()
        };
    }

    private static ConversationStatus ParseStatus(string status)
    {
        return Enum.TryParse<ConversationStatus>(status, out var parsed)
            ? parsed
            : ConversationStatus.BotHandling;
    }

    private async Task<T> GetAsync<T>(string relativeUrl, CancellationToken cancellationToken)
    {
        using var response = await _http.GetAsync(relativeUrl, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return (await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken))!;
    }

    private Task PostAsync(string relativeUrl, object payload, CancellationToken cancellationToken)
    {
        return SendWithoutBodyResult(HttpMethod.Post, relativeUrl, payload, cancellationToken);
    }

    private Task PatchAsync(string relativeUrl, object payload, CancellationToken cancellationToken)
    {
        return SendWithoutBodyResult(HttpMethod.Patch, relativeUrl, payload, cancellationToken);
    }



    private async Task UpsertAsync(string relativeUrl, object payload, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, relativeUrl)
        {
            Content = BuildJsonContent(payload)
        };

        request.Headers.TryAddWithoutValidation("Prefer", "resolution=merge-duplicates,return=minimal");

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
    }
    private async Task SendWithoutBodyResult(HttpMethod method, string relativeUrl, object payload, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, relativeUrl)
        {
            Content = BuildJsonContent(payload)
        };

        request.Headers.TryAddWithoutValidation("Prefer", "return=minimal");

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
    }

    private async Task<T> PostAsync<T>(string relativeUrl, object payload, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, relativeUrl)
        {
            Content = BuildJsonContent(payload)
        };

        request.Headers.TryAddWithoutValidation("Prefer", "return=representation");

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return (await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken))!;
    }

    private static StringContent BuildJsonContent(object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private async Task EnsureSuccess(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogError("Supabase request falhou. Status: {StatusCode}, Body: {Body}", response.StatusCode, body);
        throw new InvalidOperationException($"Falha no Supabase: {(int)response.StatusCode} - {body}");
    }

    private sealed class UserRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
        [JsonPropertyName("password_hash")] public string PasswordHash { get; set; } = string.Empty;
        [JsonPropertyName("role")] public string Role { get; set; } = string.Empty;
        [JsonPropertyName("tenants")] public TenantRow? Tenant { get; set; }
    }

    private sealed class TenantRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("segment")] public string Segment { get; set; } = string.Empty;
    }

    private sealed class TenantAdminRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("segment")] public string Segment { get; set; } = string.Empty;
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
    }

    private sealed class ManagedUserRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
        [JsonPropertyName("role")] public string Role { get; set; } = string.Empty;
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("tenants")] public TenantRow? Tenant { get; set; }
    }

    private sealed class BillingPlanRow
    {
        [JsonPropertyName("code")] public string Code { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("monthly_price")] public decimal MonthlyPrice { get; set; }
        [JsonPropertyName("currency")] public string Currency { get; set; } = "BRL";
        [JsonPropertyName("included_conversations")] public int IncludedConversations { get; set; }
        [JsonPropertyName("included_agents")] public int IncludedAgents { get; set; }
        [JsonPropertyName("included_whatsapp_numbers")] public int IncludedWhatsAppNumbers { get; set; }
        [JsonPropertyName("is_popular")] public bool IsPopular { get; set; }
    }

    private sealed class BillingSubscriptionRow
    {
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("plan_code")] public string PlanCode { get; set; } = string.Empty;
        [JsonPropertyName("status")] public string Status { get; set; } = "trialing";
        [JsonPropertyName("trial_ends_at")] public DateTimeOffset? TrialEndsAt { get; set; }
        [JsonPropertyName("current_period_end")] public DateTimeOffset? CurrentPeriodEnd { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
        [JsonPropertyName("billing_plans")] public BillingPlanNameRow? Plan { get; set; }
    }

    private sealed class BillingPlanNameRow
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    }
    private sealed class RefreshTokenRow
    {
        [JsonPropertyName("user_id")] public Guid UserId { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("expires_at")] public DateTimeOffset ExpiresAt { get; set; }
    }

    private sealed class SettingsRow
    {
        [JsonPropertyName("business_name")] public string BusinessName { get; set; } = string.Empty;
        [JsonPropertyName("welcome_message")] public string WelcomeMessage { get; set; } = string.Empty;
        [JsonPropertyName("human_fallback_message")] public string HumanFallbackMessage { get; set; } = string.Empty;
    }

    private sealed class TrainingRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("keyword")] public string Keyword { get; set; } = string.Empty;
        [JsonPropertyName("answer_template")] public string AnswerTemplate { get; set; } = string.Empty;
    }

    private sealed class ConversationRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("customer_phone")] public string CustomerPhone { get; set; } = string.Empty;
        [JsonPropertyName("customer_name")] public string CustomerName { get; set; } = "Cliente";
        [JsonPropertyName("status")] public string Status { get; set; } = nameof(ConversationStatus.BotHandling);
        [JsonPropertyName("channel_id")] public Guid? ChannelId { get; set; }
        [JsonPropertyName("assigned_user_id")] public Guid? AssignedUserId { get; set; }
        [JsonPropertyName("closed_at")] public DateTimeOffset? ClosedAt { get; set; }
        [JsonPropertyName("last_customer_message_at")] public DateTimeOffset? LastCustomerMessageAt { get; set; }
        [JsonPropertyName("last_human_message_at")] public DateTimeOffset? LastHumanMessageAt { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
        [JsonPropertyName("users")] public UserNameRow? User { get; set; }
        [JsonPropertyName("whatsapp_connections")] public WhatsAppConversationChannelRow? WhatsAppChannel { get; set; }
    }

    private sealed class WhatsAppConversationChannelRow
    {
        [JsonPropertyName("display_name")] public string DisplayName { get; set; } = string.Empty;
    }

    private sealed class WhatsAppConnectionRow
    {
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("waba_id")] public string? WabaId { get; set; }
        [JsonPropertyName("phone_number_id")] public string? PhoneNumberId { get; set; }
        [JsonPropertyName("verify_token")] public string VerifyToken { get; set; } = string.Empty;
        [JsonPropertyName("is_active")] public bool IsActive { get; set; }
        [JsonPropertyName("last_tested_at")] public DateTimeOffset? LastTestedAt { get; set; }
        [JsonPropertyName("last_status")] public string? LastStatus { get; set; }
        [JsonPropertyName("last_error")] public string? LastError { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class WhatsAppConnectionTokenRow
    {
        [JsonPropertyName("access_token_encrypted")] public string? AccessTokenEncrypted { get; set; }
    }

    private sealed class WhatsAppConnectionTenantRow
    {
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
    }

    private sealed class CampaignRuleRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("delay_hours")] public int DelayHours { get; set; }
        [JsonPropertyName("template")] public string Template { get; set; } = string.Empty;
        [JsonPropertyName("is_active")] public bool IsActive { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class CampaignRuleRefRow
    {
        [JsonPropertyName("template")] public string Template { get; set; } = string.Empty;
    }

    private sealed class CampaignJobRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("conversation_id")] public Guid ConversationId { get; set; }
        [JsonPropertyName("rule_id")] public Guid RuleId { get; set; }
        [JsonPropertyName("customer_phone")] public string CustomerPhone { get; set; } = string.Empty;
        [JsonPropertyName("customer_name")] public string CustomerName { get; set; } = "Cliente";
        [JsonPropertyName("scheduled_at")] public DateTimeOffset ScheduledAt { get; set; }
        [JsonPropertyName("attempt_count")] public int AttemptCount { get; set; }
        [JsonPropertyName("campaign_rules")] public CampaignRuleRefRow? Rule { get; set; }
    }

    private sealed class WhatsAppMessageLogRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("conversation_id")] public Guid? ConversationId { get; set; }
        [JsonPropertyName("to_phone")] public string ToPhone { get; set; } = string.Empty;
        [JsonPropertyName("direction")] public string Direction { get; set; } = string.Empty;
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("error_detail")] public string? ErrorDetail { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
    }

    private sealed class MessageRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("sender")] public string Sender { get; set; } = string.Empty;
        [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
    }
}














