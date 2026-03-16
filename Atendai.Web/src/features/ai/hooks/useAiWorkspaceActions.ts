import { createTrainingEntry, updateBotSettings } from "@features/ai/services/aiService";
import { resolveApiErrorMessage } from "@shared/utils/http";
import type { AuthResponse } from "@shared/types";

type UseAiWorkspaceActionsParams = {
  auth: AuthResponse | null;
  canManage: boolean;
  settingsDraft: {
    businessName: string;
    welcomeMessage: string;
    humanFallbackMessage: string;
  };
  trainingKeyword: string;
  trainingAnswer: string;
  setTrainingKeyword: (value: string) => void;
  setTrainingAnswer: (value: string) => void;
  loadSettings: (token?: string, role?: string) => Promise<void>;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
};

export function useAiWorkspaceActions({
  auth,
  canManage,
  settingsDraft,
  trainingKeyword,
  trainingAnswer,
  setTrainingKeyword,
  setTrainingAnswer,
  loadSettings,
  setNotice,
  setError
}: UseAiWorkspaceActionsParams) {
  async function saveSettings() {
    if (!auth || !canManage) {
      return;
    }

    try {
      await updateBotSettings(auth.token, settingsDraft);
      await loadSettings();
      setNotice("Configuracoes atualizadas.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar configuracoes."));
    }
  }

  async function addTrainingEntry() {
    if (!auth || !canManage || !trainingKeyword.trim() || !trainingAnswer.trim()) {
      return;
    }

    try {
      await createTrainingEntry(auth.token, trainingKeyword, trainingAnswer);
      setTrainingKeyword("");
      setTrainingAnswer("");
      await loadSettings();
      setNotice("Regra de treinamento adicionada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao adicionar treinamento."));
    }
  }

  return {
    saveSettings,
    addTrainingEntry
  };
}
