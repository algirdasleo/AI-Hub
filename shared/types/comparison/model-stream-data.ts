import z from "zod";
import { ErrorType } from "@shared/utils/index.js";

export const ModelStreamBaseDataSchema = z.strictObject({
  modelId: z.string().min(1),
  index: z.number().min(0),
});

export type ModelStreamBaseData = z.infer<typeof ModelStreamBaseDataSchema>;

export const ModelStreamFirstTokenDataSchema = ModelStreamBaseDataSchema.extend({
  ms: z.number().min(0),
});

export type ModelStreamFirstTokenData = z.infer<typeof ModelStreamFirstTokenDataSchema>;

export const ModelStreamTextDataSchema = ModelStreamBaseDataSchema.extend({
  text: z.string(),
});

export type ModelStreamTextData = z.infer<typeof ModelStreamTextDataSchema>;

export const ModelStreamErrorDataSchema = ModelStreamBaseDataSchema.extend({
  error: z.string(),
  errorType: z.enum(ErrorType),
});

export type ModelStreamErrorData = z.infer<typeof ModelStreamErrorDataSchema>;

export const ModelStreamDTO = z.discriminatedUnion("event", [
  z
    .strictObject({
      event: z.literal("model-text"),
    })
    .extend(ModelStreamTextDataSchema),

  z
    .strictObject({
      event: z.literal("model-first-token"),
    })
    .extend(ModelStreamFirstTokenDataSchema),
  z
    .strictObject({
      event: z.literal("model-error"),
    })
    .extend(ModelStreamErrorDataSchema),
]);
