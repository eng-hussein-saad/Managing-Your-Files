import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { trustedAuthResponseSchema } from "@gold-era/contracts/internal";
import { serverEnv } from "../../../../lib/config/server-env";
import { isSameOrigin } from "../../../../lib/auth/same-origin";
import {
  clearedRefreshCookie,
  refreshCookie,
} from "../../../../lib/auth/refresh-cookie";

/** Rotates the HttpOnly credential and returns only safe in-memory session data. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "The request origin is invalid.",
        },
      },
      { status: 403 },
    );
  const env = serverEnv();
  const jar = await cookies();
  const raw = jar.get(env.REFRESH_COOKIE_NAME)?.value;
  if (!raw) {
    jar.set(clearedRefreshCookie(env));
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_REFRESH_INVALID",
          message: "Sign in again to continue.",
        },
      },
      { status: 401 },
    );
  }
  try {
    const authority = await fetch(
      `${env.AUTH_API_BASE_URL}/internal/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gold-era-bff-trust": env.AUTH_BFF_SHARED_SECRET,
        },
        body: JSON.stringify({ refreshToken: raw }),
        cache: "no-store",
      },
    );
    const json: unknown = await authority.json();
    if (!authority.ok) {
      jar.set(clearedRefreshCookie(env));
      return NextResponse.json(json, { status: authority.status });
    }
    const trusted = trustedAuthResponseSchema.parse(json);
    const { refreshToken } = trusted.data;
    const session = {
      accessToken: trusted.data.accessToken,
      tokenType: trusted.data.tokenType,
      expiresIn: trusted.data.expiresIn,
      user: trusted.data.user,
    };
    try {
      jar.set(refreshCookie(env, refreshToken));
    } catch {
      jar.set(clearedRefreshCookie(env));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_FAILED",
            message: "The secure session could not be stored.",
          },
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Session renewal is temporarily unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
