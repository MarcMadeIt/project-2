import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "For mange anmodninger. Prøv igen om et minut." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "For mange login-forsøg. Prøv igen om et minut." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = authLimiter;
