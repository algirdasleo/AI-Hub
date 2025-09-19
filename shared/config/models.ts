import { AIModel } from "./model-schemas.js";
import { AIProvider } from "./model-schemas.js";

export const MODELS: Record<string, AIModel> = {
  // OpenAI Models
  "gpt-5": {
    name: "GPT-5",
    id: "gpt-5",
    provider: AIProvider.OpenAI,
    maxTokens: 128000,
    contextWindow: 400000,
    description: "OpenAI's most advanced model, excelling in complex reasoning and code generation.",
  },
  "gpt-5-mini": {
    name: "GPT-5 Mini",
    id: "gpt-5-mini",
    provider: AIProvider.OpenAI,
    maxTokens: 128000,
    contextWindow: 400000,
    description: "A smaller, faster version of GPT-5, optimized for real-time applications.",
  },
  "gpt-5-nano": {
    name: "GPT-5 Nano",
    id: "gpt-5-nano",
    provider: AIProvider.OpenAI,
    maxTokens: 128000,
    contextWindow: 400000,
    description: "Lightweight model designed for quick interactions with reduced latency.",
  },
  "gpt-5-chat-latest": {
    name: "GPT-5 Chat",
    id: "gpt-5-chat",
    provider: AIProvider.OpenAI,
    maxTokens: 128000,
    contextWindow: 400000,
    description: "Optimized for conversational AI, providing interactive dialogue capabilities.",
  },

  // Anthropic Models
  "claude-opus-4-latest": {
    name: "Claude Opus 4",
    id: "claude-opus-4-20250514",
    provider: AIProvider.Anthropic,
    maxTokens: 32000,
    contextWindow: 200000,
    description: "Anthropic's most powerful model, designed for complex tasks requiring extended reasoning.",
  },
  "claude-sonnet-4-latest": {
    name: "Claude Sonnet 4",
    id: "claude-sonnet-4-20250514",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "A versatile model suitable for coding and problem-solving applications.",
  },
  "claude-3-7-sonnet-latest": {
    name: "Claude 3.7 Sonnet",
    id: "claude-3-7-sonnet-20250219",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Advanced model with enhanced reasoning capabilities.",
  },
  "claude-3-5-sonnet-latest": {
    name: "Claude 3.5 Sonnet",
    id: "claude-3-5-sonnet-20241022",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Reliable model for various tasks, offering a balance between performance and efficiency.",
  },
  "claude-3-5-haiku-latest": {
    name: "Claude 3.5 Haiku",
    id: "claude-3-5-haiku-20241022",
    provider: AIProvider.Anthropic,
    maxTokens: 8192,
    contextWindow: 200000,
    description: "Fastest Claude model optimized for quick responses.",
  },

  // Google Gemini Models
  "gemini-2-5-pro": {
    name: "Gemini 2.5 Pro",
    id: "gemini-2-5-pro",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576,
    description: "Google's flagship model, excelling in coding and complex tasks with multimodality.",
  },
  "gemini-2-5-flash": {
    name: "Gemini 2.5 Flash",
    id: "gemini-2-5-flash",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576,
    description: "Optimized for speed, suitable for real-time applications and quick responses.",
  },
  "gemini-2-5-flash-lite": {
    name: "Gemini 2.5 Flash Lite",
    id: "gemini-2-5-flash-lite",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 1048576,
    description: "A lighter version of Flash, balancing performance and efficiency.",
  },
  "gemini-3-0-nano": {
    name: "Gemini 3.0 Nano",
    id: "gemini-3-0-nano",
    provider: AIProvider.Google,
    maxTokens: 32000,
    contextWindow: 32000,
    description: "Compact model designed for on-device low-latency tasks.",
  },
  "gemini-3-0-micro": {
    name: "Gemini 3.0 Micro",
    id: "gemini-3-0-micro",
    provider: AIProvider.Google,
    maxTokens: 65536,
    contextWindow: 128000,
    description: "Specialized model for fine-tuned, task-specific performance.",
  },
};
