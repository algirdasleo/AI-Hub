import z from "zod";

export const UidQuerySchema = z.object({
  uid: z.string().min(1),
});
