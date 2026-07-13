import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendAccountEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, university } = await req.json();

    if (!fullName || !email || !phone || !university) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: "Email này đã được đăng ký. Vui lòng đăng nhập." },
          { status: 400 }
        );
      }
    } catch (e: any) {
      // If error code is 'auth/user-not-found', we can proceed. Otherwise throw.
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    // 2. Generate random password
    const randomPass = crypto.randomBytes(4).toString('hex') + "A!"; // Example: 4a2b6f1cA!

    // 3. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password: randomPass,
      displayName: fullName,
    });

    // 4. Save user details to Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      fullName,
      email,
      phone,
      university,
      createdAt: new Date(),
      role: "student"
    });

    // 5. Send account activation email with password setup link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const safeBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const firebaseLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${safeBaseUrl}/dang-nhap`,
      handleCodeInApp: false,
    });
    
    // Tạo link tùy chỉnh trỏ về trang web của mình
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get("oobCode");
    const setPasswordLink = `${safeBaseUrl}/dat-mat-khau?oobCode=${oobCode}`;

    await sendAccountEmail(email, fullName, setPasswordLink);

    return NextResponse.json(
      { message: "Tạo tài khoản và gửi email thành công" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Lỗi đăng ký:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
