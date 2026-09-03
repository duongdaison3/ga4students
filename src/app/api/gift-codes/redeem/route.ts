import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendGiftCodeEmail } from "@/lib/email";

export const runtime = "nodejs";
type GiftData = { name: string; type: string; description?: string; giftUrl?: string; active: boolean; usedCount?: number; maxUses: number; startsAt: { toMillis?: () => number } | string; expiresAt: { toMillis?: () => number } | string };

export async function POST(req: Request) {
  try {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = await adminAuth.verifyIdToken(header.slice(7));
    const code = String((await req.json()).code || "").trim().toUpperCase();
    if (!code || code.length > 40) return NextResponse.json({ error: "Vui lòng nhập gift code hợp lệ." }, { status: 400 });
    let gift: GiftData | null = null;
    let requestId = "";
    let recipient = { email: token.email || "", fullName: "" };
    await adminDb.runTransaction(async (transaction) => {
      const result = await transaction.get(adminDb.collection("gift_codes").where("code", "==", code).limit(1));
      if (result.empty) throw new Error("INVALID_CODE");
      const giftDoc = result.docs[0];
      gift = giftDoc.data() as GiftData;
      const now = Date.now();
      const startsAt = typeof gift.startsAt === "string" ? new Date(gift.startsAt).getTime() : gift.startsAt.toMillis?.() || 0;
      const expiresAt = typeof gift.expiresAt === "string" ? new Date(gift.expiresAt).getTime() : gift.expiresAt.toMillis?.() || 0;
      if (!gift.active || now < startsAt || now > expiresAt) throw new Error("EXPIRED_CODE");
      if ((gift.usedCount || 0) >= gift.maxUses) throw new Error("USED_UP");
      const redemptionRef = giftDoc.ref.collection("redemptions").doc(token.uid);
      const redemption = await transaction.get(redemptionRef);
      if (redemption.exists) throw new Error("ALREADY_REDEEMED");
      const userDoc = await transaction.get(adminDb.collection("users").doc(token.uid));
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");
      transaction.update(giftDoc.ref, { usedCount: (gift.usedCount || 0) + 1, updatedAt: new Date() });
      transaction.set(redemptionRef, { userId: token.uid, code, giftName: gift.name, giftType: gift.type, redeemedAt: new Date() });
      const requestRef = adminDb.collection("reward_requests").doc();
      requestId = requestRef.id;
      recipient = { email: token.email || "", fullName: userDoc.data()?.fullName || token.email?.split("@")[0] || "" };
      transaction.set(requestRef, { userId: token.uid, userEmail: token.email || "", userFullName: userDoc.data()?.fullName || token.email?.split("@")[0] || "", giftCodeId: giftDoc.id, giftCode: code, rewardId: `gift_code_${giftDoc.id}`, rewardName: gift.name, giftUrl: gift.giftUrl || "", pointsUsed: 0, type: gift.type, description: gift.description || "", status: "pending", createdAt: new Date(), updatedAt: new Date() });
    });
    if (gift!.type === "document") {
      try {
        await sendGiftCodeEmail(recipient.email, recipient.fullName, gift!.name, gift!.description || "", gift!.giftUrl);
        await adminDb.collection("reward_requests").doc(requestId).update({ status: "completed", emailSentAt: new Date(), updatedAt: new Date() });
        return NextResponse.json({ success: true, autoCompleted: true, message: `Nhận quà thành công: ${gift!.name}. Link quà tặng đã được gửi qua email.` });
      } catch (emailError) {
        console.error("Document gift email failed:", emailError);
        return NextResponse.json({ success: true, autoCompleted: false, message: `Đã ghi nhận quà ${gift!.name}. Email đang được xử lý, admin sẽ gửi lại nếu cần.` });
      }
    }
    return NextResponse.json({ success: true, message: `Nhận quà thành công: ${gift!.name}. Admin sẽ liên hệ với bạn sớm.` });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = { INVALID_CODE: "Gift code không tồn tại.", EXPIRED_CODE: "Gift code chưa có hiệu lực hoặc đã hết hạn.", USED_UP: "Gift code đã hết lượt sử dụng.", ALREADY_REDEEMED: "Bạn đã sử dụng gift code này rồi.", USER_NOT_FOUND: "Không tìm thấy hồ sơ người dùng." };
    if (messages[errorMessage]) return NextResponse.json({ error: messages[errorMessage] }, { status: 400 });
    console.error("Error redeeming gift code:", error);
    return NextResponse.json({ error: "Hệ thống đang bận, vui lòng thử lại sau." }, { status: 500 });
  }
}