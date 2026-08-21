"use client";
import { useMutation } from "@tanstack/react-query";
import {
  registerAccount,
  resendVerification,
  verifyAccount,
} from "../api/registration.api";
/** Exposes registration as a reusable React Query mutation. */
export function useRegistration() {
  return useMutation({ mutationFn: registerAccount });
}
/** Exposes email verification as a reusable React Query mutation. */
export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyAccount });
}
/** Exposes verification resend as a reusable React Query mutation. */
export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification });
}
