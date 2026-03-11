# Atend.AI (Multi-tenant para qualquer negocio)

Plataforma de atendimento automatizado com IA, handoff para humano e dashboard operacional.

## O que mudou nesta versao

- Dominio refatorado para qualquer segmento (nao apenas clinicas)
- Isolamento por tenant (`tenant_id`) em login, conversas, treinamento, settings e analytics
- Banco recriado do zero com script de reset completo
- Dados de exemplo com 2 negocios (Automotivo e Fitness)

## Banco (reset total)

Execute no Supabase SQL Editor:

- [schema.sql](C:\Users\josemelque.santos\Documents\New project\backend\supabase\schema.sql)

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

Em [appsettings.json](C:\Users\josemelque.santos\Documents\New project\backend\appsettings.json):

- `MultiTenant:DefaultTenantId = 11111111-1111-1111-1111-111111111111`

Voce pode sobrescrever por header `X-Tenant-Id`.

## Rodando

Backend:

```bash
cd backend
dotnet run
```

Frontend:

```bash
cd frontend
npm run dev
```

## SuperAdmin e Switch de Tenant

Credencial de exemplo:
- superadmin@atend.ai / Admin@123

Endpoints:
- GET /api/admin/tenants (role SuperAdmin)
- POST /api/auth/switch-tenant (role SuperAdmin)

O frontend mostra um seletor de tenant no topo quando o usuario logado tem role SuperAdmin.

