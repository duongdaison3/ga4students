import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ADMIN_EMAILS = [
  "pea44.work@gmail.com",
  "spea22@xpea.io.vn"
];

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  try {
    const userIdToDelete = params.userId;
    if (!userIdToDelete) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check admin
    let isAdmin = false;
    if (decodedToken.email && ADMIN_EMAILS.includes(decodedToken.email)) {
      isAdmin = true;
    } else {
      const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
      if (callerDoc.exists && callerDoc.data()?.role === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(userIdToDelete);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    // 2. Delete from Firestore `users`
    await adminDb.collection("users").doc(userIdToDelete).delete();

    // 3. Delete related registrations
    const regQuery = await adminDb.collection("registrations").where("userId", "==", userIdToDelete).get();
    const batch = adminDb.batch();
    regQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (!regQuery.empty) {
      await batch.commit();
    }

    return NextResponse.json({ message: "Đã xóa người dùng và các đăng ký liên quan" }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
