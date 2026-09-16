import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasStaffRole, isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = await adminAuth.verifyIdToken(header.slice(7));
    const adminDoc = await adminDb.collection("users").doc(token.uid).get();
    if (!isAdminEmail(token.email) && (!adminDoc.exists || !hasStaffRole(adminDoc.data()?.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const document = await adminDb.collection("reward_requests").doc(id).get();
    if (!document.exists) return NextResponse.json({ error: "Không tìm thấy yêu cầu đổi quà." }, { status: 404 });
    const data = document.data()!;
    return NextResponse.json({ id: document.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() || null, updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null, emailSentAt: data.emailSentAt?.toDate?.()?.toISOString() || null });
  } catch (error) {
    console.error("Error fetching reward detail:", error);
    return NextResponse.json({ error: "Không thể tải chi tiết đổi quà." }, { status: 500 });
  }
}
