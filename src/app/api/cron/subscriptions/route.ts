import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { processSubscriptionLifecycle } from "@/server/tenant/subscription";

export const dynamic = "force-dynamic";

async function runLifecycle(request: Request) {
  const secret = env.cronSecret;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await processSubscriptionLifecycle());
  } catch (error) {
    console.error("Subscription lifecycle failed:", error);
    return NextResponse.json({ error: "Subscription lifecycle failed" }, { status: 500 });
  }
}

export const GET = runLifecycle;
export const POST = runLifecycle;