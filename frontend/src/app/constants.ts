import type { AppPage } from "./types";

export const contactStatusOptions = [
  "Novo lead",
  "Lead quente",
  "Lead frio",
  "Em atendimento",
  "Agendado",
  "Pos-venda",
  "Cliente ativo",
  "Inativo"
];

export const stateOptions = ["", "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];

export const campaignDelayOptions = [
  { value: 1, label: "1 hora" },
  { value: 4, label: "4 horas" },
  { value: 24, label: "24 horas" },
  { value: 72, label: "72 horas" },
  { value: 168, label: "7 dias" }
];

export const automationPriorityOptions = [1, 2, 3, 4, 5];

export const pageMeta: Record<AppPage, { title: string; description: string }> = {
  ATTENDANCE: {
    title: "Atendimento",
    description: "Acompanhe a fila, assuma conversas e responda clientes em tempo real."
  },
  AI: {
    title: "Configuracao da IA",
    description: "Personalize a experiencia automatica, boas-vindas, handoff e regras de treinamento."
  },
  CRM: {
    title: "CRM",
    description: "Gerencie contatos, campanhas, fluxos automaticos, fila descoberta e avaliacoes."
  },
  WHATSAPP: {
    title: "WhatsApp",
    description: "Abra o canal da operacao via API da Meta ou pelo WhatsApp Web, sem expor configuracoes tecnicas."
  },
  COMMERCIAL: {
    title: "Comercial",
    description: "Visualize plano atual, indicadores de valor e opcoes de monetizacao."
  },
  USERS: {
    title: "Usuarios",
    description: "Cadastre, edite e remova usuarios gerenciais e operacionais da empresa."
  },
  COMPANIES: {
    title: "Empresas",
    description: "Gerencie tenants, segmentos e estrutura multiempresa da plataforma."
  }
};
