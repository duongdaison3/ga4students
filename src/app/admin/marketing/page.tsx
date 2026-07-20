"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Send, Users, FileText, CheckCircle2 } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface Event {
  recordLink: any;
  slideLink: any;
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  meetingLink?: string;
  status: string;
}

export default function MarketingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateType, setTemplateType] = useState<"reminder" | "thankyou">("reminder");
  const [customEmails, setCustomEmails] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersSnap, eventsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))),
          getDocs(collection(db, "events"))
        ]);

        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

        setUsers(usersData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(users.map(u => u.email).filter(Boolean)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (email: string) => {
    if (!email) return;
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedUsers(newSelected);
  };

  const handleTemplateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (event) {
      if (templateType === "reminder") {
        setSubject(`[Nhắc nhở sự kiện] ${event.title}`);
        const locationInfo = event.type === 'Online'
          ? `<strong>Microsoft Teams:</strong> <a href="${event.meetingLink}">${event.meetingLink}</a>`
          : `<strong>Địa điểm:</strong> ${event.location}`;

        setContent(`
          <h3 style="color: #4285F4; margin-top: 0;">Xin chào {{name}},</h3>
          <p>Sự kiện <strong>${event.title}</strong> sắp diễn ra. Đừng quên tham gia cùng chúng mình nhé!</p>
          <div style="background-color: #f8fbff; padding: 15px; border-radius: 8px; border-left: 4px solid #4285F4; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Thời gian:</strong> ${event.time} - ${event.date}</p>
            <p style="margin: 5px 0;">${locationInfo}</p>
          </div>
          <p style="text-align: center; margin: 24px 0;">
            <a href="#" style="background-color: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600;">Xem chi tiết sự kiện</a>
          </p>
          <p>Hẹn gặp lại bạn tại sự kiện!</p>
        `);
      } else {
        setSubject(`[Thư cảm ơn] Cảm ơn bạn đã tham gia ${event.title}`);
        setContent(`
          <h3 style="color: #4285F4; margin-top: 0;">Xin chào {{name}},</h3>
          <p>Đầu tiên, mình muốn gửi lời cảm ơn chân thành nhất đến tất cả các bạn vì đã dành thời gian tham gia buổi workshop <strong>${event.title}</strong> vừa qua.</p>
          <p>Hy vọng rằng sau buổi chia sẻ, các bạn đã bỏ túi được những kiến thức bổ ích và áp dụng ngay vào quá trình học tập.</p>
          <p>Để giúp các bạn dễ dàng ôn lại kiến thức, mình xin gửi lại toàn bộ tài nguyên của buổi workshop:</p>
          <div style="background-color: #f8fbff; padding: 15px; border-radius: 8px; border-left: 4px solid #4285F4; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📚 Tài liệu & Bản ghi hình:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${event.slideLink ? `<li><strong>Slide bài giảng:</strong> <a href="${event.slideLink}">Xem tại đây</a></li>` : ''}
              ${event.recordLink ? `<li><strong>Video Record:</strong> <a href="${event.recordLink}">Xem tại đây</a></li>` : ''}
              ${!event.slideLink && !event.recordLink ? '<li>Đang cập nhật tài liệu...</li>' : ''}
            </ul>
          </div>
          <p>Nếu có bất kỳ thắc mắc nào, bạn cứ thoải mái reply lại email này để mình hỗ trợ nhé.</p>
          <p>Chúc các bạn một tuần học tập và làm việc hiệu quả!</p>
        `);
      }

      try {
        const regsSnap = await getDocs(query(collection(db, "registrations"), where("eventId", "==", eventId)));
        const registeredEmails = new Set<string>();
        regsSnap.forEach(doc => {
          const data = doc.data();
          if (data.userEmail) {
            registeredEmails.add(data.userEmail);
          }
        });
        setSelectedUsers(registeredEmails);
      } catch (error) {
        console.error("Error fetching registrations:", error);
      }
    }
  };

  const handleSend = async () => {
    const parsedCustomEmails = customEmails
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

    const allRecipients = users
      .filter(u => selectedUsers.has(u.email))
      .map(u => ({ email: u.email, name: u.fullName || u.email.split('@')[0] }));

    parsedCustomEmails.forEach(email => {
      if (!allRecipients.find(r => r.email === email)) {
        allRecipients.push({ email, name: email.split('@')[0] });
      }
    });

    if (allRecipients.length === 0) {
      setErrorMsg("Vui lòng chọn hoặc nhập ít nhất 1 người nhận hợp lệ.");
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    setIsSending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients: allRecipients,
          subject,
          htmlContent: content
        })
      });

      if (!res.ok) {
        throw new Error("Lỗi gửi email");
      }

      setSuccessMsg(`Đã gửi thành công đến ${selectedUsers.size} người dùng.`);
      setSubject("");
      setContent("");
      setSelectedUsers(new Set());
    } catch (error) {
      console.error(error);
      setErrorMsg("Có lỗi xảy ra khi gửi email.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-slate-200 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Email Marketing</h2>
        <p className="text-slate-500 mt-1">Gửi thông báo, nhắc lịch sự kiện cho người dùng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Users Selection */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
            <Users className="w-5 h-5 text-[#4285F4]" />
            <h3>Người nhận ({selectedUsers.size}/{users.filter(u => u.email).length})</h3>
          </div>

          <div className="mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAll"
              className="rounded border-slate-300 text-[#4285F4] focus:ring-[#4285F4]"
              onChange={handleSelectAll}
              checked={selectedUsers.size > 0 && selectedUsers.size === users.filter(u => u.email).length}
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-slate-700 cursor-pointer">
              Chọn tất cả
            </label>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => {
              if (!user.email) return null;
              return (
                <div key={user.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    className="mt-1 rounded border-slate-300 text-[#4285F4] focus:ring-[#4285F4]"
                    checked={selectedUsers.has(user.email)}
                    onChange={() => handleSelectUser(user.email)}
                  />
                  <label htmlFor={`user-${user.id}`} className="cursor-pointer">
                    <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Thêm Email ngoài hệ thống
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
              rows={3}
              placeholder="Nhập email (ngăn cách bằng dấu phẩy hoặc xuống dòng)..."
              value={customEmails}
              onChange={e => setCustomEmails(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Thích hợp dùng cho người tham gia không đăng ký qua form.</p>
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">

            {/* Template Selector */}
            {events.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Loại Mẫu
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
                  >
                    <option value="reminder">Nhắc nhở tham gia (Sắp diễn ra)</option>
                    <option value="thankyou">Thư cảm ơn (Đã kết thúc)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    Chọn Sự kiện để điền mẫu
                  </label>
                  <select
                    onChange={handleTemplateSelect}
                    defaultValue=""
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
                  >
                    <option value="" disabled>-- Chọn sự kiện --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề Email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">Nội dung</label>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Mẹo: Nhập <strong>{`{{name}}`}</strong> để chèn tên người nhận.</span>
              </div>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Soạn nội dung email... (Ví dụ: Xin chào {{name}})"
              />
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSend}
                disabled={isSending}
                className={`flex items-center gap-2 bg-[#4285F4] text-white px-6 py-3 rounded-xl font-bold transition-all ${isSending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600 hover:shadow-md'}`}
              >
                <Send className="w-5 h-5" />
                {isSending ? "Đang gửi..." : "Gửi Email Hàng Loạt"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
