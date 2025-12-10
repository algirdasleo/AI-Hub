import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIProvider } from "@shared/config/model-schemas.js";

process.env.JOB_TTL_SECONDS = "300";

describe("job-store", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createJob", () => {
    it("should create a job with TTL and return job ID", async () => {
      const { createJob } = await import("../job-store.js");

      const payload = {
        prompt: "test message",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      const jobId = await createJob(payload);

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe("string");
    });

    it("should create job without TTL when JOB_TTL_SECONDS is 0", async () => {
      process.env.JOB_TTL_SECONDS = "0";
      vi.resetModules();

      const { createJob } = await import("../job-store.js");

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      const jobId = await createJob(payload);

      expect(jobId).toBeDefined();

      process.env.JOB_TTL_SECONDS = "300";
    });
  });

  describe("getJob", () => {
    it("should retrieve a job by ID", async () => {
      const { createJob, getJob } = await import("../job-store.js");

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      const jobId = await createJob(payload);
      const retrieved = await getJob(jobId);

      expect(retrieved).toEqual(payload);
    });

    it("should return undefined for non-existent job", async () => {
      const { getJob } = await import("../job-store.js");
      const retrieved = await getJob("non-existent-id");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("deleteJob", () => {
    it("should delete a job", async () => {
      const { createJob, deleteJob, getJob } = await import("../job-store.js");

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      const jobId = await createJob(payload);
      await deleteJob(jobId);
      const retrieved = await getJob(jobId);

      expect(retrieved).toBeUndefined();
    });
  });
});
