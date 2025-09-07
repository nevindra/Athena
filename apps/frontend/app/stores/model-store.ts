import type { AIConfiguration } from "@athena/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ModelStore {
  selectedModelId: string | null;
  selectedModel: AIConfiguration | null;
  setSelectedModel: (modelId: string, model: AIConfiguration) => void;
  clearSelectedModel: () => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      selectedModelId: null,
      selectedModel: null,
      setSelectedModel: (modelId: string, model: AIConfiguration) =>
        set({ selectedModelId: modelId, selectedModel: model }),
      clearSelectedModel: () =>
        set({ selectedModelId: null, selectedModel: null }),
    }),
    {
      name: "athena-model-selection",
      // Only persist the modelId and basic model info to avoid stale data
      partialize: (state) => ({
        selectedModelId: state.selectedModelId,
      }),
    }
  )
);
