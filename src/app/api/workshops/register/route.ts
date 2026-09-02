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

    const eventRef = adminDb.collection("events").doc(workshopId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Sự kiện không tồn tại" }, { status: 404 });
    }

    const event = eventDoc.data() || {};

    // 4. Check registration and capacity atomically
    const userRef = adminDb.collection("users").doc(uid);
    const registrationRef = adminDb.collection("registrations").doc();
    const missionRef = adminDb.collection("user_missions").doc(`${uid}_${workshopId}_register_event`);
    let fullName = email.split('@')[0];
    let eventData = {
      date: event.date || "",
      time: event.time || "",
      type: event.type || "Online",
      location: event.location || "",
      meetingLink: event.meetingLink || ""
    };

    await adminDb.runTransaction(async transaction => {
      const [currentEventDoc, userDoc, registrationSnapshot] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(userRef),
        transaction.get(adminDb.collection("registrations").where("eventId", "==", workshopId))
      ]);
      const currentEvent = currentEventDoc.data() || event;
      const maxParticipants = Number.isInteger(currentEvent.maxParticipants) && currentEvent.maxParticipants > 0
        ? currentEvent.maxParticipants
        : null;
      const registeredCount = Number.isInteger(currentEvent.registeredCount)
        ? currentEvent.registeredCount
        : registrationSnapshot.size;
      const userData = userDoc.data();
      const registeredWorkshops: string[] = Array.isArray(userData?.registeredWorkshops)
        ? [...userData.registeredWorkshops]
        : [];

      if (registeredWorkshops.includes(workshopId)) {
        throw new Error("ALREADY_REGISTERED");
      }
      if (maxParticipants !== null && registeredCount >= maxParticipants) {
        throw new Error("EVENT_FULL");
      }

      fullName = userData?.fullName || fullName;
      registeredWorkshops.push(workshopId);
      transaction.set(userRef, {
        registeredWorkshops,
        totalPoints: (userData?.totalPoints || 0) + 10
      }, { merge: true });
      transaction.set(missionRef, {
        userId: uid,
        eventId: workshopId,
        missionType: "register_event",
        points: 10,
        createdAt: new Date()
      });
      transaction.set(registrationRef, {
        eventId: workshopId,
        userId: uid,
        userEmail: email,
        userFullName: fullName,
        userUniversity: userData?.university || "Trường Đại học",
        eventTitle: workshopTitle,
        registeredAt: new Date()
      });
      transaction.update(eventRef, { registeredCount: registeredCount + 1 });
    });

    // Email is a follow-up notification. A temporary SMTP failure must not turn
    // a completed registration into a failed registration in the UI.
    let emailSent = true;
    try {
      await sendWorkshopRegistrationEmail(email, fullName, workshopTitle, eventData);
    } catch (emailError) {
      emailSent = false;
      console.error(`Đăng ký thành công nhưng gửi email xác nhận thất bại cho ${email}:`, emailError);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? "Đăng ký thành công"
          : "Đăng ký thành công nhưng email xác nhận chưa gửi được. Vui lòng kiểm tra lại hòm thư sau hoặc liên hệ quản trị viên.",
        emailSent
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Lỗi đăng ký workshop:", error);
    if (error.message === "ALREADY_REGISTERED") {
      return NextResponse.json({ error: "Bạn đã đăng ký tham gia buổi học này rồi." }, { status: 400 });
    }
    if (error.message === "EVENT_FULL") {
      return NextResponse.json({ error: "Sự kiện đã đóng đăng ký vì đã đủ số lượng người tham gia." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
