# Atend.AI

Plataforma multi-tenant de atendimento com IA, handoff humano, CRM, billing e operacao de canais WhatsApp.

## Stack

- Backend: ASP.NET 8 com camadas `API`, `Application`, `Domain` e `Infrastructure`
- Frontend: React 18, TypeScript, Vite e Tailwind CSS
- Banco: Supabase
- Integracoes: WhatsApp Cloud API, Groq e bridge QR em Node.js

## Estrutura do repositorio

```text
Atendai.API/             API HTTP + SignalR
Atendai.Application/     Casos de uso e regras de negocio
Atendai.Domain/          Entidades e contratos de dominio
Atendai.Infrastructure/  Supabase, integrações externas e workers
Atendai.Web/             Frontend React
whatsapp-web-bridge/     Bridge QR experimental
scripts/                 Scripts auxiliares para build e execucao
```

## Documentacao principal

- Produto e regras: [docs/MANUAL_DO_SISTEMA.md](docs/MANUAL_DO_SISTEMA.md)
- Arquitetura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Guia tecnico do backend: [docs/BACKEND_ENGINEERING_GUIDE.md](docs/BACKEND_ENGINEERING_GUIDE.md)
- CI do backend: [.github/workflows/backend-quality.yml](.github/workflows/backend-quality.yml)
- Schema do banco: [Atendai.Infrastructure/Data/Supabase/schema.sql](Atendai.Infrastructure/Data/Supabase/schema.sql)

## Como rodar localmente

### Backend

Com o .NET 8 instalado:

```bash
dotnet build Atendai.API/Atendai.API.csproj
dotnet run --project Atendai.API/Atendai.API.csproj
```

A API sobe por padrao em `http://localhost:5155` no ambiente de desenvolvimento.

Se preferir usar os scripts do projeto:

```bash
bash ./scripts/build-api.sh
bash ./scripts/run-api.sh
```

Testes uteis do backend:

```bash
dotnet test Atendai.Domain.Tests/Atendai.Domain.Tests.csproj
dotnet test Atendai.Application.Tests/Atendai.Application.Tests.csproj
```

### Frontend

```bash
cd Atendai.Web
npm install
npm run dev
```

Scripts uteis no frontend:

```bash
npm run typecheck
npm run build
npm run check
```

### Bridge QR experimental

```bash
cd whatsapp-web-bridge
npm install
node server.mjs
```

## Configuracao

Antes de rodar, ajuste as configuracoes locais da API com suas credenciais:

- `Atendai.API/appsettings.json`
- `Atendai.API/appsettings.Development.json`

Os arquivos de configuracao locais estao ignorados pelo Git.

## Dados de desenvolvimento

O script [schema.sql](Atendai.Infrastructure/Data/Supabase/schema.sql) recria o banco e insere dados de exemplo para testes locais.

Credenciais seed atuais:

- `superadmin@atend.ai` / `Admin@123`
- `admin@autoprime.com` / `Admin@123`
- `suporte@autoprime.com` / `Admin@123`
- `admin@studiozen.com` / `Admin@123`
- `suporte@studiozen.com` / `Admin@123`

## Estado atual do frontend

O frontend esta em processo de desacoplamento por dominio. A organizacao principal hoje segue esta ideia:

- `src/app`: composicao da aplicacao, providers, shell e sessao
- `src/features`: telas e services por dominio
- `src/shared`: tipos, utilitarios e componentes reutilizaveis
- `src/infrastructure`: cliente HTTP, realtime e configuracao

## Qualidade

O projeto hoje usa verificacao estaticas no frontend via TypeScript estrito. O proximo passo natural de maturidade e ampliar a cobertura com testes automatizados por dominio.



