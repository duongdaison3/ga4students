"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Gift, MapPin, Phone, Mail, Calendar, CircleCheck } from "lucide-react";
import { auth } from "@/lib/firebase";

 type RewardRequest = { id: string; userFullName?: string; userEmail?: string; rewardName?: string; rewardId?: string; pointsUsed?: number; type?: string; phone?: string; address?: string; status?: string; createdAt?: string; updatedAt?: string; description?: string; giftCode?: string; isGuest?: boolean };

const statusLabels: Record<string, string> = { pending: "Chờ xử lý", processing: "Đang giao", completed: "Hoàn thành", rejected: "Đã hủy" };

export default function AdminRewardDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<RewardRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/admin/rewards/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải chi tiết.");
        setRequest(data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết.");
      }
    };
    void load();
  }, [params.id]);

  if (error) return <div className="bg-white rounded-2xl border border-red-200 p-8 text-red-700">{error}</div>;
  if (!request) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-slate-500">Đang tải chi tiết đổi quà...</div>;

  return <div className="max-w-4xl">
    <Link href="/admin/rewards" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline mb-6"><ArrowLeft className="w-4 h-4" />Quay lại Quản lý Đổi Quà</Link>
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-6"><div><h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Gift className="w-8 h-8 text-[#4285F4]" />Chi tiết đổi quà</h1><p className="text-sm text-slate-500 mt-2">Mã yêu cầu: {request.id}</p></div><span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold"><CircleCheck className="w-4 h-4" />{statusLabels[request.status || ""] || request.status}</span></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6"><h2 className="font-bold text-slate-800 mb-4">Người nhận</h2><dl className="space-y-4 text-sm"><div><dt className="text-slate-500">Họ và tên</dt><dd className="font-bold text-slate-800">{request.userFullName || "N/A"}</dd></div><div className="flex gap-3"><Mail className="w-4 h-4 text-slate-400 mt-0.5" /><div><dt className="text-slate-500">Email</dt><dd className="font-semibold text-slate-800 break-all">{request.userEmail || "N/A"}</dd></div></div>{request.phone && <div className="flex gap-3"><Phone className="w-4 h-4 text-slate-400 mt-0.5" /><div><dt className="text-slate-500">Số điện thoại</dt><dd className="font-semibold text-slate-800">{request.phone}</dd></div></div>}{request.address && <div className="flex gap-3"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><div><dt className="text-slate-500">Địa chỉ nhận quà</dt><dd className="font-semibold text-slate-800 whitespace-pre-wrap">{request.address}</dd></div></div>}</dl></section>
      <section className="bg-white rounded-2xl border border-slate-200 p-6"><h2 className="font-bold text-slate-800 mb-4">Phần quà</h2><dl className="space-y-4 text-sm"><div><dt className="text-slate-500">Tên quà</dt><dd className="font-bold text-slate-800">{request.rewardName || "N/A"}</dd></div><div><dt className="text-slate-500">Mã quà</dt><dd className="font-semibold text-slate-800">{request.rewardId || "N/A"}</dd></div><div><dt className="text-slate-500">Điểm đã trừ</dt><dd className="font-bold text-red-600">-{request.pointsUsed || 0} điểm</dd></div>{request.giftCode && <div><dt className="text-slate-500">Gift Code</dt><dd className="font-semibold text-blue-600">{request.giftCode}</dd></div>}{request.description && <div><dt className="text-slate-500">Mô tả / hướng dẫn</dt><dd className="whitespace-pre-wrap text-slate-800">{request.description}</dd></div>}</dl></section>
      <section className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2"><h2 className="font-bold text-slate-800 mb-4">Thời gian</h2><div className="flex gap-3 text-sm text-slate-700"><Calendar className="w-4 h-4 text-slate-400 mt-0.5" /><div><p>Tạo lúc: {request.createdAt ? new Date(request.createdAt).toLocaleString("vi-VN") : "N/A"}</p><p className="mt-1">Cập nhật: {request.updatedAt ? new Date(request.updatedAt).toLocaleString("vi-VN") : "N/A"}</p></div></div></section>
    </div>
  </div>;
}
