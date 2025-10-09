import crypto from "crypto";
import { Redis } from "ioredis";
import type { ChatStreamParams } from "@shared/types/chat/index.js";
import type { ComparisonStreamParams } from "@shared/types/comparison/comparison-request.js";

type JobPayload = ChatStreamParams | ComparisonStreamParams;

const REDIS_URL = process.env.REDIS_URL;
const JOB_TTL = Number(process.env.JOB_TTL_SECONDS ?? "300");

if (!REDIS_URL) {
  throw new Error("REDIS_URL must be set for job-store");
}

let redis: Redis;

try {
  const client = new Redis(REDIS_URL);
  redis = client;
  redis.on("error", (error) => console.warn("job-store redis error", error));
} catch (err) {
  throw new Error(`Failed to initialize Redis job-store: ${String(err)}`);
}

const keyFor = (id: string) => `job:${id}`;

export async function createJob(payload: JobPayload): Promise<string> {
  const id = crypto.randomUUID();
  const key = keyFor(id);
  const raw = JSON.stringify(payload);

  try {
    if (JOB_TTL > 0) {
      await redis.set(key, raw, "EX", JOB_TTL);
    } else {
      await redis.set(key, raw);
    }

    return id;
  } catch (err) {
    throw new Error(`Redis createJob failed: ${String(err)}`);
  }
}

export async function getJob(id: string): Promise<JobPayload | undefined> {
  const key = keyFor(id);
  try {
    const raw = await redis.get(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as JobPayload;
  } catch (error) {
    throw new Error(`Redis getJob failed: ${String(error)}`);
  }
}

export async function deleteJob(id: string): Promise<void> {
  const key = keyFor(id);
  try {
    await redis.del(key);
  } catch (error) {
    throw new Error(`Redis deleteJob failed: ${String(error)}`);
  }
}
