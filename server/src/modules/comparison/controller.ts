import { Response } from "express";
import z from "zod";
import { ModelStreamErrorData } from "@shared/types/comparison/model-stream-data.js";
import { ComparisonStreamSchema } from "@shared/types/comparison/comparison-request.js";
import {
  GetComparisonConversationsResponseDTO,
  GetComparisonPromptsResponseDTO,
} from "@shared/types/comparison/conversation.js";
import { sendModelError } from "@server/lib/stream/helpers.js";
import { createJob, getJob, deleteJob } from "@server/lib/job-store.js";
import { AuthRequest } from "@server/modules/auth/index.js";
import {
  sendUnauthorized,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  validateAuth,
  getUidFromQuery,
} from "@server/utils/index.js";
import { createComparisonJobPayload, executeComparisonStream } from "./service.js";
import { getUserComparisonConversations, getComparisonConversationPrompts } from "./repository.js";

const ComparisonJobSchema = ComparisonStreamSchema.extend({
  conversationId: z.string(),
  promptId: z.string(),
});

type ComparisonJobPayload = z.infer<typeof ComparisonJobSchema>;

export async function createComparisonJob(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const parseResult = ComparisonStreamSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendBadRequest(res, "Invalid comparison request payload");
    }

    const jobResult = await createComparisonJobPayload(auth.userId, parseResult.data);
    if (!jobResult.isSuccess) {
      return sendInternalError(res, jobResult.error.message);
    }

    const { conversationId, promptId } = jobResult.value;
    const jobPayload: ComparisonJobPayload = {
      ...parseResult.data,
      conversationId,
      promptId,
    };

    const uid = await createJob(jobPayload);
    res.status(201).json({ uid });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function streamComparisonByUid(req: AuthRequest, res: Response) {
  const uid = getUidFromQuery(req);
  if (!uid) {
    return sendBadRequest(res, "Missing uid");
  }

  const job = await getJob(uid);
  if (!job) {
    return sendNotFound(res, "Job not found");
  }

  const parsedJob = ComparisonJobSchema.safeParse(job);
  if (!parsedJob.success) {
    return sendBadRequest(res, "Invalid job payload");
  }

  if (!req.user) {
    return sendUnauthorized(res);
  }

  const result = await executeComparisonStream(res, parsedJob.data, req.user.id);

  if (!result.isSuccess) {
    sendModelError(res, {
      modelId: "server",
      error: result.error.message,
      errorType: result.error.type,
    } as ModelStreamErrorData);
    res.end();
  }

  try {
    await deleteJob(uid);
  } catch (error) {
    console.warn("Failed to delete job:", error);
  }
}

export async function getComparisonConversations(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const result = await getUserComparisonConversations(auth.userId);
    if (!result.isSuccess) {
      return sendInternalError(res, result.error.message);
    }

    const response: GetComparisonConversationsResponseDTO = result.value;
    res.status(200).json(response);
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function getComparisonMessages(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const conversationId = req.params.conversationId;
    if (!conversationId) {
      return sendBadRequest(res, "Missing conversationId");
    }

    const result = await getComparisonConversationPrompts(conversationId, auth.userId);
    if (!result.isSuccess) {
      if (result.error.type === "NotFound") {
        return sendNotFound(res, result.error.message);
      }
      return sendInternalError(res, result.error.message);
    }

    const response: GetComparisonPromptsResponseDTO = result.value;
    res.status(200).json(response);
  } catch (error) {
    sendInternalError(res, String(error));
  }
}
