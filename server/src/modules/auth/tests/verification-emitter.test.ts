import { describe, it, expect, vi } from "vitest";
import { verificationEmitter } from "../verification-emitter.js";

describe("verificationEmitter", () => {
  it("should notify verification", () => {
    const spy = vi.fn();
    verificationEmitter.on("verification", ({ userId, email }) => spy(userId, email));
    verificationEmitter.notifyVerification("user-id", "user@example.com");
    expect(spy).toHaveBeenCalledWith("user-id", "user@example.com");
  });

  it("should not call listeners after off", () => {
    const spy = vi.fn();
    const listener = ({ userId, email }: any) => spy(userId, email);
    verificationEmitter.on("verification", listener);
    verificationEmitter.off("verification", listener);
    verificationEmitter.notifyVerification("user-id", "user@example.com");
    expect(spy).not.toHaveBeenCalled();
  });
});
