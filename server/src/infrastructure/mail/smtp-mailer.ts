import nodemailer from "nodemailer";
import type { MailPort } from "../../modules/auth/ports/mail.port.js";

/** Creates an SMTP-backed verification-message adapter. */
export function createSmtpMailer(options: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}): MailPort {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: { user: options.user, pass: options.password },
  });
  return {
    /** Sends the one-time code only to the intended recipient. */ sendVerification:
      async (message) => {
        await transport.sendMail({
          from: options.from,
          to: message.recipient,
          subject: "Verify your Gold Era account",
          text: `Hello ${message.name}, your verification code is ${message.code}. It expires at ${message.expiresAt.toISOString()}.`,
        });
      },
  };
}
