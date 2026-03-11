-- Backfill de configuracoes do tenant e contexto minimo do workspace
-- Execute no Supabase SQL Editor para remover dependencia de textos fixos no codigo.

insert into public.tenant_settings (
  tenant_id,
  business_name,
  welcome_message,
  human_fallback_message,
  updated_at
)
select
  t.id,
  coalesce(nullif(trim(t.name), ''), 'Operacao') as business_name,
  'Oi, {cliente}. Sou o assistente virtual da {negocio}. Como posso ajudar?' as welcome_message,
  'Sua solicitacao precisa de um atendente humano. Vou encaminhar agora.' as human_fallback_message,
  now()
from public.tenants t
on conflict (tenant_id) do updatecls
set
  business_name = case
    when nullif(trim(public.tenant_settings.business_name), '') is null then excluded.business_name
    else public.tenant_settings.business_name
  end,
  welcome_message = case
    when nullif(trim(public.tenant_settings.welcome_message), '') is null then excluded.welcome_message
    else public.tenant_settings.welcome_message
  end,
  human_fallback_message = case
    when nullif(trim(public.tenant_settings.human_fallback_message), '') is null then excluded.human_fallback_message
    else public.tenant_settings.human_fallback_message
  end,
  updated_at = now();

create or replace view public.workspace_context as
select
  t.id as tenant_id,
  t.name as tenant_name,
  t.segment,
  coalesce(nullif(trim(ts.business_name), ''), t.name) as business_name,
  ts.welcome_message,
  ts.human_fallback_message,
  sub.plan_code,
  bp.name as plan_name,
  bp.currency,
  bp.monthly_price,
  bp.included_conversations,
  bp.included_agents,
  bp.included_whatsapp_numbers,
  sub.status as subscription_status,
  sub.current_period_end,
  sub.trial_ends_at,
  ts.updated_at as settings_updated_at
from public.tenants t
left join public.tenant_settings ts on ts.tenant_id = t.id
left join public.tenant_subscriptions sub on sub.tenant_id = t.id
left join public.billing_plans bp on bp.code = sub.plan_code;