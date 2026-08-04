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
    const adminId = decodedToken.uid;

    // Verify admin role
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, status } = body; // status: processing, completed, rejected

    if (!requestId || !status) {
      return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
    }

    const requestRef = adminDb.collection("reward_requests").doc(requestId);

    let message = "Cập nhật thành công";

    await adminDb.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error("NOT_FOUND");
      }

      const data = requestDoc.data();
      const currentStatus = data?.status;

      if (currentStatus === status) {
        return; // nothing to do
      }

      // If transitioning to rejected, refund points
      if (status === "rejected" && currentStatus !== "rejected") {
        const userId = data?.userId;
        const pointsToRefund = data?.pointsUsed || 0;

        if (userId && pointsToRefund > 0) {
          const userRef = adminDb.collection("users").doc(userId);
          const userDoc = await transaction.get(userRef);
          
          if (userDoc.exists) {
            const currentPoints = userDoc.data()?.totalPoints || 0;
            transaction.update(userRef, { totalPoints: currentPoints + pointsToRefund });
          }
        }
        message = "Đã hủy đơn và hoàn điểm cho người dùng";
      }

      // If transitioning FROM rejected to something else, we technically should re-deduct points, 
      // but to keep it safe, we shouldn't allow reviving a rejected request.
      if (currentStatus === "rejected") {
        throw new Error("CANNOT_REVIVE_REJECTED");
      }

      transaction.update(requestRef, { 
        status,
        updatedAt: new Date()
      });
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Error updating reward request:", error);
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu." }, { status: 404 });
    }
    if (error.message === "CANNOT_REVIVE_REJECTED") {
      return NextResponse.json({ error: "Không thể đổi trạng thái của đơn đã Hủy/Hoàn điểm." }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
  }
}
