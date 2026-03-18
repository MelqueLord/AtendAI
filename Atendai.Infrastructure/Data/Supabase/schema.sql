-- RESET TOTAL + CRM MULTI-TENANT GENERICO + COMERCIAL + CANAIS + CRM
create extension if not exists pgcrypto;

DROP TABLE IF EXISTS public.customer_feedback CASCADE;
DROP TABLE IF EXISTS public.broadcast_jobs CASCADE;
DROP TABLE IF EXISTS public.broadcast_campaigns CASCADE;
DROP TABLE IF EXISTS public.conversation_notes CASCADE;
DROP TABLE IF EXISTS public.quick_reply_templates CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.automation_options CASCADE;
DROP TABLE IF EXISTS public.whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS public.campaign_jobs CASCADE;
DROP TABLE IF EXISTS public.campaign_rules CASCADE;
DROP TABLE IF EXISTS public.whatsapp_connections CASCADE;
DROP TABLE IF EXISTS public.auth_refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS public.billing_plans CASCADE;
DROP TABLE IF EXISTS public.conversation_messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.training_entries CASCADE;
DROP TABLE IF EXISTS public.tenant_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  segment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Agent', 'SuperAdmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE TABLE public.billing_plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  monthly_price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  included_messages int NOT NULL,
  included_conversations int NOT NULL,
  included_agents int NOT NULL,
  included_whatsapp_numbers int NOT NULL DEFAULT 1,
  is_popular boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.tenant_subscriptions (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.billing_plans(code),
  status text NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz NULL,
  current_period_end timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_refresh_tokens_hash ON public.auth_refresh_tokens(refresh_token_hash);

CREATE TABLE public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  welcome_message text NOT NULL,
  human_fallback_message text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  answer_template text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_keywords text NOT NULL,
  response_template text NOT NULL,
  escalate_to_human boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  state text NULL,
  status text NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE UNIQUE INDEX ux_contacts_tenant_phone ON public.contacts(tenant_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_tenant_created ON public.contacts(tenant_id, created_at DESC);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel_id uuid NULL,
  qr_session_key text NULL,
  qr_session_name text NULL,
  qr_session_phone text NULL,
  customer_phone text NOT NULL,
  customer_name text NOT NULL DEFAULT 'Cliente',
  status text NOT NULL DEFAULT 'BotHandling',
  assigned_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  last_customer_message_at timestamptz NULL,
  last_human_message_at timestamptz NULL,
  closed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_conversations_tenant_phone_channel ON public.conversations(tenant_id, customer_phone, coalesce(channel_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(qr_session_key, ''));
CREATE INDEX idx_conversations_tenant_channel_updated ON public.conversations(tenant_id, channel_id, updated_at DESC);
CREATE INDEX idx_conversations_tenant_qr_session_updated ON public.conversations(tenant_id, qr_session_key, updated_at DESC);

CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_notes_conversation ON public.conversation_notes(conversation_id, created_at DESC);

CREATE TABLE public.quick_reply_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quick_reply_templates_tenant ON public.quick_reply_templates(tenant_id, updated_at DESC);

CREATE TABLE public.whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  waba_id text NULL,
  phone_number_id text NOT NULL,
  verify_token text NOT NULL,
  access_token_encrypted text NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  last_tested_at timestamptz NULL,
  last_status text NULL,
  last_error text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_whatsapp_phone_number_id ON public.whatsapp_connections(phone_number_id);
CREATE UNIQUE INDEX ux_whatsapp_tenant_phone ON public.whatsapp_connections(tenant_id, phone_number_id);
CREATE INDEX idx_whatsapp_tenant_primary ON public.whatsapp_connections(tenant_id, is_primary DESC, updated_at DESC);

ALTER TABLE public.conversations
  ADD CONSTRAINT fk_conversations_channel
  FOREIGN KEY (channel_id) REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL;

CREATE TABLE public.campaign_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  delay_hours int NOT NULL CHECK (delay_hours > 0),
  template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.campaign_rules(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  customer_name text NOT NULL DEFAULT 'Cliente',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count int NOT NULL DEFAULT 0,
  last_error text NULL,
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, rule_id)
);

CREATE INDEX idx_campaign_jobs_due ON public.campaign_jobs(status, scheduled_at);

CREATE TABLE public.broadcast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  message_template text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  tag_filter text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.broadcast_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,
  customer_phone text NOT NULL,
  customer_name text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count int NOT NULL DEFAULT 0,
  last_error text NULL,
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcast_jobs_due ON public.broadcast_jobs(status, scheduled_at);
CREATE INDEX idx_broadcast_jobs_campaign ON public.broadcast_jobs(campaign_id);

CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NULL REFERENCES public.conversations(id) ON DELETE SET NULL,
  to_phone text NOT NULL,
  direction text NOT NULL,
  provider_message_id text NULL,
  status text NOT NULL,
  error_detail text NULL,
  payload text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_message_logs_provider_message_id
  ON public.whatsapp_message_logs(provider_message_id);

INSERT INTO public.tenants (id, name, segment) VALUES
  ('11111111-1111-1111-1111-111111111111', 'AutoPrime Oficina', 'Automotivo'),
  ('22222222-2222-2222-2222-222222222222', 'Studio Zen Pilates', 'Fitness')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (tenant_id, name, email, password_hash, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin AutoPrime', 'admin@autoprime.com', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'Admin'),
  ('11111111-1111-1111-1111-111111111111', 'Atendente AutoPrime', 'suporte@autoprime.com', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'Agent'),
  ('22222222-2222-2222-2222-222222222222', 'Admin Studio Zen', 'admin@studiozen.com', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'Admin'),
  ('22222222-2222-2222-2222-222222222222', 'Atendente Studio Zen', 'suporte@studiozen.com', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'Agent'),
  ('11111111-1111-1111-1111-111111111111', 'Super Admin', 'superadmin@atend.ai', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'SuperAdmin')
ON CONFLICT (email) DO UPDATE SET
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  deleted_at = null;

INSERT INTO public.billing_plans (code, name, monthly_price, currency, included_messages, included_conversations, included_agents, included_whatsapp_numbers, is_popular, active) VALUES
  ('TRIAL', 'Trial 14 dias', 0, 'BRL', 200, 200, 2, 1, false, true),
  ('STARTER', 'Starter', 99, 'BRL', 1500, 1500, 4, 1, false, true),
  ('GROWTH', 'Growth', 399, 'BRL', 6000, 6000, 10, 3, true, true),
  ('SCALE', 'Scale', 999, 'BRL', 20000, 20000, 30, 10, false, true)
ON CONFLICT (code) DO UPDATE SET
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  currency = excluded.currency,
  included_messages = excluded.included_messages,
  included_conversations = excluded.included_conversations,
  included_agents = excluded.included_agents,
  included_whatsapp_numbers = excluded.included_whatsapp_numbers,
  is_popular = excluded.is_popular,
  active = excluded.active;

INSERT INTO public.tenant_subscriptions (tenant_id, plan_code, status, trial_ends_at, current_period_end) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TRIAL', 'trialing', now() + interval '14 day', null),
  ('22222222-2222-2222-2222-222222222222', 'STARTER', 'active', null, now() + interval '30 day')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO public.contacts (tenant_id, owner_user_id, name, phone, state, status, tags) VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'suporte@autoprime.com' LIMIT 1), 'Jose Almeida', '5511999999999', 'SP', 'Lead quente', ARRAY['WhatsApp', 'Agendamento']),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'admin@autoprime.com' LIMIT 1), 'Marina Costa', '5511988887777', 'RJ', 'Pos-venda', ARRAY['WhatsApp', 'Recompra']),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM public.users WHERE email = 'admin@studiozen.com' LIMIT 1), 'Ana Paula', '5511977776666', 'BA', 'Lead frio', ARRAY['Pilates', 'Instagram'])
