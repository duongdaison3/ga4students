import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const email = decodedToken.email || "";

    const body = await req.json();
    const { rewardId, address, phone } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Thiếu thông tin phần quà" }, { status: 400 });
    }

    let success = false;

    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const currentPoints = userDoc.data()?.totalPoints || 0;
      const userFullName = userDoc.data()?.fullName || email.split('@')[0];
      const rewardRef = adminDb.collection("rewards").doc(String(rewardId));
      const rewardDoc = await transaction.get(rewardRef);

      if (!rewardDoc.exists) throw new Error("REWARD_NOT_FOUND");
      const reward = rewardDoc.data()!;
      const rewardType = reward.type === "physical" ? "physical" : "digital";
      const rewardPoints = Number(reward.points || 0);
      const maxStock = Math.max(0, Number(reward.maxStock ?? 0));
      const redeemedCount = Math.max(0, Number(reward.redeemedCount ?? 0));

      if (reward.active === false || redeemedCount >= maxStock) throw new Error("REWARD_OUT_OF_STOCK");
      if (rewardType === "physical" && (!address || !phone)) {
        throw new Error("PHYSICAL_DETAILS_REQUIRED");
      }

      if (currentPoints < rewardPoints) {
        throw new Error("NOT_ENOUGH_POINTS");
      }

      const newPoints = currentPoints - rewardPoints;
      transaction.update(userRef, { totalPoints: newPoints });
      transaction.update(rewardRef, { redeemedCount: redeemedCount + 1, updatedAt: new Date() });

      const requestRef = adminDb.collection("reward_requests").doc();
      transaction.set(requestRef, {
        userId,
        userEmail: email,
        userFullName,
        rewardId,
        rewardName: reward.name,
        pointsUsed: rewardPoints,
        type: rewardType,
        stockCounted: true,
        address: address || "",
        phone: phone || "",
        status: "pending", // pending, processing, completed, rejected
        createdAt: new Date(),
        updatedAt: new Date()
      });

      success = true;
    });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Đổi quà thành công! Admin sẽ liên hệ với bạn sớm." 
      });
    }

    return NextResponse.json({ error: "Lỗi không xác định" }, { status: 500 });
  } catch (error: unknown) {
    console.error("Error redeeming reward:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage === "NOT_ENOUGH_POINTS") {
      return NextResponse.json({ error: "Bạn không đủ điểm để đổi phần quà này." }, { status: 400 });
    }
    if (errorMessage === "REWARD_OUT_OF_STOCK") {
      return NextResponse.json({ error: "Tạm hết phần quà này. Admin đã được thông báo để bổ sung thêm." }, { status: 409 });
    }
    if (errorMessage === "REWARD_NOT_FOUND") {
      return NextResponse.json({ error: "Phần quà không còn tồn tại." }, { status: 404 });
    }
    if (errorMessage === "PHYSICAL_DETAILS_REQUIRED") {
      return NextResponse.json({ error: "Vui lòng cung cấp đầy đủ số điện thoại và địa chỉ nhận quà" }, { status: 400 });
    }
    if (errorMessage === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
    }
    return NextResponse.json({ error: "Hệ thống đang bận, vui lòng thử lại sau." }, { status: 500 });
  }
}
