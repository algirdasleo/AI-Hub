import { Router } from "express";
import { authMiddleware } from "@server/middleware/index.js";
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  uploadDocumentHandler,
  deleteDocumentHandler,
  upload,
} from "./controller.js";

const router = Router();

router.post("/", authMiddleware, createProjectHandler);
router.get("/", authMiddleware, getProjectsHandler);
router.get("/:projectId", authMiddleware, getProjectHandler);
router.put("/:projectId", authMiddleware, updateProjectHandler);
router.delete("/:projectId", authMiddleware, deleteProjectHandler);

router.post("/:projectId/documents", authMiddleware, upload.single("file"), uploadDocumentHandler);
router.delete("/:projectId/documents/:documentId", authMiddleware, deleteDocumentHandler);

router.get("/:projectId/conversations", authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { getProjectConversations } = await import("./conversation-repository.js");
    const result = await getProjectConversations(projectId, userId);

    if (result.isSuccess) {
      return res.json(result.value);
    } else {
      return res.status(500).json({ error: result.error.message });
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/:projectId/conversations/:conversationId/messages", authMiddleware, async (req, res) => {
  const { projectId, conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { getProjectConversationMessages } = await import("./conversation-repository.js");
    const result = await getProjectConversationMessages(conversationId, projectId, userId);

    if (result.isSuccess) {
      const messages = result.value.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        parts: [
          {
            type: "text",
            text: msg.content || "",
          },
        ],
        stats: msg.stats && msg.stats.length > 0 ? msg.stats[0] : undefined,
      }));
      return res.json(messages);
    } else {
      return res.status(404).json({ error: result.error.message });
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:projectId/conversations", authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  const { title } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { createProjectConversation } = await import("./conversation-repository.js");
    const result = await createProjectConversation(projectId, userId, title);

    if (result.isSuccess) {
      return res.json(result.value);
    } else {
      return res.status(500).json({ error: result.error.message });
    }
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.delete("/:projectId/conversations/:conversationId", authMiddleware, async (req, res) => {
  const { projectId, conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { deleteProjectConversation } = await import("./conversation-repository.js");
    const result = await deleteProjectConversation(conversationId, projectId, userId);

    if (result.isSuccess) {
      return res.json({ success: true, message: "Conversation deleted" });
    } else {
      return res.status(404).json({ error: result.error.message });
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export const projectsRouter = router;
