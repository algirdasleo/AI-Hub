import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Redis } from "ioredis";
import { AIProvider } from "@shared/config/model-schemas.js";

vi.mock("ioredis", () => {
  const mockRedis = {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
  };
  return {
    Redis: vi.fn(() => mockRedis),
  };
});

process.env.REDIS_URL = "redis://localhost:6379";
process.env.JOB_TTL_SECONDS = "300";

describe("job-store", () => {
  let mockRedisInstance: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const RedisConstructor = Redis as any;
    mockRedisInstance = new RedisConstructor();

    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createJob", () => {
    it("should create a job with TTL and return job ID", async () => {
      const { createJob } = await import("../job-store.js");

      mockRedisInstance.set.mockResolvedValue("OK");

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
      expect(mockRedisInstance.set).toHaveBeenCalledWith(`job:${jobId}`, JSON.stringify(payload), "EX", 300);
    });

    it("should create job without TTL when JOB_TTL_SECONDS is 0", async () => {
      process.env.JOB_TTL_SECONDS = "0";
      vi.resetModules();

      const { createJob } = await import("../job-store.js");
      mockRedisInstance.set.mockResolvedValue("OK");

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      const jobId = await createJob(payload);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(`job:${jobId}`, JSON.stringify(payload));

      process.env.JOB_TTL_SECONDS = "300";
    });

    it("should throw error if Redis set fails", async () => {
      const { createJob } = await import("../job-store.js");

      mockRedisInstance.set.mockRejectedValue(new Error("Redis connection failed"));

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      await expect(createJob(payload)).rejects.toThrow("Redis createJob failed");
    });
  });

  describe("getJob", () => {
    it("should retrieve a job by ID", async () => {
      const { getJob } = await import("../job-store.js");

      const payload = {
        prompt: "test",
        useWebSearch: false,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        conversationId: "conv-123",
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(payload));

      const result = await getJob("test-job-id");

      expect(mockRedisInstance.get).toHaveBeenCalledWith("job:test-job-id");
      expect(result).toEqual(payload);
    });

    it("should return undefined when job not found", async () => {
      const { getJob } = await import("../job-store.js");

      mockRedisInstance.get.mockResolvedValue(null);

      const result = await getJob("non-existent-id");

      expect(result).toBeUndefined();
    });

    it("should throw error if Redis get fails", async () => {
      const { getJob } = await import("../job-store.js");

      mockRedisInstance.get.mockRejectedValue(new Error("Redis error"));

      await expect(getJob("test-id")).rejects.toThrow("Redis getJob failed");
    });
  });

  describe("deleteJob", () => {
    it("should delete a job by ID", async () => {
      const { deleteJob } = await import("../job-store.js");

      mockRedisInstance.del.mockResolvedValue(1);

      await deleteJob("test-job-id");

      expect(mockRedisInstance.del).toHaveBeenCalledWith("job:test-job-id");
    });

    it("should throw error if Redis del fails", async () => {
      const { deleteJob } = await import("../job-store.js");

      mockRedisInstance.del.mockRejectedValue(new Error("Redis error"));

      await expect(deleteJob("test-id")).rejects.toThrow("Redis deleteJob failed");
    });
  });
});
