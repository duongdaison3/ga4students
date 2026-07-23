import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Kiểm tra quyền admin
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { fullName, email, phone, university } = body;

    // 1. Nếu có cập nhật email, phải cập nhật trong Firebase Auth
    if (email) {
      await adminAuth.updateUser(userId, {
        email,
        displayName: fullName
      });
    } else if (fullName) {
      await adminAuth.updateUser(userId, {
        displayName: fullName
      });
    }

    // 2. Cập nhật trong Firestore
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (university !== undefined) updateData.university = university;
    
    if (Object.keys(updateData).length > 0) {
      await adminDb.collection("users").doc(userId).update(updateData);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
