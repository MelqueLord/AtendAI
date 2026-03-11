# Manual do Sistema Atend.AI

Atualizado em: 10/03/2026

## 1. Visao geral

O Atend.AI e uma plataforma SaaS de atendimento com IA, CRM e operacao multi-tenant.

Hoje o sistema permite:

- autenticar usuarios com perfis diferentes
- operar atendimento em tempo real
- responder clientes com IA e escalar para humano
- manter historico completo das conversas
- cadastrar e importar contatos
- criar campanhas e disparos agendados
- registrar avaliacao do cliente
- visualizar metricas operacionais e comerciais
- gerenciar usuarios e empresas
- operar o canal WhatsApp pela plataforma ou abrir WhatsApp Web

Stack atual:

- frontend em React
- backend em .NET
- persistencia em Supabase
- IA via Groq quando configurada, com fallback local
- jobs em background para campanhas automaticas e disparos agendados

## 2. Estrutura do produto

O sistema esta dividido em tres grandes areas no menu lateral:

- Operacao
  - Atendimento
  - Configuracao da IA
- Relacionamento
  - CRM
  - WhatsApp
  - Comercial
- Administracao
  - Usuarios
  - Empresas

Tambem existem duas telas publicas antes do login:

- Planos
- Login

## 3. Perfis de acesso

### 3.1 Agent

Foco principal na operacao de atendimento.

Na interface atual, o Agent fica concentrado na tela de Atendimento.

Capacidades praticas:

- visualizar fila de conversas
- abrir conversa
- responder como humano
- registrar avaliacao do cliente na conversa

### 3.2 Admin

Perfil gerencial da empresa.

Capacidades praticas:

- tudo que o Agent faz
- configurar IA
- usar CRM
- abrir canais WhatsApp
- acompanhar plano e comercial
- criar e editar usuarios do proprio tenant

### 3.3 SuperAdmin

Perfil global da plataforma.

Capacidades praticas:

- tudo que o Admin faz
- alternar tenant ativo no topo
- gerenciar empresas
- gerenciar usuarios considerando contexto multi-tenant

## 4. Como entrar no sistema

### 4.1 Tela publica de planos

Objetivo:

- apresentar os planos disponiveis
- servir como porta de entrada comercial da plataforma

O que aparece:

- nome do plano
- preco mensal
- quantidade de conversas
- quantidade de agentes
- quantidade de numeros de WhatsApp incluidos

Como usar:

1. Abra a aplicacao.
2. Na tela inicial, revise os planos.
3. Clique em `Entrar na Plataforma` para ir ao login.

### 4.2 Tela de login

Objetivo:

- autenticar usuarios da plataforma

Campos:

- email corporativo
- senha

Como usar:

1. Informe email e senha.
2. Clique em `Entrar no Dashboard`.
3. O sistema carrega fila, metricas, configuracoes e modulos liberados para o seu perfil.

Observacoes:

- o login usa JWT com refresh token
- ha bloqueio temporario apos repetidas tentativas invalidas
- o token de acesso expira e pode ser renovado por refresh token

## 5. Dados de exemplo para teste

O script atual de banco inclui dados seed para facilitar testes.

Empresas seed:

- AutoPrime Oficina
- Studio Zen Pilates

Usuarios seed:

- `admin@autoprime.com`
- `suporte@autoprime.com`
- `admin@studiozen.com`
- `suporte@studiozen.com`
- `superadmin@atend.ai`

Senha de desenvolvimento utilizada no frontend:

- `Admin@123`

Planos seed:

- Trial 14 dias
- Starter
- Growth
- Scale

## 6. Estrutura de navegacao interna

Depois do login, a aplicacao exibe:

- topbar com contexto do workspace atual
- cartao do usuario logado
- seletor de tenant para SuperAdmin
- acao `Atualizar tudo`
- acao `Sair`
- menu lateral com os modulos
- 4 metricas globais no topo do conteudo

### 6.1 Metricas globais do topo

Cards atuais:

- `SLA <= 5 min`
- `FCR`
- `Tempo 1a resposta`
- `Conversao`

Como interpretar:

