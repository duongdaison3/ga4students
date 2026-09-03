"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { RefreshCw, Ticket, Trash2, Power } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

type GiftCode = { id: string; code: string; name: string; type: string; description: string; startsAt: { seconds: number }; expiresAt: { seconds: number }; maxUses: number; usedCount: number; active: boolean };
const initialForm = { code: "", name: "", type: "document", description: "", startsAt: "", expiresAt: "", maxUses: "1" };

function dateValue(timestamp?: { seconds: number }) { return timestamp?.seconds ? new Date(timestamp.seconds * 1000).toLocaleString("vi-VN") : "N/A"; }

export default function AdminGiftCodesPage() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify, confirm } = useNotification();

  const request = async (method: string, body?: object) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/admin/gift-codes", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi hệ thống");
    return data;
  };
  async function fetchCodes() { setLoading(true); try { setCodes(await request("GET")); } catch (error: unknown) { notify(error instanceof Error ? error.message : "Lỗi hệ thống", "error"); } finally { setLoading(false); } }
  useEffect(() => { const load = async () => { await fetchCodes(); }; void load(); }, []);

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await request("POST", form); notify("Đã tạo gift code.", "success"); setForm(initialForm); fetchCodes(); } catch (error: unknown) { notify(error instanceof Error ? error.message : "Lỗi hệ thống", "error"); } finally { setSaving(false); }
  };
  const toggleCode = async (code: GiftCode) => { try { await request("PATCH", { id: code.id, active: !code.active }); setCodes(prev => prev.map(item => item.id === code.id ? { ...item, active: !item.active } : item)); } catch (error: unknown) { notify(error instanceof Error ? error.message : "Lỗi hệ thống", "error"); } };
  const deleteCode = async (code: GiftCode) => { if (!await confirm(`Xóa gift code ${code.code}?`)) return; try { await request("DELETE", { id: code.id }); setCodes(prev => prev.filter(item => item.id !== code.id)); notify("Đã xóa gift code.", "success"); } catch (error: unknown) { notify(error instanceof Error ? error.message : "Lỗi hệ thống", "error"); } };

  const tableContent = loading ? (
    <tr><td colSpan={6} className="p-10 text-center">Đang tải dữ liệu...</td></tr>
  ) : codes.length === 0 ? (
    <tr><td colSpan={6} className="p-10 text-center text-slate-500">Chưa có gift code.</td></tr>
  ) : codes.map(code => (
    <tr key={code.id} className="border-t border-slate-100">
      <td className="p-4"><strong className="text-[#4285F4] tracking-wider">{code.code}</strong><div className="font-semibold text-slate-800">{code.name}</div><div className="text-sm text-slate-500">{code.description}</div></td>
      <td className="p-4 text-sm">{code.type === "physical" ? "Offline" : code.type === "document" ? "Tài liệu" : code.type === "digital" ? "Digital" : "Khác"}</td>
      <td className="p-4 text-sm text-slate-500">{dateValue(code.startsAt)}<br />đến {dateValue(code.expiresAt)}</td>
      <td className="p-4 font-semibold">{code.usedCount || 0} / {code.maxUses}</td>
      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${code.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{code.active ? "Đang bật" : "Đã tắt"}</span></td>
      <td className="p-4"><div className="flex gap-2"><button title={code.active ? "Tắt mã" : "Bật mã"} onClick={() => toggleCode(code)} className="p-2 rounded bg-slate-100 hover:bg-slate-200"><Power className="w-4 h-4" /></button><button title="Xóa mã" onClick={() => deleteCode(code)} className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button></div></td>
    </tr>
  ));

  return <div>
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8"><div><h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Ticket className="w-8 h-8 text-[#4285F4]" />Quản lý Gift Code</h1><p className="text-slate-500 mt-2">Tạo mã quà tặng có thời hạn và giới hạn lượt sử dụng.</p></div><button onClick={fetchCodes} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Tải lại</button></div>
    <form onSubmit={createCode} className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <input required placeholder="Mã code (VD: WELCOME2026)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border rounded-lg p-3 uppercase" />
      <input required placeholder="Tên phần quà" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg p-3" />
      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border rounded-lg p-3"><option value="document">Tài liệu</option><option value="digital">Quà digital</option><option value="physical">Quà tặng offline</option><option value="other">Khác</option></select>
      <input required min="1" type="number" placeholder="Số lượt tối đa" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="border rounded-lg p-3" />
      <label className="text-sm text-slate-500">Có hiệu lực từ<input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className="block w-full border rounded-lg p-3 mt-1 text-slate-800" /></label>
      <label className="text-sm text-slate-500">Hết hiệu lực lúc<input required type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="block w-full border rounded-lg p-3 mt-1 text-slate-800" /></label>
      <textarea placeholder="Mô tả hoặc hướng dẫn nhận quà" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded-lg p-3 md:col-span-2 min-h-20" />
      <button disabled={saving} className="md:col-span-2 bg-[#4285F4] text-white rounded-lg p-3 font-bold disabled:opacity-50">{saving ? "Đang tạo..." : "Tạo Gift Code"}</button>
    </form>
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="p-4">Mã / Phần quà</th><th className="p-4">Loại</th><th className="p-4">Hiệu lực</th><th className="p-4">Đã dùng</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr></thead><tbody>{tableContent}</tbody></table></div>
  </div>;
}