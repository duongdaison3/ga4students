import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendAccountEmail } from "@/lib/email";

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

    // Lấy thông tin user
    const userRecord = await adminAuth.getUser(userId);
    const email = userRecord.email;
    const fullName = userRecord.displayName || email?.split('@')[0] || "Bạn";

    if (!email) {
      return NextResponse.json({ error: "Người dùng không có email hợp lệ" }, { status: 400 });
    }

    // Tạo link đặt lại mật khẩu
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
      baseUrl = new URL(req.url).origin;
    } catch (e) {}

    const safeBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const firebaseLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${safeBaseUrl}/dang-nhap`,
      handleCodeInApp: false,
    });
    
    // Tùy chỉnh URL để dẫn về trang Cài đặt mật khẩu của website
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get("oobCode");
    const setPasswordLink = `${safeBaseUrl}/dat-mat-khau?oobCode=${oobCode}`;

    // Gửi email
    await sendAccountEmail(email, fullName, setPasswordLink);

    return NextResponse.json({ success: true, message: "Đã gửi email thành công" });
  } catch (error: any) {
    console.error("Error sending reset password email:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống khi tạo link đặt lại mật khẩu" },
      { status: 500 }
    );
  }
}
