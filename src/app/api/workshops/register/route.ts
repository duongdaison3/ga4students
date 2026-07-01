import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendWorkshopRegistrationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1. Get the Authorization token from headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // 2. Verify token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: "No email associated with account" }, { status: 400 });
    }

    // 3. Get body data
    const { workshopId, workshopTitle } = await req.json();

    if (!workshopId || !workshopTitle) {
      return NextResponse.json({ error: "Missing workshop info" }, { status: 400 });
    }

    // 4. Check if user already registered for this workshop
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    let fullName = email.split('@')[0]; // fallback
    let registeredWorkshops = [];

    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.fullName) fullName = data.fullName;
      if (data?.registeredWorkshops) registeredWorkshops = data.registeredWorkshops;
    }

    if (registeredWorkshops.includes(workshopId)) {
      return NextResponse.json({ error: "Bạn đã đăng ký tham gia buổi học này rồi." }, { status: 400 });
    }

    // 5. Update user's registered workshops in Firestore
    registeredWorkshops.push(workshopId);
    await userRef.set({ registeredWorkshops }, { merge: true });

    // 6. Send confirmation email
    await sendWorkshopRegistrationEmail(email, fullName, workshopTitle);

    return NextResponse.json(
      { message: "Đăng ký thành công" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Lỗi đăng ký workshop:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
