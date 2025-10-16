import type { ComparisonPrompt } from "@shared/types/comparison/conversation";
import type { ComparisonHistoryItem } from "@/hooks/useComparisonPanel";

/**
 * Transforms ComparisonPrompt data from the backend into ComparisonHistoryItem format
 * for display in the UI
 */
export function transformComparisonPromptsToHistory(prompts: ComparisonPrompt[]): ComparisonHistoryItem[] {
  return prompts.map((prompt) => ({
    id: prompt.id,
    prompt: prompt.content,
    models: prompt.outputs.map((output) => ({
      modelId: output.model,
      modelName: output.model,
      provider: "",
      content: output.content,
      isLoading: false,
    })),
    timestamp: new Date(prompt.created_at),
    isComplete: true,
  }));
}
