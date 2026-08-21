import type {
  MailPort,
  VerificationMessage,
} from "../../src/modules/auth/ports/mail.port.js";
/** Captures verification messages for deterministic tests. */
export class FakeMailer implements MailPort {
  readonly messages: VerificationMessage[] = [];
  shouldFail = false;
  /** Captures messages deterministically or simulates a provider outage. */
  sendVerification(message: VerificationMessage): Promise<void> {
    if (this.shouldFail)
      return Promise.reject(new Error("Simulated mail failure"));
    this.messages.push(message);
    return Promise.resolve();
  }
}