- SLA <= 5 min: percentual de conversas cuja primeira resposta saiu em ate 5 minutos
- FCR: percentual resolvido sem precisar de humano
- Tempo 1a resposta: media de tempo ate a primeira resposta
- Conversao: percentual de conversas com intencao de agendamento

## 7. Tela de Atendimento

Esta e a tela central da operacao.

### 7.1 O que a tela faz

- mostra a fila de conversas
- permite buscar por nome, telefone ou texto
- filtra conversas por status
- abre a conversa ativa
- exibe toda a timeline de mensagens
- permite resposta humana
- permite registrar avaliacao do cliente

### 7.2 Filtros disponiveis

- Todos
- Aguardando humano
- Em IA
- Em humano

### 7.3 Como usar a fila

1. Entre em `Atendimento`.
2. Use a busca para localizar um cliente.
3. Use os filtros para encontrar conversas aguardando humano.
4. Clique em um item da fila para abrir a conversa.

### 7.4 Conversa ativa

Ao abrir uma conversa, voce ve:

- nome do cliente
- telefone
- ultima atividade
- status da conversa
- historico de mensagens por remetente

Remetentes exibidos:

- Cliente
- IA
- Humano
- Sistema

### 7.5 Envio de resposta humana

Como usar:

1. Selecione a conversa.
2. Digite a resposta no campo de composicao.
3. Clique em enviar.

O que acontece no backend:

- a mensagem e gravada como `HumanAgent`
- o status vai para `HumanHandling`
- o sistema tenta enviar a resposta pelo WhatsApp configurado
- se o envio falhar, a conversa volta a aguardar humano

### 7.6 Avaliacao do cliente

Dentro da conversa existe um bloco de avaliacao.

Campos:

- nota de 1 a 5
- comentario opcional

Como usar:

1. Escolha a nota.
2. Preencha comentario se desejar.
3. Clique em `Registrar avaliacao`.

## 8. Como a IA responde hoje

O motor de resposta atual segue esta ordem:

1. verifica fluxos automaticos configurados no CRM
2. detecta mensagens complexas para handoff humano
3. verifica regras de treinamento da IA
4. tenta responder via Groq, se configurado
5. usa fallback local por intencao
6. se nada casar, usa a mensagem de boas-vindas configurada

### 8.1 Quando o sistema escala para humano

O handoff acontece quando:

- um fluxo automatico esta configurado para escalar
- a mensagem parece complexa
- a mensagem contem termos sensiveis como processo, reclamacao, judicial, urgente
- o texto e muito longo

Quando isso acontece:

- a conversa muda para `WaitingHuman`
- a plataforma registra uma notificacao para humano no log da aplicacao

## 9. Tela Configuracao da IA

Disponivel para:

- Admin
- SuperAdmin

### 9.1 O que a tela faz

- personaliza a identidade do atendimento
- define mensagem inicial
- define mensagem de fallback para humano
- cadastra regras simples de treinamento por palavra-chave

### 9.2 Bloco Personalizacao do atendimento

Campos:

- Nome do negocio
- Mensagem de boas-vindas
- Mensagem de handoff humano

Como usar:

1. Informe o nome da empresa como deve aparecer no atendimento.
2. Defina a saudacao inicial.
3. Defina a mensagem que sera usada quando a conversa precisar de humano.
4. Clique em `Salvar configuracoes`.

### 9.3 Bloco Treinamento da IA

Campos:

- Palavra-chave
- Resposta da IA

Como usar:

1. Informe a palavra ou gatilho.
2. Informe a resposta padrao.
3. Clique em `Adicionar regra`.

Boas praticas:

- use palavras-chave objetivas
- mantenha respostas curtas e reutilizaveis
- use placeholders como `{cliente}` e `{negocio}` quando fizer sentido

## 10. Tela CRM

Disponivel na interface para:

- Admin
- SuperAdmin

Objetivo:

- organizar base de clientes
- permitir campanhas e fluxos automatizados
- acompanhar fila descoberta e feedback

### 10.1 Resumo do modulo

Cards de topo:

- quantidade de contatos
- quantidade de campanhas
- quantidade de fluxos ativos
- quantidade de clientes sem atendimento

### 10.2 Cadastro manual de contato

Campos:

- Nome do contato
- WhatsApp
- UF
- Status da jornada
- Tags

Como usar:

