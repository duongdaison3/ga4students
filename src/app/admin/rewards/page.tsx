"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, CheckCircle, XCircle, Search, RefreshCw } from "lucide-react";

export default function AdminRewardsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [filter, setFilter] = useState("all");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reward_requests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (requestId: string, newStatus: string) => {
    if (newStatus === "rejected") {
      if (!confirm("Hủy đơn này sẽ hoàn lại điểm cho học viên. Bạn có chắc chắn không?")) return;
    } else {
      if (!confirm(`Chuyển trạng thái đơn này thành: ${newStatus === 'processing' ? 'Đang giao hàng' : 'Hoàn thành'}?`)) return;
    }

    setProcessingId(requestId);
    try {
      const { auth } = await import("@/lib/firebase");
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ requestId, status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi hệ thống");

      alert(data.message);
      
      // Update UI
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => filter === "all" || r.status === filter);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Gift className="w-8 h-8 text-[#4285F4]" />
            Quản lý Đổi Quà
          </h1>
          <p className="text-slate-500 mt-2">Xử lý các yêu cầu đổi quà từ học viên</p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 mr-2">Lọc trạng thái:</span>
          {['all', 'pending', 'processing', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === status
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' && 'Tất cả'}
              {status === 'pending' && 'Chờ xử lý'}
              {status === 'processing' && 'Đang giao'}
              {status === 'completed' && 'Hoàn thành'}
              {status === 'rejected' && 'Đã hủy'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4">Thời gian</th>
                <th className="p-4">Học viên</th>
                <th className="p-4">Phần quà (Điểm)</th>
                <th className="p-4">Địa chỉ giao hàng</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Không có yêu cầu nào.</td></tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-500">
                      {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString("vi-VN") : "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{req.userFullName}</div>
                      <div className="text-sm text-slate-500">{req.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{req.rewardName}</div>
                      <div className="text-sm text-red-500 font-semibold">-{req.pointsUsed} điểm</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {req.type === 'physical' ? (
                        <>
                          <div className="font-semibold text-slate-700">SĐT: {req.phone}</div>
                          <div className="text-sm text-slate-600 line-clamp-2">{req.address}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Quà Digital (Gửi qua Email)</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                        req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        req.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        req.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {req.status === 'pending' && 'Chờ xử lý'}
                        {req.status === 'processing' && 'Đang giao'}
                        {req.status === 'completed' && 'Hoàn thành'}
                        {req.status === 'rejected' && 'Đã hủy'}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.status !== 'rejected' && req.status !== 'completed' && (
                        <div className="flex flex-col gap-2">
                          {req.status === 'pending' && (
                            <button 
                              onClick={() => updateStatus(req.id, 'processing')}
                              disabled={processingId === req.id}
                              className="w-full text-xs font-bold py-1.5 px-3 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Gửi hàng / Bàn giao
                            </button>
                          )}
                          <button 
                            onClick={() => updateStatus(req.id, 'completed')}
                            disabled={processingId === req.id}
                            className="w-full text-xs font-bold py-1.5 px-3 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Hoàn thành
                          </button>
                          <button 
                            onClick={() => updateStatus(req.id, 'rejected')}
                            disabled={processingId === req.id}
                            className="w-full text-xs font-bold py-1.5 px-3 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Hủy & Hoàn điểm
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
