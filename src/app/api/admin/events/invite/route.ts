import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEventInvitationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    // Lấy thông tin sự kiện
    const eventDoc = await adminDb.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Sự kiện không tồn tại" }, { status: 404 });
    }
    const event = eventDoc.data();

    // Lấy danh sách toàn bộ người dùng
    const usersSnap = await adminDb.collection("users").get();
    const users: any[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Bắt đầu quá trình gửi mail ngầm (Fire & Forget logic để không làm treo client)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
      baseUrl = new URL(req.url).origin;
    } catch (e) {}
    const safeBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const eventLink = `${safeBaseUrl}/su-kien/${eventId}`;

    // Giữ request sống cho đến khi hoàn tất để môi trường serverless không dừng tiến trình giữa chừng.
    const sendAllEmails = async () => {
      const recipients = users.filter(user => user.email);
      let sent = 0;
      let failed = 0;

      console.log(`Bắt đầu gửi thư mời sự kiện ${eventId} cho ${recipients.length} người dùng...`);
      for (let index = 0; index < recipients.length; index += 5) {
        const batch = recipients.slice(index, index + 5);
        const results = await Promise.all(batch.map(async user => {
          try {
            return await sendEventInvitationEmail(user.email, user.fullName || "Bạn", event, eventLink);
          } catch (error) {
            console.error(`Lỗi gửi thư mời cho ${user.email}:`, error);
            return false;
          }
        }));

        sent += results.filter(Boolean).length;
        failed += results.length - results.filter(Boolean).length;
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      console.log(`Hoàn thành gửi thư mời sự kiện ${eventId}: ${sent} thành công, ${failed} thất bại.`);
      return { total: recipients.length, sent, failed };
    };

    const result = await sendAllEmails();

    return NextResponse.json({
      success: true,
      message: `Đã gửi ${result.sent}/${result.total} thư mời${result.failed ? `, ${result.failed} thư thất bại` : ""}.`,
      ...result
    });
  } catch (error: any) {
    console.error("Error initiating event invites:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống khi gửi thư mời" },
      { status: 500 }
    );
  }
}
