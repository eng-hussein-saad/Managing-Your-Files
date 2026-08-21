import type {
  RegisterRequest,
  SafeUser,
  VerifyEmailRequest,
} from "@gold-era/contracts/public";
import { expressClient } from "../../../lib/api/express-client";
interface Envelope<T> {
  success: true;
  data: T;
}
/** Registers a normalized unverified account through the public authority. */
export async function registerAccount(input: RegisterRequest) {
  const response = await expressClient.post<
    Envelope<{ email: string; verificationRequired: true }>
  >("/api/v1/auth/register", input);
  return response.data.data;
}
/** Consumes the current verification code through the public authority. */
export async function verifyAccount(input: VerifyEmailRequest) {
  const response = await expressClient.post<Envelope<SafeUser>>(
    "/api/v1/auth/verify-email",
    input,
  );
  return response.data.data;
}
/** Requests a generic abuse-protected verification replacement. */
export async function resendVerification(email: string) {
  const response = await expressClient.post<Envelope<{ message: string }>>(
    "/api/v1/auth/resend-verification",
    { email },
  );
  return response.data.data;
}
