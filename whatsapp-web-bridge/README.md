# WhatsApp Web Bridge

Bridge experimental para operar uma ou mais sessoes QR do WhatsApp Web dentro do CRM.

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
- `GET /sessions/:tenantId/:sessionId`
- `POST /sessions/:tenantId/start`
- `POST /sessions/:tenantId/:sessionId/restart`
- `POST /sessions/:tenantId/:sessionId/disconnect`
- `POST /sessions/:tenantId/:sessionId/sync-history`
- `POST /sessions/:tenantId/:sessionId/send`

## Observacao

Esse modulo e experimental e nao substitui a integracao oficial da Meta. Use quando precisar operar numeros adicionais por QR fora do fluxo Cloud API.
