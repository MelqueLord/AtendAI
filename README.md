# Atend.AI (Multi-tenant para qualquer negocio)

Plataforma de atendimento automatizado com IA, handoff para humano e dashboard operacional.

## O que mudou nesta versao

- Dominio refatorado para qualquer segmento (nao apenas clinicas)
- Isolamento por tenant (`tenant_id`) em login, conversas, treinamento, settings e analytics
- Banco recriado do zero com script de reset completo
- Dados de exemplo com 2 negocios (Automotivo e Fitness)

## Banco (reset total)

Execute no Supabase SQL Editor:

- [schema.sql](/home/lordelo/Documentos/AtendAI/Atendai.Infrastructure/Data/Supabase/schema.sql)

Esse script:

- derruba tabelas antigas
- recria modelo multi-tenant
- insere dados de exemplo prontos para teste

## Credenciais de exemplo

Senha para todos: `Admin@123`

- `admin@autoprime.com` (Admin)
- `suporte@autoprime.com` (Agent)
- `admin@studiozen.com` (Admin)
- `suporte@studiozen.com` (Agent)

## Tenant default para testes sem login (simulate/webhook)

Em [appsettings.json](/home/lordelo/Documentos/AtendAI/Atendai.API/appsettings.json):

- `MultiTenant:DefaultTenantId = 11111111-1111-1111-1111-111111111111`

Voce pode sobrescrever por header `X-Tenant-Id`.

## Rodando

API:

```bash
cd /home/lordelo/Documentos/AtendAI
./.dotnet/dotnet run --project Atendai.API/Atendai.API.csproj --launch-profile http
```

Web:

```bash
cd Atendai.Web
npm run dev
```

Bridge QR experimental:

```bash
cd whatsapp-web-bridge
npm install
export BACKEND_CALLBACK_BASE_URL=http://localhost:5155
node server.mjs
```

## Novos fluxos de WhatsApp

- Meta oficial: o frontend agora suporta Embedded Signup da Meta. Preencha em `Atendai.API/appsettings.json`:
  - `MetaEmbeddedSignup:AppId`
  - `MetaEmbeddedSignup:AppSecret`
  - `MetaEmbeddedSignup:ConfigurationId`
- QR experimental: o backend agora consegue falar com uma bridge Node separada. Em `Atendai.API/appsettings.Development.json`:
  - `WhatsAppWebBridge:BaseUrl = http://localhost:3011`
  - `WhatsAppWebBridge:ApiKey` opcional

## Build local

- API: o projeto compila em `.NET 8` com o SDK local em `./.dotnet`
- Web: `npm run build`

## SuperAdmin e Switch de Tenant

Credencial de exemplo:
- superadmin@atend.ai / Admin@123

Endpoints:
- GET /api/admin/tenants (role SuperAdmin)
- POST /api/auth/switch-tenant (role SuperAdmin)

O frontend mostra um seletor de tenant no topo quando o usuario logado tem role SuperAdmin.
