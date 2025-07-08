interface VerifyEmailPayload {
  type: "VERIFY";
  email: string;
  username: string;
  verifyCode: string;
}

interface ResetPasswordPayload {
  type: "RESET_PASSWORD";
  email: string;
  username: string;
  resetLink: string;
}
export type { VerifyEmailPayload, ResetPasswordPayload };
