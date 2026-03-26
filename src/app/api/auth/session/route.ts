import { NextResponse } from "next/server";

const DID_COOKIE_NAME = "did";
const DID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { did?: string } | null;
  const did = body?.did?.trim();

  if (!did) {
    return NextResponse.json({ error: "DID is required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DID_COOKIE_NAME, did, {
    path: "/",
    sameSite: "lax",
    maxAge: DID_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DID_COOKIE_NAME, "", {
    path: "/",
    sameSite: "lax",
    maxAge: 0,
  });
  return response;
}