ON CONFLICT DO NOTHING;

INSERT INTO public.automation_options (tenant_id, name, trigger_keywords, response_template, escalate_to_human, sort_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agendamento', 'agendar,horario,consulta', 'Claro, {cliente}. Posso seguir com seu agendamento aqui mesmo. Me diga o melhor dia e horario.', false, 1, true),
  ('11111111-1111-1111-1111-111111111111', 'Orcamento', 'orcamento,valor,preco', 'Sem problema, {cliente}. Me diga qual servico voce precisa para eu te passar os detalhes.', false, 2, true),
  ('22222222-2222-2222-2222-222222222222', 'Aula experimental', 'experimental,aula teste,conhecer', 'Perfeito, {cliente}. Posso reservar sua aula experimental e te explicar como funciona.', false, 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.quick_reply_templates (tenant_id, title, body) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Confirmar agendamento', 'Perfeito, {cliente}. Vou confirmar seu agendamento e ja te retorno com os detalhes finais.'),
  ('11111111-1111-1111-1111-111111111111', 'Solicitar documentos', 'Pode me enviar seus dados principais para eu seguir com o atendimento, por favor?'),
  ('22222222-2222-2222-2222-222222222222', 'Aula experimental', 'Claro, {cliente}. Posso separar um horario para sua aula experimental ainda hoje.' )
ON CONFLICT DO NOTHING;

INSERT INTO public.campaign_rules (tenant_id, name, delay_hours, template, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pos-venda D+24h', 24, 'Oi, {cliente}! Como foi sua experiencia com nosso atendimento? Se quiser, posso te ajudar com um novo agendamento.', true),
  ('22222222-2222-2222-2222-222222222222', 'Reengajamento D+72h', 72, 'Oi, {cliente}! Passando para lembrar que estamos disponiveis para seu proximo atendimento.', true)
ON CONFLICT DO NOTHING;

ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_reply_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs DISABLE ROW LEVEL SECURITY;





