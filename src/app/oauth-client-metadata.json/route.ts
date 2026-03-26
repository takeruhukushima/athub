
import { clientMetadata } from "@/lib/auth/client";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(clientMetadata);
}
