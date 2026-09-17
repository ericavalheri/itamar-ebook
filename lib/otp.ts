import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MIN_RESEND_SECONDS = 30;
export const OTP_MAX_PER_WINDOW = 5;
export const OTP_WINDOW_MINUTES = 15;

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
