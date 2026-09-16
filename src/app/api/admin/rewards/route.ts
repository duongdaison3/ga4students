import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasStaffRole, isAdminEmail } from "@/lib/admin";
import { DEFAULT_REWARDS, serializeReward } from "@/lib/rewards";

export const runtime = "nodejs";

async function authorize(req: Request) {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const adminDoc = await adminDb.collection("users").doc(token.uid).get();
  if (!isAdminEmail(token.email) && (!adminDoc.exists || !hasStaffRole(adminDoc.data()?.role))) throw new Error("FORBIDDEN");
  return token;
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    await authorize(req);
    if (new URL(req.url).searchParams.get("view") === "catalog") {
      const snapshot = await adminDb.collection("rewards").orderBy("createdAt", "asc").get();
      if (snapshot.empty) {
        const batch = adminDb.batch();
        const now = new Date();
        DEFAULT_REWARDS.forEach(reward => batch.set(adminDb.collection("rewards").doc(reward.id), { ...reward, createdAt: now, updatedAt: now }));
        await batch.commit();
        return NextResponse.json(DEFAULT_REWARDS);
      }
      return NextResponse.json(snapshot.docs.map(document => serializeReward(document.id, document.data())));
    }

    const snapshot = await adminDb.collection("reward_requests").orderBy("createdAt", "desc").get();
    return NextResponse.json(snapshot.docs.map(document => {
      const data = document.data();
      return { id: document.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() || null, updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null };
    }));
  } catch (error) {
    console.error("Error fetching admin rewards:", error);
    return errorResponse(error, "Không thể tải dữ liệu đổi quà.");
  }
}

export async function POST(req: Request) {
  try {
    await authorize(req);
    const body = await req.json();

    if (body.catalogAction) {
      const id = String(body.id || body.rewardId || "").trim();
      if (body.catalogAction === "delete") {
        if (!id) return NextResponse.json({ error: "Thiếu mã phần quà." }, { status: 400 });
        await adminDb.collection("rewards").doc(id).delete();
        return NextResponse.json({ success: true, message: "Đã xóa phần quà." });
      }
      if (body.catalogAction !== "save" || !id) return NextResponse.json({ error: "Dữ liệu phần quà không hợp lệ." }, { status: 400 });
      const rewardRef = adminDb.collection("rewards").doc(id);
      const current = await rewardRef.get();
      const redeemedCount = Number(current.data()?.redeemedCount || 0);
      const maxStock = Number(body.maxStock);
      const points = Number(body.points);
      if (!String(body.name || "").trim() || !Number.isInteger(maxStock) || maxStock < redeemedCount || !Number.isInteger(points) || points < 0) {
        return NextResponse.json({ error: "Tên, điểm và giới hạn kho không hợp lệ." }, { status: 400 });
      }
      const now = new Date();
      await rewardRef.set({ id, name: String(body.name).trim(), points, type: body.type === "physical" ? "physical" : "digital", maxStock, redeemedCount, active: body.active !== false, description: String(body.description || "").trim(), createdAt: current.data()?.createdAt || now, updatedAt: now }, { merge: true });
      return NextResponse.json({ success: true, message: "Đã lưu phần quà." });
    }

    const status = String(body.status || "");
    const requestIds = Array.isArray(body.requestIds) ? body.requestIds.map(String).filter(Boolean) : [String(body.requestId || "")].filter(Boolean);
    if (!requestIds.length || !["processing", "completed", "rejected"].includes(status)) return NextResponse.json({ error: "Thiếu dữ liệu hoặc trạng thái không hợp lệ." }, { status: 400 });
    let rejectedCount = 0;
    for (const requestId of requestIds) {
      await adminDb.runTransaction(async transaction => {
        const requestRef = adminDb.collection("reward_requests").doc(requestId);
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists) throw new Error("NOT_FOUND");
        const data = requestDoc.data()!;
        const currentStatus = String(data.status || "pending");
        if (currentStatus === status) return;
        if (currentStatus === "rejected") throw new Error("CANNOT_REVIVE_REJECTED");

        let userDoc = null;
        const userId = String(data.userId || "");
        if (status === "rejected" && userId && Number(data.pointsUsed || 0) > 0) userDoc = await transaction.get(adminDb.collection("users").doc(userId));
        const rewardRef = adminDb.collection("rewards").doc(String(data.rewardId || ""));
        const rewardDoc = status === "rejected" && data.stockCounted && data.rewardId ? await transaction.get(rewardRef) : null;

        if (userDoc?.exists) transaction.update(userDoc.ref, { totalPoints: Number(userDoc.data()?.totalPoints || 0) + Number(data.pointsUsed || 0) });
        if (rewardDoc?.exists) transaction.update(rewardRef, { redeemedCount: Math.max(0, Number(rewardDoc.data()?.redeemedCount || 0) - 1), updatedAt: new Date() });
        transaction.update(requestRef, { status, updatedAt: new Date() });
        if (status === "rejected") rejectedCount += 1;
      });
    }
    return NextResponse.json({ success: true, message: status === "rejected" ? `Đã hủy ${rejectedCount} đơn và hoàn điểm.` : `Đã cập nhật ${requestIds.length} đơn.` });
  } catch (error) {
    console.error("Error updating admin rewards:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Không tìm thấy yêu cầu." }, { status: 404 });
    if (message === "CANNOT_REVIVE_REJECTED") return NextResponse.json({ error: "Không thể đổi trạng thái của đơn đã hủy." }, { status: 400 });
    return errorResponse(error, "Lỗi hệ thống.");
  }
}
