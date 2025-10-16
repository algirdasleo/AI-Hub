import { vi, expect } from "vitest";
import { Response } from "express";

type MockResponse = {
  write: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  flushHeaders: ReturnType<typeof vi.fn>;
};

export const makeMockRes = (): MockResponse => ({
  write: vi.fn(),
  status: vi.fn().mockReturnThis(),
  end: vi.fn(),
  setHeader: vi.fn(),
  flushHeaders: vi.fn(),
});

export const getWrites = (res: MockResponse): string[] =>
  res.write && res.write.mock ? res.write.mock.calls.map((c: unknown[]) => c[0] as string) : [];

export const expectSSEEvent = (res: MockResponse, eventName: string): void => {
  const calls = getWrites(res);
  expect(calls.some((s: string) => s.includes(`event: ${eventName}`))).toBe(true);
};

export default { makeMockRes, getWrites, expectSSEEvent };