1. Abra `CRM`.
2. No card `Cadastrar contato`, preencha os dados.
3. Clique em `Cadastrar contato`.

Tambem e possivel editar um contato existente:

1. Localize o contato na tabela.
2. Clique em `Editar`.
3. Atualize os dados.
4. Clique em `Salvar contato`.

### 10.3 Importacao rapida de contatos

Formato atual suportado:

`nome;telefone;estado;status;tag1,tag2`

Exemplo:

`Maria;5511999999999;SP;Cliente ativo;vip,pos-venda`

Como usar:

1. Cole uma linha por contato.
2. Clique em `Importar contatos`.

Observacao importante:

- hoje a importacao e por texto estruturado
- ainda nao existe integracao nativa com Gmail ou Google Contacts

### 10.4 Base de contatos

A tabela de contatos permite:

- busca por nome, telefone ou responsavel
- filtro por UF
- filtro por status
- filtro por tag
- selecao de contatos para campanha
- edicao
- exclusao

Como usar para montar uma lista:

1. Filtre por estado, status ou tag.
2. Marque os contatos desejados na coluna `Selecionar`.
3. Use essa selecao no card de campanhas.

### 10.5 Campanhas e disparos agendados

Objetivo:

- agendar uma mensagem para varios contatos

Campos:

- Nome da campanha
- Data e horario
- Filtro por tag
- Mensagem da campanha

Como usar:

1. Informe nome da campanha.
2. Defina data e horario.
3. Escolha uma tag ou selecione contatos manualmente.
4. Escreva a mensagem usando `{cliente}` se quiser personalizacao.
5. Clique em `Agendar disparo`.

O que acontece no backend:

- a campanha e gravada
- jobs individuais sao criados para os contatos alvo
- um worker em background processa os envios periodicamente

### 10.6 Fluxos de atendimento automatico

Objetivo:

- criar respostas estruturadas antes de cair no treinamento generico

Campos:

- Nome do fluxo
- Prioridade
- Palavras-chave
- Tratamento
- Status do fluxo
- Resposta automatica

Tratamento:

- `Resolver na IA`
- `Escalar para humano`

Como usar:

1. Crie um fluxo para uma intencao frequente.
2. Informe palavras-chave separadas por virgula.
3. Defina se a IA responde sozinha ou escala.
4. Ajuste a prioridade.
5. Clique em `Criar fluxo`.

Exemplo:

- Nome: `Agendamento inicial`
- Palavras-chave: `agendar, horario, consulta`
- Tratamento: `Resolver na IA`
- Resposta: `Claro, {cliente}. Me diga o melhor dia e horario.`

### 10.7 Fila de clientes aguardando atendimento

O CRM tambem mostra um bloco especifico de fila descoberta:

- cliente
- telefone
- status
- tempo de espera em minutos

Uso pratico:

- identificar gargalos
- priorizar retorno humano
- acompanhar clientes esquecidos na operacao

### 10.8 Avaliacoes registradas

O bloco de feedback mostra:

- cliente
- telefone
- data
- nota
- comentario

Uso pratico:

- acompanhar qualidade do atendimento
- identificar insatisfacoes
- medir percepcao do cliente por tenant

## 11. Tela WhatsApp

Disponivel na interface para:

- Admin
- SuperAdmin

Objetivo atual:

- servir apenas como tela de abertura do canal
- esconder configuracoes tecnicas

Esta tela nao mostra mais:

- webhook
- WABA
- token
- Meta App
- Embedded Signup
- configuracao tecnica da API

### 11.1 Card WhatsApp via API da Meta

O que faz:

- verifica se existe integracao Meta ativa para a empresa
- se estiver pronta, abre o atendimento interno da plataforma
- se nao estiver pronta, mostra uma mensagem simples de indisponibilidade

Como usar:

1. Clique em `Abrir na plataforma`.
2. Se a integracao Meta estiver ativa, o sistema leva voce para `Atendimento`.
3. Se nao estiver, a tela informa que a integracao nao esta configurada.

### 11.2 Card WhatsApp Web

O que faz:

- tenta abrir o WhatsApp Web dentro da aplicacao
- se o navegador bloquear iframe por CSP ou politica de seguranca, faz fallback para nova aba

Como usar:

