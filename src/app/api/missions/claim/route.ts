import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { eventId, missionType, targetUserId, targetUserIds } = body;

    if (!eventId || !missionType) {
      return NextResponse.json({ error: "Thiếu thông tin nhiệm vụ" }, { status: 400 });
    }

    if (missionType === "attendance" && targetUserIds && Array.isArray(targetUserIds)) {
      // BATCH PROCESSING FOR MULTIPLE USERS
      const callerDoc = await adminDb.collection("users").doc(userId).get();
      if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
        return NextResponse.json({ error: "Chỉ Admin mới có quyền điểm danh" }, { status: 403 });
      }

      let successCount = 0;
      let alreadyClaimedCount = 0;

      // Process sequentially to avoid lock contentions and complexity
      for (const uid of targetUserIds) {
        try {
          await adminDb.runTransaction(async (transaction) => {
            const missionId = `${uid}_${eventId}_attendance`;
            const missionRef = adminDb.collection("user_missions").doc(missionId);
            const missionDoc = await transaction.get(missionRef);
            
            if (missionDoc.exists) {
              alreadyClaimedCount++;
              return; // skip if already claimed
            }

            transaction.set(missionRef, {
              userId: uid,
              eventId,
              missionType: "attendance",
              points: 100,
              createdAt: new Date()
            });

            const userRef = adminDb.collection("users").doc(uid);
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists) {
              const currentPoints = userDoc.data()?.totalPoints || 0;
              transaction.update(userRef, { totalPoints: currentPoints + 100 });
            }

            const regSnapshot = await adminDb.collection("registrations")
              .where("userId", "==", uid)
              .where("eventId", "==", eventId)
              .limit(1)
              .get();
            
            if (!regSnapshot.empty) {
              transaction.update(regSnapshot.docs[0].ref, { attended: true });
            }
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to process attendance for ${uid}:`, e);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Đã điểm danh thành công ${successCount} sinh viên. (Bỏ qua ${alreadyClaimedCount} người đã được điểm danh trước đó)` 
      });
    }

    // SINGLE USER PROCESSING
    // Determine points and permissions
    let points = 0;
    let uidToReward = userId; // By default, reward the caller

    if (missionType === "attendance") {
      // Only admins can trigger attendance
      const callerDoc = await adminDb.collection("users").doc(userId).get();
      if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
        return NextResponse.json({ error: "Chỉ Admin mới có quyền điểm danh" }, { status: 403 });
      }
      points = 100;
      if (!targetUserId) return NextResponse.json({ error: "Thiếu targetUserId" }, { status: 400 });
      uidToReward = targetUserId;
    } else if (missionType === "share" || missionType === "recap") {
      points = 100;
    } else if (missionType === "gemini_prompt") {
      points = 50;
    } else {
      return NextResponse.json({ error: "Loại nhiệm vụ không hợp lệ" }, { status: 400 });
    }

    const missionId = `${uidToReward}_${eventId}_${missionType}`;
    const missionRef = adminDb.collection("user_missions").doc(missionId);

    // Use a transaction to ensure points are only awarded once
    await adminDb.runTransaction(async (transaction) => {
      const missionDoc = await transaction.get(missionRef);
      if (missionDoc.exists) {
        throw new Error("ALREADY_CLAIMED");
      }

      // Record the mission
      transaction.set(missionRef, {
        userId: uidToReward,
        eventId,
        missionType,
        points,
        createdAt: new Date()
      });

      // Update user points
      const userRef = adminDb.collection("users").doc(uidToReward);
      const userDoc = await transaction.get(userRef);
      
      let newTotal = points;
      if (userDoc.exists) {
        const currentPoints = userDoc.data()?.totalPoints || 0;
        newTotal = currentPoints + points;
        transaction.update(userRef, { totalPoints: newTotal });
      } else {
        // Fallback if user document somehow doesn't exist but they are trying to claim
        throw new Error("USER_NOT_FOUND");
      }
      
      // If attendance, also update the registration status
      if (missionType === "attendance") {
        // find registration doc
        const regSnapshot = await adminDb.collection("registrations")
          .where("userId", "==", uidToReward)
          .where("eventId", "==", eventId)
          .limit(1)
          .get();
        
        if (!regSnapshot.empty) {
          transaction.update(regSnapshot.docs[0].ref, { attended: true });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Nhận điểm thành công", points });
  } catch (error: any) {
    console.error("Error claiming mission:", error);
    if (error.message === "ALREADY_CLAIMED") {
      return NextResponse.json({ error: "Nhiệm vụ này đã được nhận điểm rồi." }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
    }
    return NextResponse.json({ error: "Lỗi hệ thống khi nhận điểm." }, { status: 500 });
  }
}
