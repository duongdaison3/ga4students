"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";

const upcomingEvents = [
  {
    id: "event-01",
    title: "Workshop: Tối ưu hiệu suất làm việc với Gemini",
    date: "15/07/2026",
    time: "19:00 - 21:00",
    location: "Google Meet",
    topic: "Productivity Hub",
    status: "opening" // opening, full, closed
  },
  {
    id: "event-02",
    title: "Workshop: Khám phá tiềm năng Sáng tạo cùng AI",
    date: "22/07/2026",
    time: "19:00 - 21:00",
    location: "Google Meet",
    topic: "Creativity Studio",
    status: "opening"
  }
];

export function UpcomingEvents() {
  const [user, setUser] = useState<User | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleRegisterEvent = async (eventId: string, eventTitle: string) => {
    if (!user) {
      window.location.href = "/dang-nhap";
      return;
    }

    setProcessingId(eventId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/workshops/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ workshopId: eventId, workshopTitle: eventTitle })
      });
      
      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Non-JSON response:", textResponse);
        throw new Error("Hệ thống đang gặp lỗi xử lý. Vui lòng thử lại sau.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      alert("Đăng ký sự kiện thành công! Vui lòng kiểm tra email xác nhận của bạn.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section id="upcoming" className="py-20 bg-[#f8fbff] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-100 text-[#4285F4] text-sm font-bold rounded-full mb-4">
            Đang mở đăng ký
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Sự kiện <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] to-[#34A853]">Sắp diễn ra</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lịch học chi tiết của các buổi Workshop thực tế. Hãy đăng ký ngay để giữ chỗ vì số lượng có hạn!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="bg-white border border-blue-100 rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_-10px_rgba(66,133,244,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(66,133,244,0.2)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                Chủ đề: {event.topic}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-[#4285F4] transition-colors leading-snug">
                {event.title}
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-slate-700">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-[#4285F4]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Ngày tổ chức</div>
                    <div className="font-bold">{event.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-slate-700">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
                    <Clock className="h-5 w-5 text-[#EA4335]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Thời gian</div>
                    <div className="font-bold">{event.time}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-slate-700">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-4">
                    <MapPin className="h-5 w-5 text-[#34A853]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Hình thức</div>
                    <div className="font-bold">{event.location}</div>
                  </div>
                </div>
              </div>
              
              {user ? (
                <button 
                  onClick={() => handleRegisterEvent(event.id, event.title)}
                  disabled={processingId === event.id}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold text-base transition-all ${processingId === event.id ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#4285F4] to-[#3b77db] hover:from-[#3b77db] hover:to-[#2b66c7] text-white shadow-lg hover:shadow-xl'}`}
                >
                  {processingId === event.id ? 'Đang xử lý...' : 'Đăng ký giữ chỗ'}
                  {processingId !== event.id && <ArrowRight className="h-5 w-5" />}
                </button>
              ) : (
                <button 
                  onClick={() => window.location.href = '/dang-nhap'}
                  className="w-full flex items-center justify-center py-4 px-4 rounded-xl font-bold text-base bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
                >
                  Đăng nhập để đăng ký
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