1. Clique em `Abrir WhatsApp Web`.
2. Se a visualizacao interna funcionar, o WhatsApp Web abre em overlay.
3. Se houver bloqueio do navegador, a plataforma tenta abrir uma nova aba automaticamente.

## 12. Tela Comercial

Disponivel para:

- Admin
- SuperAdmin

Objetivo:

- mostrar plano atual
- mostrar valor entregue
- permitir upgrade ou troca de plano

### 12.1 Resumo da conta

Mostra:

- plano contratado
- status da assinatura
- fim do periodo atual
- fim do trial

### 12.2 Indicadores de eficiencia

Mostra:

- horas economizadas
- handoffs humanos
- receita protegida

Como esses numeros sao calculados:

- automacao e baseada no volume de conversas resolvidas sem humano
- horas economizadas usam estimativa media por atendimento automatizado
- receita protegida usa uma estimativa padrao por handoff

### 12.3 Portifolio de planos

Cada plano mostra:

- preco
- conversas incluidas
- agentes incluidos
- quantidade de WhatsApps permitidos

Como usar:

1. Entre em `Comercial`.
2. Compare os planos.
3. Clique em `Assinar plano` no plano desejado.

Impacto pratico:

- o limite de numeros de WhatsApp por tenant depende do plano

## 13. Tela Usuarios

Disponivel para:

- Admin
- SuperAdmin

Objetivo:

- controlar acessos gerenciais e operacionais

### 13.1 Criar usuario

Campos:

- Empresa
- Papel
- Nome do usuario
- Email
- Senha inicial ou nova senha

Observacoes:

- SuperAdmin pode escolher empresa
- Admin gerencia usuarios do proprio tenant
- papeis permitidos na criacao pela interface: `Admin` e `Agent`

### 13.2 Politica de senha

A senha precisa ter:

- minimo de 8 caracteres
- letra maiuscula
- letra minuscula
- numero
- simbolo

### 13.3 Tabela de usuarios

Permite:

- buscar por nome, email ou empresa
- filtrar por papel
- filtrar por empresa quando o perfil for SuperAdmin
- editar usuario
- excluir usuario

Regra importante:

- o sistema nao permite excluir o proprio usuario logado

## 14. Tela Empresas

Disponivel para:

- SuperAdmin

Objetivo:

- gerenciar tenants da plataforma

### 14.1 O que a tela faz

- cria empresas
- edita empresas
- remove empresas
- filtra por nome e segmento

Campos:

- Nome da empresa
- Segmento

Como usar:

1. Abra `Empresas`.
2. Preencha nome e segmento.
3. Clique em `Criar empresa`.

Tambem e possivel:

- editar uma empresa ja cadastrada
- excluir uma empresa
- filtrar por segmento

### 14.2 Alternancia de tenant

O SuperAdmin tambem pode alternar tenant no topo da aplicacao.

Como usar:

1. No topo, abra o seletor `Tenant ativo`.
2. Escolha a empresa desejada.
3. O sistema gera novo contexto autenticado para aquela empresa.

O que acontece:

- a sessao passa a operar no tenant selecionado
- fila, CRM, usuarios, plano e demais dados passam a refletir a empresa escolhida

## 15. Como o WhatsApp entra no fluxo real

Existem tres caminhos principais para o sistema lidar com mensagens:

### 15.1 Simulacao de mensagem

Endpoint existente:

- `POST /api/whatsapp/simulate`

Uso:

- testar atendimento sem WhatsApp real
- validar resposta da IA
- validar handoff

### 15.2 Webhook da Meta

Endpoints existentes:

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
- `GET /api/whatsapp/webhook/{tenantId}`
- `POST /api/whatsapp/webhook/{tenantId}`

Uso:

- receber mensagens reais da Cloud API
- responder automaticamente
- rotear por tenant

### 15.3 WhatsApp Web

Uso:

- abrir operacao rapida sem depender da tela tecnica
- trabalhar com fallback para nova aba

## 16. Historico de clientes e conversas

O sistema hoje registra:

- cliente
- telefone
- tenant
- historico completo de mensagens
- origem da resposta
- status da conversa
- feedback final do cliente

Fluxo automatico importante:

