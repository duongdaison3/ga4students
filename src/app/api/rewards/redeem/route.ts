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
    const { rewardId, rewardName, points, type, address, phone } = body;

    if (!rewardId || !rewardName || !points || !type) {
      return NextResponse.json({ error: "Thiếu thông tin phần quà" }, { status: 400 });
    }

    if (type === "physical" && (!address || !phone)) {
      return NextResponse.json({ error: "Vui lòng cung cấp đầy đủ số điện thoại và địa chỉ nhận quà" }, { status: 400 });
    }

    let success = false;

    // Use transaction to atomically check and deduct points
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const currentPoints = userDoc.data()?.totalPoints || 0;
      const userFullName = userDoc.data()?.fullName || email.split('@')[0];

      if (currentPoints < points) {
        throw new Error("NOT_ENOUGH_POINTS");
      }

      // Deduct points
      const newPoints = currentPoints - points;
      transaction.update(userRef, { totalPoints: newPoints });

      // Create reward request
      const requestRef = adminDb.collection("reward_requests").doc();
      transaction.set(requestRef, {
        userId,
        userEmail: email,
        userFullName,
        rewardId,
        rewardName,
        pointsUsed: points,
        type,
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
  } catch (error: any) {
    console.error("Error redeeming reward:", error);
    if (error.message === "NOT_ENOUGH_POINTS") {
      return NextResponse.json({ error: "Bạn không đủ điểm để đổi phần quà này." }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
    }
    return NextResponse.json({ error: "Hệ thống đang bận, vui lòng thử lại sau." }, { status: 500 });
  }
}
