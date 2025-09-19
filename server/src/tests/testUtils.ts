import { vi, expect } from "vitest";

export const makeMockRes = () => ({
  write: vi.fn(),
  status: vi.fn().mockReturnThis(),
  end: vi.fn(),
  setHeader: vi.fn(),
});

export const getWrites = (res: any) =>
  res.write && res.write.mock ? res.write.mock.calls.map((c: any[]) => c[0]) : [];

export const expectSSEEvent = (res: any, eventName: string) => {
  const calls = getWrites(res);
  expect(calls.some((s: string) => s.includes(`event: ${eventName}`))).toBe(true);
};

export default { makeMockRes, getWrites, expectSSEEvent };
