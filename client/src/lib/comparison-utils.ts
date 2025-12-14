import type { ComparisonPrompt } from "@shared/types/comparison/conversation";
import type { ComparisonHistoryItem, ComparisonModel } from "@/hooks/useComparisonPanel";
import { MODELS } from "@shared/config/models";

export function transformComparisonPromptsToHistory(prompts: ComparisonPrompt[]): ComparisonHistoryItem[] {
  return prompts.map((prompt) => ({
    id: prompt.id,
    prompt: prompt.content,
    models: prompt.outputs.map((output) => {
      const modelConfig = MODELS[output.model];
      const model: ComparisonModel = {
        modelId: output.model,
        modelName: modelConfig?.name || output.model,
        provider: modelConfig?.provider || "",
        content: output.content,
        isLoading: false,
      };

      if (output.stats && output.stats.length > 0) {
        const statsData = output.stats[0];
        model.usage = {
          inputTokens: 0,
          outputTokens: statsData.tokens_used,
          totalTokens: statsData.tokens_used,
        };
        if (statsData.latency_ms !== null) {
          model.latencyMs = statsData.latency_ms;
        }
      }
      
      return model;
    }),
    timestamp: new Date(prompt.created_at),
    isComplete: true,
  }));
}
