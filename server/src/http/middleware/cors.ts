import cors from "cors";
/** Creates credentialless CORS restricted to exact configured browser origins. */
export function exactOriginCors(origins: string[]) {
  return cors({
    origin: origins,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });
}
