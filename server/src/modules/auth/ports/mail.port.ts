export interface VerificationMessage {
  recipient: string;
  name: string;
  code: string;
  expiresAt: Date;
}
export interface MailPort {
  sendVerification(message: VerificationMessage): Promise<void>;
}
