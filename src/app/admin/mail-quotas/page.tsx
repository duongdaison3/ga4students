"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, Gauge, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";

type Provider = {
  name: string;
  address: string | null;
  configured: boolean;
  quota: number | null;
  quotaUnit: "emails" | null;
  quotaKnown: boolean;
  note: string;
};

export default function MailQuotasPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuotas = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/mail-quotas", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải trạng thái email.");
      setProviders(data.providers);
      setCheckedAt(data.checkedAt);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải trạng thái email.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuotas();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const configuredCount = providers.filter(provider => provider.configured).length;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <Gauge className="h-7 w-7 text-[#4285F4]" />
            Hạn mức gửi email
          </h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi thứ tự fallback: Brevo → Gmail chính → Gmail dự phòng.</p>
        </div>
        <button onClick={() => void loadQuotas()} disabled={loading} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Cập nhật
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Provider đã cấu hình</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{configuredCount}/3</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm font-semibold text-slate-700">Lưu ý về số liệu</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Chỉ Brevo có thể trả quota qua API. Gmail được kiểm tra trạng thái cấu hình, còn hạn mức thực tế phải xem trong Google Account.</p>
        </div>
      </div>

      {loading && providers.length === 0 ? (
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="space-y-4">
          {providers.map((provider, index) => (
            <div key={provider.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${provider.configured ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {provider.configured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Kênh {index + 1}</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-800">{provider.name}</h2>
                    <p className="text-sm text-slate-500">{provider.address || "Chưa có địa chỉ gửi"}</p>
                  </div>
                </div>
                <div className="min-w-44 text-left md:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quota còn lại</p>
                  <p className={`mt-1 text-2xl font-extrabold ${provider.quotaKnown && provider.quota === 0 ? "text-red-600" : "text-slate-900"}`}>
                    {provider.quotaKnown ? `${provider.quota?.toLocaleString("vi-VN")} email` : "Chưa đo được"}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{provider.note}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {checkedAt && <p className="mt-6 text-xs text-slate-400">Kiểm tra lần cuối: {new Date(checkedAt).toLocaleString("vi-VN")}</p>}
    </div>
  );
}