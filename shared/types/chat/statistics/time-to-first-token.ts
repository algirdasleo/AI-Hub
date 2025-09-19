import z from "zod";

export const TimeToFirstTokenSchema = z.object({
  msToFirstToken: z.number().min(0).describe("Time to first token in milliseconds"),
});

export type TimeToFirstToken = z.infer<typeof TimeToFirstTokenSchema>;
