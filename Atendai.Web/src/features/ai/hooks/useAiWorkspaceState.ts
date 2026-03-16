import { useState } from "react";
import type { BotSettings } from "@shared/types";

const emptySettingsDraft = {
  businessName: "",
  welcomeMessage: "",
  humanFallbackMessage: ""
};

export function useAiWorkspaceState() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState(emptySettingsDraft);
  const [trainingKeyword, setTrainingKeyword] = useState("");
  const [trainingAnswer, setTrainingAnswer] = useState("");

  function resetAiWorkspaceState() {
    setSettings(null);
    setSettingsDraft(emptySettingsDraft);
    setTrainingKeyword("");
    setTrainingAnswer("");
  }

  return {
    settings,
    setSettings,
    settingsDraft,
    setSettingsDraft,
    trainingKeyword,
    setTrainingKeyword,
    trainingAnswer,
    setTrainingAnswer,
    resetAiWorkspaceState
  };
}
