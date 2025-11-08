import { rateLimit } from "express-rate-limit";

const createRateLimiter = ({ maxRequests, perMinutes = 15 }, additionalOptions = {}) => {
  return rateLimit({
    windowMs: perMinutes * 60 * 1000,
    max: maxRequests,
    message: `Too many requests, please try again after ${perMinutes} ${perMinutes === 1 ? "minute" : "minutes"}`,
    standardHeaders: true,
    legacyHeaders: false,
    ...additionalOptions, // Merge additional options properly
  });
};

export const authLimiter = createRateLimiter({ maxRequests: 10, perMinutes: 15 });

export const sendMessageLimiter = createRateLimiter({ maxRequests: 5, perMinutes: 1 });

export const generalLimiter = createRateLimiter({ maxRequests: 100, perMinutes: 15 });
