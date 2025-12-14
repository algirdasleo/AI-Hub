import z from "zod";
import { ErrorType } from "@shared/utils/index.js";
import { EventType } from "@shared/types/core/index.js";

export const ModelStreamBaseDataSchema = z.strictObject({
  modelId: z.string().min(1),
});

export type ModelStreamBaseData = z.infer<typeof ModelStreamBaseDataSchema>;

export const ModelStreamLatencyDataSchema = ModelStreamBaseDataSchema.extend({
  ms: z.number().min(0),
});

export type ModelStreamLatencyData = z.infer<typeof ModelStreamLatencyDataSchema>;

export const ModelStreamTextDataSchema = ModelStreamBaseDataSchema.extend({
  text: z.string(),
});

export type ModelStreamTextData = z.infer<typeof ModelStreamTextDataSchema>;

export const ModelStreamErrorDataSchema = ModelStreamBaseDataSchema.extend({
  error: z.string(),
  errorType: z.enum(ErrorType),
});

export type ModelStreamErrorData = z.infer<typeof ModelStreamErrorDataSchema>;

export const ModelStreamUsageDataSchema = ModelStreamBaseDataSchema.extend({
  inputTokens: z.number().min(0),
  outputTokens: z.number().min(0),
  totalTokens: z.number().min(0),
});

export type ModelStreamUsageData = z.infer<typeof ModelStreamUsageDataSchema>;

export const ModelStreamDTO = z.discriminatedUnion("event", [
  z.strictObject({
    event: z.literal(EventType.TEXT),
    ...ModelStreamTextDataSchema.shape,
  }),

  z.strictObject({
    event: z.literal(EventType.LATENCY_MS),
    ...ModelStreamLatencyDataSchema.shape,
  }),
  z.strictObject({
    event: z.literal(EventType.ERROR),
    ...ModelStreamErrorDataSchema.shape,
  }),
]);
