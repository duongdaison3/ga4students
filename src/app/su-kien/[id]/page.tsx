"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, MapPin, ArrowLeft, ArrowRight, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && id) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const registered = userDoc.data().registeredWorkshops || [];
          setIsRegistered(registered.includes(id as string));
        }
      }
    });

    async function fetchEvent() {
      try {
        const docRef = doc(db, "events", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchEvent();
    }

    return () => unsubscribe();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      router.push("/dang-nhap");
      return;
    }

    setProcessing(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/workshops/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ workshopId: event.id, workshopTitle: event.title })
      });
      
      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error("Hệ thống đang gặp lỗi xử lý. Vui lòng thử lại sau.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      alert("Đăng ký sự kiện thành công! Vui lòng kiểm tra email xác nhận của bạn.");
      setIsRegistered(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-slate-500">Đang tải thông tin sự kiện...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col justify-center items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Không tìm thấy sự kiện</h1>
          <Link href="/su-kien" className="text-[#4285F4] hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <Link href="/su-kien" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4285F4] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sự kiện
          </Link>
          
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 mb-8">
            <div className="inline-block px-4 py-1.5 bg-blue-100 text-[#4285F4] text-sm font-bold rounded-full mb-6 uppercase tracking-wider">
              {event.topic}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
              {event.title}
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              {event.description}
            </p>
            
            <div className={`grid grid-cols-2 ${event.speakerName ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 py-8 border-y border-slate-100 mb-10`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-slate-500 gap-2 font-medium">
                  <Calendar className="w-5 h-5 text-[#4285F4]" /> Ngày tổ chức
                </div>
                <div className="text-lg font-bold text-slate-800">{event.date}</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-slate-500 gap-2 font-medium">
                  <Clock className="w-5 h-5 text-[#EA4335]" /> Thời gian
                </div>
                <div className="text-lg font-bold text-slate-800">{event.time}</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-slate-500 gap-2 font-medium">
                  <MapPin className="w-5 h-5 text-[#34A853]" /> Hình thức
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {event.type === 'Offline' ? event.location : 'Online'}
                </div>
              </div>
              {event.speakerName && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-slate-500 gap-2 font-medium">
                    <UserIcon className="w-5 h-5 text-orange-500" /> Giảng viên
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {event.speakerName}
                  </div>
                </div>
              )}
            </div>

            {/* Rich Text Content */}
            {event.mainContent && (
              <div 
                className="prose prose-slate prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: event.mainContent.replace(/&nbsp;/g, ' ') }}
              />
            )}
          </div>
          
          {/* Registration Box */}
          {event.status === 'opening' ? (
            <div className="bg-gradient-to-br from-[#4285F4] to-[#3b77db] rounded-3xl p-8 md:p-12 text-white text-center shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Sẵn sàng nâng cấp kỹ năng?</h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Đăng ký ngay để giữ chỗ vì số lượng tham gia có giới hạn. Thông tin chi tiết về buổi học sẽ được gửi qua email cho bạn.
              </p>
              
              {user ? (
                <button 
                  onClick={handleRegister}
                  disabled={processing || isRegistered}
                  className={`inline-flex items-center justify-center gap-2 py-4 px-8 rounded-full font-bold text-lg transition-all ${isRegistered ? 'bg-slate-100 text-slate-500 cursor-not-allowed shadow-none border border-slate-200' : processing ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-white text-[#4285F4] hover:bg-slate-50 hover:shadow-lg'}`}
                >
                  {isRegistered ? 'Bạn đã đăng ký' : processing ? 'Đang xử lý...' : 'Đăng ký giữ chỗ ngay'}
                  {!isRegistered && !processing && <ArrowRight className="h-5 w-5" />}
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/dang-nhap')}
                  className="inline-flex items-center justify-center py-4 px-8 rounded-full font-bold text-lg bg-white text-slate-800 hover:bg-slate-50 hover:shadow-lg transition-all"
                >
                  Đăng nhập để đăng ký
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-3xl p-8 text-center text-slate-500 font-medium">
              Sự kiện này đã đóng đăng ký.
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
