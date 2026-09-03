import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasStaffRole, isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

async function requireStaff(req: Request) {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const userDoc = await adminDb.collection("users").doc(token.uid).get();
  if (!isAdminEmail(token.email) && (!userDoc.exists || !hasStaffRole(userDoc.data()?.role))) throw new Error("FORBIDDEN");
  return token;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(req: Request) {
  try {
    await requireStaff(req);
    const snapshot = await adminDb.collection("gift_codes").orderBy("createdAt", "desc").get();
    return NextResponse.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: message === "FORBIDDEN" ? 403 : 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff(req);
    const body = await req.json();
    const code = cleanText(body.code, 40).toUpperCase();
    const name = cleanText(body.name, 120);
    const type = cleanText(body.type, 30);
    const description = cleanText(body.description, 500);
    const startsAt = new Date(body.startsAt);
    const expiresAt = new Date(body.expiresAt);
    const maxUses = Number(body.maxUses);
    if (!code || !name || !["document", "physical", "digital", "other"].includes(type) || Number.isNaN(startsAt.getTime()) || Number.isNaN(expiresAt.getTime()) || expiresAt <= startsAt || !Number.isInteger(maxUses) || maxUses < 1) return NextResponse.json({ error: "Thông tin gift code không hợp lệ." }, { status: 400 });
    const existing = await adminDb.collection("gift_codes").where("code", "==", code).limit(1).get();
    if (!existing.empty) return NextResponse.json({ error: "Gift code này đã tồn tại." }, { status: 409 });
    const ref = adminDb.collection("gift_codes").doc();
    await ref.set({ code, name, type, description, startsAt, expiresAt, maxUses, usedCount: 0, active: true, createdAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    console.error("Error creating gift code:", error);
    return NextResponse.json({ error: message === "FORBIDDEN" ? "Forbidden" : "Lỗi hệ thống." }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireStaff(req);
    const body = await req.json();
    const id = cleanText(body.id, 100);
    if (!id || typeof body.active !== "boolean") return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });
    await adminDb.collection("gift_codes").doc(id).update({ active: body.active, updatedAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message === "FORBIDDEN" ? "Forbidden" : "Lỗi hệ thống." }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireStaff(req);
    const id = cleanText((await req.json()).id, 100);
    if (!id) return NextResponse.json({ error: "Thiếu mã gift code." }, { status: 400 });
    await adminDb.collection("gift_codes").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message === "FORBIDDEN" ? "Forbidden" : "Lỗi hệ thống." }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}