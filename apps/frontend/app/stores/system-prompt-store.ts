import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SystemPrompt } from "@athena/shared";

interface SystemPromptStore {
  selectedSystemPromptId: string | null;
  selectedSystemPrompt: SystemPrompt | null;
  setSelectedSystemPrompt: (promptId: string | null, prompt: SystemPrompt | null) => void;
  clearSelectedSystemPrompt: () => void;
}

export const useSystemPromptStore = create<SystemPromptStore>()(
  persist(
    (set) => ({
      selectedSystemPromptId: null,
      selectedSystemPrompt: null,
      setSelectedSystemPrompt: (promptId: string | null, prompt: SystemPrompt | null) =>
        set({ selectedSystemPromptId: promptId, selectedSystemPrompt: prompt }),
      clearSelectedSystemPrompt: () =>
        set({ selectedSystemPromptId: null, selectedSystemPrompt: null }),
    }),
    {
      name: "athena-system-prompt-selection",
      // Only persist the promptId to avoid stale data
      partialize: (state) => ({ 
        selectedSystemPromptId: state.selectedSystemPromptId,
      }),
    }
  )
);