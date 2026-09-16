import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_REWARDS, serializeReward } from "@/lib/rewards";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("rewards").orderBy("createdAt", "asc").get();
    if (snapshot.empty) return NextResponse.json(DEFAULT_REWARDS);
    return NextResponse.json(snapshot.docs.map((document) => serializeReward(document.id, document.data())));
  } catch (error) {
    console.error("Error fetching reward catalog:", error);
    return NextResponse.json({ error: "Không thể tải danh sách quà." }, { status: 500 });
  }
}