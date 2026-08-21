/** Denies state-changing gateway calls whose Origin does not match the application origin. */
export function isSameOrigin(request: Request): boolean {
  const supplied = request.headers.get("origin");
  if (!supplied) return false;
  try {
    const origin = new URL(supplied);
    const requestUrl = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      requestUrl.host;
    const protocol =
      request.headers.get("x-forwarded-proto") ??
      requestUrl.protocol.slice(0, -1);
    return origin.host === host && origin.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
