"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Plus, Trash2, Edit, X, Eye } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import Link from "next/link";

const TOPICS = [
  "Academic Excellence",
  "Productivity Hub",
  "Creativity Studio",
  "Tech & Innovation",
  "Lifestyle & Soft Skills",
  "Career & Future"
];

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    topic: TOPICS[0],
    description: "",
    mainContent: "",
    date: "",
    time: "",
    type: "Online",
    location: "Google Meet",
    meetingLink: "",
    status: "opening",
    speakerId: "",
    speakerName: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchSpeakers();
  }, []);

  async function fetchSpeakers() {
    try {
      const q = query(collection(db, "users"), where("role", "==", "speaker"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpeakers(data);
    } catch (error) {
      console.error("Error fetching speakers:", error);
    }
  }

  async function fetchEvents() {
    setIsLoading(true);
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editEventId) {
        await updateDoc(doc(db, "events", editEventId), {
          ...formData,
          updatedAt: new Date()
        });
        alert("Cập nhật sự kiện thành công!");
      } else {
        await addDoc(collection(db, "events"), {
          ...formData,
          createdAt: new Date()
        });
        alert("Thêm sự kiện thành công!");
      }
      setIsModalOpen(false);
      fetchEvents();
      // Reset form
      setFormData({
        title: "", topic: TOPICS[0], description: "", mainContent: "",
        date: "", time: "", type: "Online", location: "Google Meet", meetingLink: "", status: "opening",
        speakerId: "", speakerName: ""
      });
      setEditEventId(null);
    } catch (error) {
      alert("Đã xảy ra lỗi khi lưu sự kiện.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác.")) {
      try {
        await deleteDoc(doc(db, "events", id));
        fetchEvents();
      } catch (error) {
        alert("Lỗi khi xóa sự kiện");
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "opening" ? "closed" : "opening";
    try {
      await updateDoc(doc(db, "events", id), { status: newStatus });
      fetchEvents();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title || "",
      topic: event.topic || TOPICS[0],
      description: event.description || "",
      mainContent: event.mainContent || "",
      date: event.date || "",
      time: event.time || "",
      type: event.type || "Online",
      location: event.location || "",
      meetingLink: event.meetingLink || "",
      status: event.status || "opening",
      speakerId: event.speakerId || "",
      speakerName: event.speakerName || ""
    });
    setEditEventId(event.id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Sự kiện</h2>
        <button
          onClick={() => {
            setFormData({
              title: "", topic: TOPICS[0], description: "", mainContent: "",
              date: "", time: "", type: "Online", location: "Google Meet", meetingLink: "", status: "opening",
              speakerId: "", speakerName: ""
            });
            setEditEventId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#4285F4] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm sự kiện mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-500 py-10">Đang tải sự kiện...</div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 py-10">Chưa có sự kiện nào được tạo.</div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-[#4285F4] rounded-full uppercase">
                  {event.topic}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${event.status === 'opening' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {event.status === 'opening' ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{event.title}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{event.description}</p>

              <div className="mt-auto space-y-2 text-sm text-slate-500 mb-6">
                <div><span className="font-medium text-slate-700">Ngày:</span> {event.date}</div>
                <div><span className="font-medium text-slate-700">Giờ:</span> {event.time}</div>
                <div><span className="font-medium text-slate-700">Hình thức:</span> {event.type === 'Offline' ? event.location : 'Online'}</div>
                {event.type === 'Online' && event.meetingLink && (
                  <div className="truncate" title={event.meetingLink}>
                    <span className="font-medium text-slate-700">Link họp:</span> <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">{event.meetingLink}</a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-auto">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="flex-1 flex justify-center items-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Eye className="w-4 h-4" /> Danh sách ĐK
                </Link>
                <button
                  onClick={() => handleToggleStatus(event.id, event.status)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-semibold"
                  title={event.status === 'opening' ? 'Đóng đăng ký' : 'Mở đăng ký'}
                >
                  {event.status === 'opening' ? 'Đóng' : 'Mở'}
                </button>
                <button
                  onClick={() => handleEdit(event)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  title="Sửa sự kiện"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Xóa sự kiện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tạo sự kiện */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">{editEventId ? "Cập nhật Sự kiện" : "Tạo Sự kiện mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tên sự kiện <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Chủ đề <span className="text-red-500">*</span></label>
                  <select required value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none">
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ngày tổ chức <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="VD: 15/07/2026" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Thời gian <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="VD: 19:00 - 21:00" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hình thức <span className="text-red-500">*</span></label>
                  <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                {formData.type === "Online" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Link cuộc họp <span className="text-red-500">*</span></label>
                    <input required type="text" placeholder="VD: https://meet.google.com/..." value={formData.meetingLink} onChange={e => setFormData({ ...formData, meetingLink: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Địa điểm (Tại) <span className="text-red-500">*</span></label>
                    <input required type="text" placeholder="VD: Tòa nhà FPT" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Trạng thái ban đầu</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none">
                    <option value="opening">Đang mở đăng ký</option>
                    <option value="closed">Đóng đăng ký</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Giảng viên phụ trách</label>
                  <select 
                    value={formData.speakerId} 
                    onChange={e => {
                      const selectedSpeaker = speakers.find(s => s.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        speakerId: e.target.value,
                        speakerName: selectedSpeaker ? selectedSpeaker.fullName : ""
                      });
                    }} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none"
                  >
                    <option value="">-- Chọn Giảng viên --</option>
                    {speakers.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mô tả ngắn (Hiển thị ở Card) <span className="text-red-500">*</span></label>
                <textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none"></textarea>
              </div>

              <div className="space-y-2 pb-6">
                <label className="text-sm font-medium text-slate-700">Nội dung chi tiết (Rich Text)</label>
                <RichTextEditor value={formData.mainContent} onChange={val => setFormData({ ...formData, mainContent: val })} />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#4285F4] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                  {isSubmitting ? "Đang lưu..." : (editEventId ? "Lưu thay đổi" : "Tạo sự kiện")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
