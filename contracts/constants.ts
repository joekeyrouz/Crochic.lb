export const Session = {
  cookieName: "crochic_sid",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  adminLogin: "/admin/login",
  googleLogin: "/api/auth/google",
  googleCallback: "/api/auth/google/callback",
} as const;
