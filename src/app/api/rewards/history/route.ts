import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await adminAuth.verifyIdToken(header.slice(7));
    const snapshot = await adminDb
      .collection("reward_requests")
      .where("userId", "==", token.uid)
      .get();

    const history = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      })
      .sort((first, second) => (second.createdAt || "").localeCompare(first.createdAt || ""));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching reward history:", error);
    return NextResponse.json({ error: "Không thể tải lịch sử đổi quà." }, { status: 500 });
  }
}