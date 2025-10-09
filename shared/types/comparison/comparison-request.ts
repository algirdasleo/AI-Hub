import z from "zod";
import { BaseStreamRequestSchema, ModelConfigSchema } from "../common/index.js";

export const ComparisonModelSchema = ModelConfigSchema;

export const ComparisonStreamSchema = BaseStreamRequestSchema.extend({
  models: z.array(ComparisonModelSchema).min(2, { error: "At least two models must be provided for comparison" }),
});

export type ComparisonStreamParams = z.infer<typeof ComparisonStreamSchema>;
