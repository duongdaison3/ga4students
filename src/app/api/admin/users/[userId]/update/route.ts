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
      try {
        await adminAuth.updateUser(userId, {
          email,
          displayName: fullName
        });
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          // Kiểm tra xem email này đang bị chiếm bởi tài khoản nào
          const conflictingUser = await adminAuth.getUserByEmail(email);
          const conflictingDoc = await adminDb.collection("users").doc(conflictingUser.uid).get();
          
          if (!conflictingDoc.exists) {
            // Đây là tài khoản rác (vd: đăng nhập Google nhưng chưa đăng ký) -> xóa đi và thử lại
            await adminAuth.deleteUser(conflictingUser.uid);
            await adminAuth.updateUser(userId, {
              email,
              displayName: fullName
            });
          } else {
            throw new Error("Email này đã được sử dụng bởi một học viên khác trong hệ thống!");
          }
        } else {
          throw authError;
        }
      }
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
