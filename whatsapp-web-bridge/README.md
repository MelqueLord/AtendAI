# WhatsApp Web Bridge

Bridge experimental para sessao QR dentro do CRM.

## Subir localmente

```bash
npm install
node server.mjs
```

## Variaveis opcionais

- `PORT`: porta HTTP da bridge. Padrao `3011`
- `SESSIONS_DIR`: pasta onde os estados de autenticacao serao gravados
- `ATENDAI_BRIDGE_API_KEY`: chave opcional validada no header `X-Atendai-Bridge-Key`
- `BACKEND_CALLBACK_BASE_URL`: URL base do backend .NET para entregar mensagens recebidas ao CRM
- `BACKEND_CALLBACK_KEY`: chave enviada ao backend no header `X-Atendai-Bridge-Key`
- `LOG_LEVEL`: nivel de log do servidor
- `BAILEYS_LOG_LEVEL`: nivel de log do cliente Baileys

## Endpoints

- `GET /health`
- `GET /sessions/:tenantId`
- `POST /sessions/:tenantId/start`
- `POST /sessions/:tenantId/restart`
- `POST /sessions/:tenantId/disconnect`
- `POST /sessions/:tenantId/send`

## Observacao

Esse modulo e experimental e nao substitui a integracao oficial da Meta. Use quando precisar de uma sessao QR pareada fora do fluxo Cloud API.
