import { EventEmitter } from "events";

class VerificationEmitter extends EventEmitter {
  notifyVerification(userId: string, email: string) {
    this.emit("verification", { userId, email });
  }
}

export const verificationEmitter = new VerificationEmitter();
