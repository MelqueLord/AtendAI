import { api } from "@infrastructure/http/api";
import type { BotSettings } from "@shared/types";

export function fetchBotSettings(token: string) {
  return api.get<BotSettings>("/settings", { token });
}

export function updateBotSettings(
  token: string,
  payload: {
    businessName: string;
    welcomeMessage: string;
    humanFallbackMessage: string;
  }
) {
  return api.put<BotSettings>("/settings", payload, { token });
}

export function createTrainingEntry(token: string, keyword: string, answerTemplate: string) {
  return api.post<null>("/settings/training", { keyword, answerTemplate }, { token });
}
