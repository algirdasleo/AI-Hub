import crypto from "crypto";
import type { ChatStreamParams } from "@shared/types/chat/index.js";
import type { ComparisonStreamParams } from "@shared/types/comparison/comparison-request.js";

type JobPayload = ChatStreamParams | ComparisonStreamParams;

const JOB_TTL = Number(process.env.JOB_TTL_SECONDS ?? "300");

const jobStore = new Map<string, { payload: JobPayload; expiresAt?: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of jobStore.entries()) {
    if (value.expiresAt && value.expiresAt < now) {
      jobStore.delete(key);
    }
  }
}, 60000); // Check every minute

const keyFor = (id: string) => `job:${id}`;

export async function createJob(payload: JobPayload): Promise<string> {
  const id = crypto.randomUUID();
  const key = keyFor(id);
  
  const expiresAt = JOB_TTL > 0 ? Date.now() + JOB_TTL * 1000 : undefined;
  jobStore.set(key, { payload, expiresAt });

  return id;
}

export async function getJob(id: string): Promise<JobPayload | undefined> {
  const key = keyFor(id);
  const job = jobStore.get(key);
  
  if (!job) return undefined;
  
  if (job.expiresAt && job.expiresAt < Date.now()) {
    jobStore.delete(key);
    return undefined;
  }
  
  return job.payload;
}

export async function deleteJob(id: string): Promise<void> {
  const key = keyFor(id);
  jobStore.delete(key);
}
