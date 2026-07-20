"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Users, Download, FileText, Video } from "lucide-react";
import { getEventStatus } from "@/lib/utils";
import Link from "next/link";

export default function EventDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch event info
        const eventDoc = await getDoc(doc(db, "events", id));
        if (!eventDoc.exists()) {
          alert("Sự kiện không tồn tại");
          router.push("/admin/events");
          return;
        }
        setEvent({ id: eventDoc.id, ...eventDoc.data() });

        // Fetch registrations
        const q = query(
          collection(db, "registrations"),
          where("eventId", "==", id)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort client-side to avoid composite index requirement
        data.sort((a: any, b: any) => b.registeredAt?.toMillis() - a.registeredAt?.toMillis());
        
        setRegistrations(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) fetchData();
  }, [id, router]);

  const handleExportCSV = () => {
    const headers = ["Họ và Tên", "Email", "Thời gian đăng ký"];
    const rows = registrations.map(r => [
      r.userFullName,
      r.userEmail,
      r.registeredAt ? new Date(r.registeredAt.seconds * 1000).toLocaleString("vi-VN") : ""
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_sach_dk_${event?.title || 'su_kien'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  if (!event) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#4285F4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sự kiện
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
        <div className="inline-block px-3 py-1 bg-blue-100 text-[#4285F4] text-xs font-bold rounded-full uppercase tracking-wider mb-4">
          {event.topic}
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{event.title}</h2>
        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
          <div><span className="font-semibold text-slate-800">Ngày:</span> {event.date}</div>
          <div><span className="font-semibold text-slate-800">Giờ:</span> {event.time}</div>
          <div><span className="font-semibold text-slate-800">Tại:</span> {event.location}</div>
          <div>
            <span className="font-semibold text-slate-800">Trạng thái: </span> 
            {(() => {
              const status = getEventStatus(event.date, event.time);
              if (status === 'upcoming') return <span className="text-green-600 font-bold">Sắp diễn ra</span>;
              if (status === 'ongoing') return <span className="text-[#4285F4] font-bold animate-pulse">Đang diễn ra</span>;
              if (status === 'past') return <span className="text-slate-500 font-bold">Đã kết thúc</span>;
              return <span className="text-slate-500 font-bold">Không xác định</span>;
            })()}
          </div>
        </div>
        
        {(event.slideLink || event.recordLink) && (
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
            {event.slideLink && (
              <a href={event.slideLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-semibold transition-colors border border-amber-100">
                <FileText className="w-4 h-4" /> Link Bài giảng (Slide)
              </a>
            )}
            {event.recordLink && (
              <a href={event.recordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-semibold transition-colors border border-purple-100">
                <Video className="w-4 h-4" /> Link Video (Record)
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#4285F4]" />
          Danh sách Đăng ký ({registrations.length})
        </h3>
        
        {registrations.length > 0 && (
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Xuất Excel (CSV)
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4 w-16 text-center">STT</th>
                <th className="p-4">Họ và Tên</th>
                <th className="p-4">Email</th>
                <th className="p-4">Thời gian đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Chưa có ai đăng ký sự kiện này.</td>
                </tr>
              ) : (
                registrations.map((reg, idx) => (
                  <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900">{reg.userFullName}</td>
                    <td className="p-4 text-slate-600">{reg.userEmail}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {reg.registeredAt?.seconds ? new Date(reg.registeredAt.seconds * 1000).toLocaleString("vi-VN") : "N/A"}
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
