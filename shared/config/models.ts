import { AIModel } from "./model-schemas";
import { AIProvider } from "./model-schemas";

export const MODELS: Record<string, AIModel> = {
  "gpt-5.2": {
    name: "GPT-5.2",
    id: "gpt-5.2",
    provider: AIProvider.OpenAI,
    maxTokens: 16384,
    contextWindow: 128000,
    description: "OpenAI's latest flagship model for reasoning and agentic tasks.",
  },
  "gpt-5.2-pro": {
    name: "GPT-5.2 Pro",
    id: "gpt-5.2-pro",
    provider: AIProvider.OpenAI,
    maxTokens: 16384,
    contextWindow: 128000,
    description: "High-performance GPT-5.2 for toughest tasks.",
  },
  "gpt-5.2-chat-latest": {
    name: "GPT-5.2 Chat",
    id: "gpt-5.2-chat-latest",
    provider: AIProvider.OpenAI,
    maxTokens: 16384,
    contextWindow: 128000,
    description: "Chat-optimized GPT-5.2 model.",
  },
  "gpt-5": {
    name: "GPT-5",
    id: "gpt-5",
    provider: AIProvider.OpenAI,
    maxTokens: 16384,
    contextWindow: 128000,
    description: "Previous GPT-5 full model.",
  },
  "gpt-5-mini": {
    name: "GPT-5 Mini",
    id: "gpt-5-mini",
    provider: AIProvider.OpenAI,
    maxTokens: 8192,
    contextWindow: 65536,
    description: "Smaller, cost-efficient GPT-5 variant.",
  },
  "gpt-5-nano": {
    name: "GPT-5 Nano",
    id: "gpt-5-nano",
    provider: AIProvider.OpenAI,
    maxTokens: 4096,
    contextWindow: 32768,
    description: "Fastest, lightweight GPT-5 model.",
  },

  "claude-opus-4-5": {
    name: "Claude Opus 4.5",
    id: "claude-opus-4-5",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Most capable Anthropic model for complex reasoning and coding.",
  },
  "claude-sonnet-4-5": {
    name: "Claude Sonnet 4.5",
    id: "claude-sonnet-4-5",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Balanced Claude 4.5 model for general tasks.",
  },
  "claude-haiku-4-5": {
    name: "Claude Haiku 4.5",
    id: "claude-haiku-4-5",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Fast and low-latency Claude 4.5 model.",
  },

  "gemini-3-pro-preview": {
    name: "Gemini 3 Pro Preview",
    id: "gemini-3-pro-preview",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576, // 1M tokens
    description:
      "Our latest reasoning-first model, optimized for complex agentic workflows, advanced reasoning, and state-of-the-art performance. (Preview)",
  },

  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    id: "gemini-2.5-pro",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576,
    description:
      "Google's state-of-the-art stable model for complex reasoning, coding, long-context analysis, and sophisticated multimodal tasks.",
  },

  // 3. The best price-performance model (Production workhorse)
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    id: "gemini-2.5-flash",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576,
    description:
      "Lightning-fast and highly capable. The best balance of intelligence, latency, and cost for high-volume, versatile applications.",
  },
};
