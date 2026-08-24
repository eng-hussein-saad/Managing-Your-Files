import nodemailer from "nodemailer";
import type { MailPort } from "../../modules/auth/ports/mail.port.js";

/** Creates an SMTP-backed verification-message adapter. */
export function createSmtpMailer(options: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}): MailPort {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    ...(options.user && options.password
      ? { auth: { user: options.user, pass: options.password } }
      : {}),
  });
  return {
    /** Sends the one-time code only to the intended recipient. */ sendVerification:
      async (message) => {
        await transport.sendMail({
          from: options.from,
          to: message.recipient,
          subject: "Verify your Fileora account",
          text: `Hello ${message.name},

Thank you for creating your Fileora account. Please use the verification code below to confirm your email address:

${message.code}

This code expires in 10 minutes. If you did not create this account, you can safely ignore this message.

Best,
The Fileora team`,
        });
      },
  };
}
