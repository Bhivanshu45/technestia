import logger from "@/lib/logger";

export function getRequestLogger(req: Request) {
  return logger.child({
    correlationId:
      req.headers.get("x-correlation-id") ?? "unknown",
  });
}