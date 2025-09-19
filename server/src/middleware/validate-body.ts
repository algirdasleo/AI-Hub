import { NextFunction, Request, Response } from "express";
import z from "zod";

export function validateBody<T extends z.ZodType<unknown>>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: z.treeifyError(result.error) });
    }
    req.body = result.data;
    next();
  };
}
