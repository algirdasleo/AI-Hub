import { AIModel } from "./model-schemas";
import { AIProvider } from "./model-schemas";

export const MODELS: Record<string, AIModel> = {
  // OpenAI Models
  "gpt-5": {
    name: "GPT-5",
    id: "gpt-5",
    provider: AIProvider.OpenAI,
    maxTokens: 16384,
    contextWindow: 128000,
    description: "OpenAI's most advanced multimodal model, fast and affordable.",
  },
  "gpt-5-mini": {
    name: "GPT-5 Mini",
    id: "gpt-5-mini",
    provider: AIProvider.OpenAI,
    maxTokens: 8192,
    contextWindow: 65536,
    description: "Affordable and intelligent small model for fast, lightweight tasks.",
  },
  "gpt-5-nano": {
    name: "GPT-5 Nano",
    id: "gpt-5-nano",
    provider: AIProvider.OpenAI,
    maxTokens: 4096,
    contextWindow: 32768,
    description: "Compact and fast model suitable for quick tasks.",
  },
  "gpt-5-codex": {
    name: "GPT-5 Codex",
    id: "gpt-5-codex",
    provider: AIProvider.OpenAI,
    maxTokens: 8192,
    contextWindow: 65536,
    description: "Specialized in code generation and programming tasks.",
  },
  "gpt-5-chat-latest": {
    name: "GPT-5 Chat",
    id: "gpt-5-chat-latest",
    provider: AIProvider.OpenAI,
    maxTokens: 8192,
    contextWindow: 65536,
    description: "Optimized for dialogue and chat-based applications.",
  },

  // Anthropic Models
  "claude-opus-4-1": {
    name: "Claude Opus 4.1",
    id: "claude-opus-4-1",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Most intelligent Claude model - excellent for complex tasks.",
  },
  "claude-opus-4-0": {
    name: "Claude Opus 4.0",
    id: "claude-opus-4-0",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Powerful model for highly complex tasks.",
  },
  "claude-sonnet-4-0": {
    name: "Claude Sonnet 4.0",
    id: "claude-sonnet-4-0",
    provider: AIProvider.Anthropic,
    maxTokens: 4096,
    contextWindow: 200000,
    description: "Balanced intelligence and speed.",
  },
  "claude-3-7-sonnet-latest": {
    name: "Claude 3.7 Sonnet",
    id: "claude-3-7-sonnet-latest",
    provider: AIProvider.Anthropic,
    maxTokens: 4096,
    contextWindow: 200000,
    description: "High intelligence with efficient reasoning capabilities.",
  },
  "claude-3-5-haiku-latest": {
    name: "Claude 3.5 Haiku",
    id: "claude-3-5-haiku-latest",
    provider: AIProvider.Anthropic,
    maxTokens: 4096,
    contextWindow: 200000,
    description: "Fastest and most compact model for near-instant responsiveness.",
  },

  // Google Generative AI / Vertex Models
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash Exp",
    id: "gemini-2.0-flash-exp",
    provider: AIProvider.Google,
    maxTokens: 8192,
    contextWindow: 1000000,
    description: "Experimental Gemini 2.0 model with fast performance.",
  },
  "gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    id: "gemini-1.5-flash",
    provider: AIProvider.Google,
    maxTokens: 8192,
    contextWindow: 1000000,
    description: "Fast and versatile performance across diverse tasks.",
  },
  "gemini-1.5-pro": {
    name: "Gemini 1.5 Pro",
    id: "gemini-2.5-pro",
    provider: AIProvider.Google,
    maxTokens: 8192,
    contextWindow: 2000000,
    description: "Google's most capable model with 2M token context window.",
  },
};
