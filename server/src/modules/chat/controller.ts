import { Response } from "express";
import z from "zod";
import { ChatStreamSchema } from "@shared/types/chat/index.js";
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
import { createChatJobPayload, executeChatStream } from "./service.js";
import { sendModelError } from "@server/lib/stream/helpers.js";
import { getUserConversations, getConversationMessages, deleteChatConversation } from "./repository.js";

const ChatJobSchema = ChatStreamSchema.extend({
  conversationId: z.string(),
});

export async function createChatJob(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const parseResult = ChatStreamSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendBadRequest(res, "Invalid chat request payload");
    }

    const jobResult = await createChatJobPayload(auth.userId, parseResult.data);
    if (!jobResult.isSuccess) {
      return sendInternalError(res, jobResult.error.message);
    }

    const { conversationId } = jobResult.value;
    const jobPayload = {
      ...parseResult.data,
      conversationId,
    };

    const jobId = await createJob(jobPayload);

    res.status(201).json({
      uid: jobId,
      conversationId: conversationId,
    });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function streamChatByUid(req: AuthRequest, res: Response) {
  const uid = getUidFromQuery(req);
  if (!uid) {
    return sendBadRequest(res, "Missing uid");
  }

  const job = await getJob(uid);
  if (!job) {
    return sendNotFound(res, "Job not found");
  }

  const parsedJob = ChatJobSchema.safeParse(job);
  if (!parsedJob.success) {
    return sendBadRequest(res, "Invalid job payload");
  }

  if (!req.user) {
    return sendUnauthorized(res);
  }

  const result = await executeChatStream(res, parsedJob.data, req.user.id);
  if (!result.isSuccess) {
    console.warn("Chat stream failed:", result.error.type, result.error.message);
    sendModelError(res, {
      modelId: parsedJob.data.modelId,
      error: result.error.message,
      errorType: result.error.type,
    });
  }

  try {
    await deleteJob(uid);
  } catch (error) {
    console.warn("Failed to delete job:", error);
  }
}

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const result = await getUserConversations(auth.userId);
    if (!result.isSuccess) {
      return sendInternalError(res, result.error.message);
    }

    res.status(200).json(result.value);
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const conversationId = req.params.conversationId;
    if (!conversationId) {
      return sendBadRequest(res, "Missing conversationId");
    }

    const result = await getConversationMessages(conversationId, auth.userId);
    if (!result.isSuccess) {
      if (result.error.type === "NotFound") {
        return sendNotFound(res, result.error.message);
      }
      return sendInternalError(res, result.error.message);
    }

    res.status(200).json(result.value);
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function deleteConversation(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const conversationId = req.params.conversationId;
    if (!conversationId) {
      return sendBadRequest(res, "Missing conversationId");
    }

    const result = await deleteChatConversation(conversationId, auth.userId);
    if (!result.isSuccess) {
      if (result.error.type === "NotFound") {
        return sendNotFound(res, result.error.message);
      }
      return sendInternalError(res, result.error.message);
    }

    res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}
