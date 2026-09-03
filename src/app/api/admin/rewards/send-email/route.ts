import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasStaffRole, isAdminEmail } from "@/lib/admin";
import { sendGiftCodeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = await adminAuth.verifyIdToken(header.slice(7));
    const adminDoc = await adminDb.collection("users").doc(token.uid).get();
    if (!isAdminEmail(token.email) && (!adminDoc.exists || !hasStaffRole(adminDoc.data()?.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { requestId, subject, message } = await req.json();
    if (!requestId || !String(subject || "").trim() || !String(message || "").trim()) return NextResponse.json({ error: "Vui lòng nhập tiêu đề và nội dung email." }, { status: 400 });
    const requestRef = adminDb.collection("reward_requests").doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return NextResponse.json({ error: "Không tìm thấy yêu cầu nhận quà." }, { status: 404 });
    const data = requestDoc.data()!;
    await sendGiftCodeEmail(data.userEmail, data.userFullName, data.rewardName, String(message).trim(), data.giftUrl || undefined, String(subject).trim());
    await requestRef.update({ status: "completed", adminEmailSubject: String(subject).trim(), adminEmailMessage: String(message).trim(), emailSentAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true, message: "Đã gửi email cho học viên." });
  } catch (error) {
    console.error("Error sending reward email:", error);
    return NextResponse.json({ error: "Không thể gửi email, vui lòng thử lại." }, { status: 500 });
  }
}