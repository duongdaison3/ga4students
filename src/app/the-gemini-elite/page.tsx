"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Trophy, Star, Medal, Users, Sparkles } from "lucide-react";

export default function TheGeminiElitePage() {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Top 5 Users by points
        const usersQ = query(
          collection(db, "users"),
          orderBy("totalPoints", "desc"),
          limit(5)
        );
        const usersSnap = await getDocs(usersQ);
        const top5 = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTopUsers(top5);

        // Fetch recent active registrations
        const regQ = query(
          collection(db, "registrations"),
          orderBy("registeredAt", "desc"),
          limit(20)
        );
        const regSnap = await getDocs(regQ);
        
        // Deduplicate users in the active list
        const activeMap = new Map();
        regSnap.docs.forEach(d => {
          const data = d.data();
          if (!activeMap.has(data.userId) && !top5.find(u => u.id === data.userId)) {
            activeMap.set(data.userId, {
              id: data.userId,
              fullName: data.userFullName,
              university: data.userUniversity || "Trường Đại học",
              eventName: data.eventTitle || "Một sự kiện GSA",
              eventId: data.eventId
            });
          }
        });
        
        // Fetch actual university and event names if they were missing in the registration doc
        const { doc: firestoreDoc, getDoc: firestoreGetDoc } = await import("firebase/firestore");
        const resolvedActiveUsers = await Promise.all(
          Array.from(activeMap.values()).map(async (u) => {
            let university = u.university;
            let eventName = u.eventName;

            // Fetch university if it's the fallback
            if (university === "Trường Đại học") {
              try {
                const uDoc = await firestoreGetDoc(firestoreDoc(db, "users", u.id));
                if (uDoc.exists() && uDoc.data().university) {
                  university = uDoc.data().university;
                }
              } catch (e) {
                console.error(e);
              }
            }

            // Fetch event name if it's the fallback and eventId exists
            if (eventName === "Một sự kiện GSA" && u.eventId) {
              try {
                const eDoc = await firestoreGetDoc(firestoreDoc(db, "events", u.eventId));
                if (eDoc.exists() && eDoc.data().title) {
                  eventName = eDoc.data().title;
                }
              } catch (e) {
                console.error(e);
              }
            }

            return { ...u, university, eventName };
          })
        );
        
        setActiveUsers(resolvedActiveUsers);
      } catch (error) {
        console.error("Lỗi khi tải bảng vàng:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pb-16">
        {/* Header Hero */}
        <div className="bg-slate-900 pt-20 pb-24 px-4 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full mb-6 font-semibold uppercase tracking-widest text-sm">
              <Sparkles className="w-4 h-4" /> Bảng vàng danh dự
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gemini Elite</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300">
              Nơi vinh danh những tài năng xuất sắc và năng động nhất trong cộng đồng Gemini Academy for Students.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-5xl -mt-10 relative z-20">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#4285F4] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Đang tải bảng xếp hạng...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Top 5 Leaderboard */}
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  <h2 className="text-2xl font-bold text-slate-800">Top 5 Học Giả Xuất Sắc Nhất</h2>
                </div>
                
                {topUsers.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                    Chưa có dữ liệu xếp hạng. Bảng vàng đang chờ đón những cái tên đầu tiên!
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {topUsers.map((user, index) => {
                      // Determine rank styling
                      let rankBadge = null;
                      let bgClass = "bg-slate-50 hover:bg-slate-100 border-slate-100";
                      
                      if (index === 0) {
                        rankBadge = <Medal className="w-8 h-8 text-yellow-400 drop-shadow-md" />;
                        bgClass = "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-md transform hover:-translate-y-1 transition-transform";
                      } else if (index === 1) {
                        rankBadge = <Medal className="w-8 h-8 text-slate-300 drop-shadow-md" />;
                        bgClass = "bg-slate-50 border-slate-200 shadow-sm";
                      } else if (index === 2) {
                        rankBadge = <Medal className="w-8 h-8 text-amber-600 drop-shadow-md" />;
                        bgClass = "bg-orange-50/50 border-orange-100 shadow-sm";
                      } else {
                        rankBadge = <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">{index + 1}</div>;
                      }

                      return (
                        <div key={user.id} className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border ${bgClass}`}>
                          <div className="flex-shrink-0 w-12 flex justify-center">
                            {rankBadge}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 truncate">
                              {user.fullName || "Sinh viên ẩn danh"}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {user.university || "Trường Đại học"}
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0 text-right">
                            <div className="text-2xl font-black text-[#4285F4]">
                              {user.totalPoints || 0}
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Điểm
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Users List */}
              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <Users className="w-7 h-7 text-green-500" />
                  <h2 className="text-xl font-bold text-slate-800">Cộng Đồng Năng Động</h2>
                </div>
                
                <p className="text-slate-500 mb-6">
                  Danh sách những học viên tích cực đăng ký và tham gia các sự kiện gần đây của Gemini Academy.
                </p>

                {activeUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic">
                    Đang cập nhật danh sách...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeUsers.map((user, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-[#eaf1ff] text-[#4285F4] flex items-center justify-center font-bold flex-shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{user.fullName}</h4>
                          <p className="text-xs text-slate-500 truncate">{user.university}</p>
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-semibold truncate max-w-full">
                            <Star className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Vừa đ.ký: {user.eventName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