- quando chega uma mensagem nova, o sistema garante que o contato exista no CRM
- em seguida cria ou atualiza a conversa
- depois grava a mensagem do cliente
- depois gera a resposta da IA ou solicita humano

## 17. Campanhas automaticas e disparos

Hoje existem dois tipos de automacao relacionados a mensagens:

### 17.1 Fluxos automaticos do CRM

Disparam no momento da conversa com base em gatilhos.

Exemplo:

- cliente fala `orcamento`
- fluxo responde automaticamente

### 17.2 Disparos agendados do CRM

Sao campanhas agendadas para lista de contatos.

Exemplo:

- enviar mensagem de reativacao em uma data futura

### 17.3 Regras automaticas de campanhas por conversa

O backend tambem possui infraestrutura para campanhas pos-conversa em `D+24h`, `D+72h` e similares.

Importante:

- a infraestrutura existe no backend
- a interface principal hoje esta mais concentrada nos disparos do CRM

## 18. Multi-tenant

O sistema foi estruturado para operar com varias empresas.

Isso significa:

- cada empresa tem seus usuarios
- cada empresa tem seus contatos
- cada empresa tem suas conversas
- cada empresa tem seu plano
- cada empresa tem seus canais de WhatsApp
- cada empresa tem suas configuracoes de IA

Na pratica:

- Admin enxerga somente o tenant atual
- SuperAdmin pode trocar de tenant no topo

## 19. O que ja esta automatizado no backend

Mesmo quando nem tudo aparece em uma tela, o backend ja possui:

- autenticacao com refresh token
- troca de tenant para SuperAdmin
- persistencia multi-tenant
- webhook de WhatsApp
- simulacao de mensagens
- IA via Groq com fallback
- criacao automatica de contato ao receber mensagem
- agendamento de campanhas automaticas por conversa
- worker de disparos em background
- logs de mensagens WhatsApp
- cadastro e avaliacao de clientes

## 20. Fluxo recomendado de uso

### 20.1 Para implantar um novo cliente

1. Criar a empresa em `Empresas` se voce for SuperAdmin.
2. Criar usuarios em `Usuarios`.
3. Definir plano em `Comercial`.
4. Configurar a identidade da IA em `Configuracao da IA`.
5. Cadastrar fluxos automaticos no `CRM`.
6. Importar base de contatos no `CRM`.
7. Validar abertura do canal em `WhatsApp`.
8. Operar a fila em `Atendimento`.

### 20.2 Para operacao diaria

1. Abrir `Atendimento`.
2. Priorizar conversas `Aguardando humano`.
3. Revisar `CRM` para contatos, fila descoberta e feedback.
4. Programar disparos no `CRM` quando houver acao comercial.
5. Revisar `Comercial` para acompanhar consumo e plano.

## 21. Limitacoes atuais

No estado atual da aplicacao:

- a importacao por Gmail ainda nao esta implementada
- a notificacao para humano e feita por log interno, nao por central externa
- a tela operacional de WhatsApp nao configura credenciais tecnicas
- a interface principal privilegia Admin e SuperAdmin para modulos de gestao
- a infraestrutura de campanhas automaticas por conversa existe no backend, mas a operacao principal de campanhas hoje esta mais visivel no CRM

## 22. Resumo executivo do que o sistema e capaz de fazer hoje

Hoje o Atend.AI ja e capaz de:

- autenticar usuarios com perfis distintos
- operar multi-tenant
- responder clientes com IA
- escalar para humano quando necessario
- manter fila operacional em tempo real
- registrar historico de conversas
- cadastrar e importar contatos
- segmentar contatos por estado, status e tags
- criar campanhas agendadas para base de clientes
- registrar feedback do cliente
- medir SLA, FCR, primeira resposta e conversao
- controlar plano e capacidade comercial
- gerenciar usuarios
- gerenciar empresas
- abrir WhatsApp pela API da Meta ou WhatsApp Web

## 23. Observacao final

Este manual foi escrito com base na implementacao atual do sistema, cruzando frontend React, backend .NET e estrutura de banco atual. Se quiser, o proximo passo natural e eu transformar este manual em um material mais comercial e operacional, com:

- manual do administrador
- manual do atendente
- manual tecnico de implantacao
- roteiro de onboarding do cliente
