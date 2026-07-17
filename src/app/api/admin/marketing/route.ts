import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendPersonalizedMarketingEmail } from "@/lib/email";

export const runtime = "nodejs";

const ADMIN_EMAILS = [
  "pea44.work@gmail.com",
  "spea22@xpea.io.vn",
  "vuongtonga171105@gmail.com"
];

export async function POST(req: Request) {
  try {
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
      } else if (decodedToken.email) {
        const q = await adminDb.collection("users").where("email", "==", decodedToken.email).get();
        if (!q.empty && q.docs[0].data().role === "admin") {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { recipients, subject, htmlContent } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Thiếu danh sách người nhận (recipients)" }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({ error: "Thiếu tiêu đề email" }, { status: 400 });
    }

    if (!htmlContent) {
      return NextResponse.json({ error: "Thiếu nội dung email" }, { status: 400 });
    }

    // Gửi email
    await sendPersonalizedMarketingEmail(recipients, subject, htmlContent);

    return NextResponse.json({ message: "Gửi email thành công" }, { status: 200 });
  } catch (error: any) {
    console.error("Error sending marketing email:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi gửi email" }, { status: 500 });
  }
}
