"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, MapPin, Clock, ArrowRight, User as UserIcon, Video, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { getEventStatus } from "@/lib/utils";

export function UpcomingEvents() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredWorkshops, setRegisteredWorkshops] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", currentUser.uid)));
        if (!userDoc.empty) {
          setRegisteredWorkshops(userDoc.docs[0].data().registeredWorkshops || []);
        }
      } else {
        setRegisteredWorkshops([]);
      }
    });

    async function fetchEvents() {
      try {
        const snap = await getDocs(collection(db, "events"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt client-side
        data.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();

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
      setRegisteredWorkshops((prev) => [...prev, eventId]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const ongoingEvents = events.filter(e => getEventStatus(e.date, e.time) === 'ongoing');
  const upcomingEvents = events.filter(e => getEventStatus(e.date, e.time) === 'upcoming');
  const pastEvents = events.filter(e => getEventStatus(e.date, e.time) === 'past');

  const renderEventCard = (event: any, status: 'ongoing' | 'upcoming' | 'past') => {
    const isRegistered = registeredWorkshops.includes(event.id);
    const isPast = status === 'past';

    return (
      <div key={event.id} className={`bg-white border ${status === 'ongoing' ? 'border-[#4285F4] shadow-[0_10px_40px_-10px_rgba(66,133,244,0.3)]' : 'border-blue-100 shadow-[0_10px_40px_-10px_rgba(66,133,244,0.15)]'} rounded-3xl p-6 md:p-8 hover:shadow-[0_20px_50px_-10px_rgba(66,133,244,0.2)] transition-all duration-300 group relative overflow-hidden flex flex-col ${isPast ? 'opacity-80' : ''}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500 ${status === 'ongoing' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' : isPast ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gradient-to-br from-blue-50 to-green-50'}`}></div>
        
        <div className="flex justify-between items-start mb-4">
          <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Chủ đề: {event.topic}
          </div>
          {status === 'ongoing' && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-red-100 text-red-600 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Đang diễn ra
            </span>
          )}
        </div>
        
        <h3 className={`text-2xl font-bold mb-2 transition-colors leading-snug ${status === 'ongoing' ? 'text-[#4285F4]' : 'text-slate-900 group-hover:text-[#4285F4]'}`}>
          {event.title}
        </h3>

        <p className="text-sm text-slate-600 mb-6 line-clamp-3">
          {event.description}
        </p>
        
        <div className="space-y-4 mb-8 mt-auto">
          <div className="flex items-center text-slate-700">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${isPast ? 'bg-slate-100' : 'bg-blue-50'}`}>
              <Calendar className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-[#4285F4]'}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Ngày tổ chức</div>
              <div className="font-bold">{event.date}</div>
            </div>
          </div>
          
          <div className="flex items-center text-slate-700">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${isPast ? 'bg-slate-100' : 'bg-red-50'}`}>
              <Clock className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-[#EA4335]'}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Thời gian</div>
              <div className="font-bold">{event.time}</div>
            </div>
          </div>
          
          <div className="flex items-center text-slate-700">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${isPast ? 'bg-slate-100' : 'bg-green-50'}`}>
              <MapPin className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-[#34A853]'}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Hình thức</div>
              <div className="font-bold">{event.location}</div>
            </div>
          </div>
          
          {event.speakerName && (
            <div className="flex items-center text-slate-700">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${isPast ? 'bg-slate-100' : 'bg-orange-50'}`}>
                <UserIcon className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Giảng viên</div>
                <div className="font-bold">{event.speakerName}</div>
              </div>
            </div>
          )}
        </div>
      
        {/* Buttons / Actions Area */}
        {isPast ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {event.slideLink ? (
                <a href={event.slideLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-100">
                  <FileText className="w-4 h-4" /> Xem Slide
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed">
                  <FileText className="w-4 h-4" /> Chưa có Slide
                </div>
              )}
              {event.recordLink ? (
                <a href={event.recordLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all border border-purple-100">
                  <Video className="w-4 h-4" /> Xem Record
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed">
                  <Video className="w-4 h-4" /> Chưa có Record
                </div>
              )}
            </div>
            <Link 
              href={`/su-kien/${event.id}`}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
            >
              Xem lại chi tiết sự kiện
            </Link>
          </div>
        ) : (
          user ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href={`/su-kien/${event.id}`}
                className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm bg-blue-50 text-[#4285F4] hover:bg-blue-100 transition-all border border-blue-100"
              >
                Chi tiết
              </Link>
              {isRegistered ? (
                event.type === 'Online' && event.meetingLink ? (
                  <a 
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl transition-all"
                  >
                    Tham gia Meet <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-green-50 text-green-700 border border-green-200">
                    Bạn đã đăng ký
                  </div>
                )
              ) : (
                <button 
                  onClick={() => handleRegisterEvent(event.id, event.title)}
                  disabled={processingId === event.id}
                  className={`flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${processingId === event.id ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#4285F4] to-[#3b77db] hover:from-[#3b77db] hover:to-[#2b66c7] text-white shadow-lg hover:shadow-xl'}`}
                >
                  {processingId === event.id ? 'Đang xử lý...' : 'Đăng ký giữ chỗ'}
                  {processingId !== event.id && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href={`/su-kien/${event.id}`}
                className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm bg-blue-50 text-[#4285F4] hover:bg-blue-100 transition-all border border-blue-100"
              >
                Chi tiết
              </Link>
              <button 
                onClick={() => window.location.href = '/dang-nhap'}
                className="flex-[1.5] flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
              >
                Đăng nhập để ĐK
              </button>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <section id="upcoming" className="py-20 bg-[#f8fbff] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 md:px-6 space-y-24">
        
        {/* Lịch học / Tổng quan */}
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-blue-100 text-[#4285F4] text-sm font-bold rounded-full mb-4">
            Lịch trình
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Chương trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] to-[#34A853]">Đào tạo</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Khám phá và tham gia các buổi Workshop thực tế. Đừng bỏ lỡ cơ hội học hỏi và nhận tài liệu bổ ích!
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-slate-500 py-12">Đang tải dữ liệu sự kiện...</div>
        ) : (
          <div className="space-y-20 max-w-5xl mx-auto">
            
            {/* Section: Đang diễn ra */}
            {ongoingEvents.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span> 
                  Sự kiện đang diễn ra
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {ongoingEvents.map(e => renderEventCard(e, 'ongoing'))}
                </div>
              </div>
            )}

            {/* Section: Sắp diễn ra */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                Sự kiện sắp diễn ra
              </h3>
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {upcomingEvents.map(e => renderEventCard(e, 'upcoming'))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
                  Hiện chưa có sự kiện nào sắp tới.
                </div>
              )}
            </div>

            {/* Section: Đã diễn ra */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                  Sự kiện đã kết thúc
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {pastEvents.map(e => renderEventCard(e, 'past'))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
