import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginRequestSchema } from "@gold-era/contracts/public";
import { trustedAuthResponseSchema } from "@gold-era/contracts/internal";
import { serverEnv } from "../../../../lib/config/server-env";
import { isSameOrigin } from "../../../../lib/auth/same-origin";
import { refreshCookie } from "../../../../lib/auth/refresh-cookie";

/** Exchanges credentials through the trusted authority and withholds raw refresh material. */
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
  const body = loginRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Correct the highlighted fields.",
        },
      },
      { status: 400 },
    );
  const env = serverEnv();
  try {
    const authority = await fetch(
      `${env.AUTH_API_BASE_URL}/internal/v1/auth/login`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gold-era-bff-trust": env.AUTH_BFF_SHARED_SECRET,
        },
        body: JSON.stringify(body.data),
        cache: "no-store",
      },
    );
    const json: unknown = await authority.json();
    if (!authority.ok)
      return NextResponse.json(json, { status: authority.status });
    const trusted = trustedAuthResponseSchema.parse(json);
    const { refreshToken } = trusted.data;
    const session = {
      accessToken: trusted.data.accessToken,
      tokenType: trusted.data.tokenType,
      expiresIn: trusted.data.expiresIn,
      user: trusted.data.user,
    };
    try {
      (await cookies()).set(refreshCookie(env, refreshToken));
    } catch {
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
          message: "Sign in is temporarily unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
