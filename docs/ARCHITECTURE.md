# Arquitetura do Projeto

## API

A API agora foi organizada em camadas logicas para reduzir acoplamento e preparar a evolucao do sistema:

- Controllers
  - responsaveis apenas por HTTP, autorizacao, validacoes de entrada e traducao de respostas
  - dependem somente de interfaces da aplicacao
- Application
  - concentra contratos e casos de uso
  - interfaces em `Atendai.Application/Interfaces`
  - composicao de servicos em `Atendai.Application/DependencyInjection`
- Services
  - implementacoes dos casos de uso da aplicacao
  - os controllers nao dependem diretamente da persistencia
- Infrastructure
  - composicao da infraestrutura em `Atendai.Infrastructure/DependencyInjection`
  - repositórios por agregado implementados por `SupabaseDataStore`
  - integracoes externas e protecao de segredos registradas via DI

### Fluxo atual

`Controller -> Interface de Aplicacao -> Service -> Interface de Repositorio/Gateway -> Implementacao de Infraestrutura`

### Interfaces principais

- `IAuthService`
- `IConversationService`
- `ICrmService`
- `IAnalyticsService`
- `IBillingService`
- `ITenantWhatsAppService`
- `ICampaignAutomationService`
- `ISettingsService`
- `IManagementService`
- `IAdminService`

### Abstracoes de infraestrutura

- `IAuthRepository`
- `IConversationRepository`
- `IContactRepository`
- `IWhatsAppRepository`
- `IChatCompletionService`
- `IWhatsAppGateway`
- `ISecretProtector`
- `INotificationDispatcher`

## Web

O `Atendai.Web` foi reorganizado por dominio para facilitar escalabilidade, ownership por modulo e manutencao.

### Estrutura

- `src/app`
  - tipos compartilhados da aplicacao
  - constantes centrais do shell
- `src/domains/attendance`
- `src/domains/commercial`
- `src/domains/crm`
- `src/domains/users`
- `src/domains/whatsapp`
- `src/shared/ui`
  - primitives e componentes de apresentacao reutilizaveis

### Principios adotados

- componentes agrupados por dominio funcional
- UI compartilhada isolada em `shared`
- servicos especificos de dominio isolados em cada dominio
- `App.tsx` simplificado para orquestracao do shell e estado da aplicacao

## Proximos passos recomendados

1. eliminar o `IDataStore` transitorio restante e manter apenas repositórios especificos por agregado
2. introduzir testes unitarios por service e testes de integracao por controller
3. extrair hooks por dominio no frontend (`useAttendance`, `useCrm`, `useBilling`)
4. centralizar chamadas HTTP do frontend em clients por dominio
5. adicionar mapeadores DTO -> view model para reduzir acoplamento da UI com a API
