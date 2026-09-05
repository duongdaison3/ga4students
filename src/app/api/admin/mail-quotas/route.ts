import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasStaffRole, isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

async function requireStaff(req: Request) {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const userDoc = await adminDb.collection("users").doc(token.uid).get();
  if (!isAdminEmail(token.email) && (!userDoc.exists || !hasStaffRole(userDoc.data()?.role))) throw new Error("FORBIDDEN");
}

type ProviderStatus = {
  name: string;
  address: string | null;
  configured: boolean;
  quota: number | null;
  quotaUnit: "emails" | null;
  quotaKnown: boolean;
  note: string;
};

const getBrevoStatus = async (): Promise<ProviderStatus> => {
  const apiKey = process.env.BREVO_API_KEY;
  const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const status: ProviderStatus = {
    name: "Brevo",
    address: process.env.SMTP_FROM || null,
    configured,
    quota: null,
    quotaUnit: "emails",
    quotaKnown: false,
    note: configured ? "Đang dùng làm kênh chính" : "Thiếu cấu hình SMTP",
  };

  if (!apiKey) {
    status.note = "Chưa có BREVO_API_KEY để đọc quota";
    return status;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      status.note = `Brevo API trả về HTTP ${response.status}`;
      return status;
    }

    const data = await response.json() as { plan?: Array<{ credits?: number | string }> };
    const credits = data.plan
      ?.map(plan => Number(plan.credits))
      .filter(Number.isFinite);
    if (credits?.length) {
      status.quota = Math.max(0, Math.floor(Math.min(...credits)));
      status.quotaKnown = true;
      status.note = status.quota > 0 ? "Sẵn sàng gửi" : "Đã hết quota, sẽ chuyển sang Gmail";
    } else {
      status.note = "Brevo không trả về số quota trong tài khoản này";
    }
  } catch {
    status.note = "Không kết nối được Brevo API";
  }

  return status;
};

const getGmailStatus = (name: string, user?: string, password?: string, from?: string): ProviderStatus => ({
  name,
  address: from || user || null,
  configured: Boolean(user && password),
  quota: null,
  quotaUnit: "emails",
  quotaKnown: false,
  note: user && password ? "Đã sẵn sàng; Gmail không cung cấp quota chính xác qua SMTP App Password" : "Chưa cấu hình đầy đủ",
});

export async function GET(req: Request) {
  try {
    await requireStaff(req);
    const providers = [
      await getBrevoStatus(),
      getGmailStatus("Gmail chính", process.env.EMAIL_USER, process.env.EMAIL_APP_PASSWORD, process.env.EMAIL_FROM),
      getGmailStatus("Gmail dự phòng", process.env.EMAIL_USER_2, process.env.EMAIL_APP_PASSWORD_2, process.env.EMAIL_FROM_2),
    ];
    return NextResponse.json({ providers, checkedAt: new Date().toISOString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Unauthorized" }, { status });
  }
}