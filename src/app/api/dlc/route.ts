import { NextResponse } from "next/server";
import { newId } from "@/lib/server/id";

type DlcState = {
  id: string;
  status: "draft" | "funding" | "active" | "closed";
  payoutSats: string;
  createdAt: string;
};

const memory: DlcState[] = [];

export async function GET() {
  return NextResponse.json({ contracts: memory });
}

export async function POST(req: Request) {
  let body: { payoutSats?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  let payoutSats: bigint;
  try {
    payoutSats = BigInt(body.payoutSats ?? "0");
  } catch {
    return NextResponse.json({ error: "Invalid payout" }, { status: 400 });
  }
  if (payoutSats <= 0n) {
    return NextResponse.json({ error: "payoutSats required" }, { status: 400 });
  }
  const c: DlcState = {
    id: newId("dlc"),
    status: "draft",
    payoutSats: payoutSats.toString(),
    createdAt: new Date().toISOString(),
  };
  memory.unshift(c);
  return NextResponse.json({ contract: c });
}
