import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getQuestByDidRkey } from "@/lib/db/queries";

type Context = {
  params: Promise<{
    rkey: string;
  }>;
};

export async function GET(_request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rkey } = await context.params;
  const quest = await getQuestByDidRkey(session.did, rkey);

  if (!quest) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  return NextResponse.json({ quest });
}
