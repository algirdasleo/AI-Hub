import { Router } from "express";
import { validateBody } from "@server/middleware/validate-body.js";
import { ComparisonStreamSchema } from "@shared/types/comparison/comparison-request.js";

import { streamComparison } from "./controller.js";

const router = Router();

router.post("/", validateBody(ComparisonStreamSchema), streamComparison);

export { router as comparisonRouter };
