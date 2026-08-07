"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, MapPin, ArrowLeft, ArrowRight, User as UserIcon, Share2, MessageCircle, Sparkles, CheckCircle } from "lucide-react";
import { getEventStatus } from "@/lib/utils";
import Link from "next/link";

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);
  const [missionLoading, setMissionLoading] = useState<string | null>(null);
  const [shareStep, setShareStep] = useState(0);
  const [recapStep, setRecapStep] = useState(0);

  useEffect(() => {
    let userUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && id) {
        userUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDebugData(data);
            const registered = data.registeredWorkshops || [];
            setIsRegistered(registered.includes(id as string));
          } else {
            setDebugData("User doc does not exist");
          }
        });

        // Fetch claimed missions
        const q = query(
          collection(db, "user_missions"),
          where("userId", "==", currentUser.uid),
          where("eventId", "==", id)
        );
        const snap = await getDocs(q);
        setClaimedMissions(snap.docs.map(d => d.data().missionType));
      } else {
        if (userUnsubscribe) userUnsubscribe();
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

    return () => {
      unsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
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
        if (data.error === "Bạn đã đăng ký tham gia buổi học này rồi.") {
          setIsRegistered(true);
        }
        throw new Error(data.error || "Đăng ký thất bại");
      }

      alert("🎉 Đăng ký sự kiện thành công! Bạn đã được cộng +10 điểm.\n\nVui lòng kéo xuống phần 'Nhiệm vụ The Gemini Elite' bên dưới để làm nhiệm vụ và kiếm thêm điểm thưởng nhé!");
      setIsRegistered(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClaimMission = async (missionType: string) => {
    if (!user || !event) return;

    const status = getEventStatus(event.date, event.time);

    if (missionType === 'share' && status === 'past') {
      alert("Chỉ có thể chia sẻ khi sự kiện chưa hoặc đang diễn ra.");
      return;
    }

    if (missionType === 'recap' && status !== 'past') {
      alert("Chỉ có thể nhận điểm Recap sau khi sự kiện đã kết thúc.");
      return;
    }

    setMissionLoading(missionType);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/missions/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ eventId: event.id, missionType, targetUserId: user.uid })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi nhận điểm");

      alert(`Thành công! Bạn được cộng ${data.points} điểm.`);
      setClaimedMissions([...claimedMissions, missionType]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setMissionLoading(null);
    }
  };

  const handleShareClick = () => {
    if (!user || !event) return;
    const status = getEventStatus(event.date, event.time);

    if (status === 'past') {
      alert("Chỉ có thể chia sẻ khi sự kiện chưa hoặc đang diễn ra.");
      return;
    }

    if (shareStep === 0) {
      const shareText = `${user.displayName || 'Mình'} mời bạn tham gia sự kiện ${event.title} được tổ chức tại: ${window.location.href}\n\n${event.description}\n\nĐăng ký tham gia ngay để CÓ CƠ HỘI nhận giấy chứng nhận từ Google cùng nhiều phần quà hấp dẫn.`;

      navigator.clipboard.writeText(shareText).then(() => {
        alert("Đã copy nội dung bài đăng! Hệ thống sẽ mở Facebook. Vui lòng dán (Ctrl+V) vào bài viết của bạn nhé.");
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
        setShareStep(1);
      }).catch(err => {
        console.error("Lỗi copy clipboard", err);
        alert("Không thể copy tự động, vui lòng thử lại sau.");
      });
    } else {
      handleClaimMission('share');
    }
  };

  const handleRecapClick = () => {
    if (!user || !event) return;
    const status = getEventStatus(event.date, event.time);

    if (status !== 'past') {
      alert("Chỉ có thể nhận điểm Recap sau khi sự kiện đã kết thúc.");
      return;
    }

    if (recapStep === 0) {
      const recapText = `[RECAP SỰ KIỆN: ${event.title}]\nXin chào mọi người, mình là ${user.displayName || 'một thành viên lớp'}.\nĐây là một số bài học và cảm nhận của mình sau sự kiện ngày ${event.date}...\n\n(Vui lòng viết tiếp cảm nhận của bạn vào đây)`;

      navigator.clipboard.writeText(recapText).then(() => {
        alert("Đã copy mẫu Recap! Hệ thống sẽ mở Zalo. Vui lòng dán (Ctrl+V) vào Nhóm Zalo lớp học và viết thêm cảm nhận của bạn nhé.");
        window.open('https://chat.zalo.me/', '_blank');
        setRecapStep(1);
      }).catch(err => {
        console.error("Lỗi copy clipboard", err);
        alert("Không thể copy tự động, vui lòng thử lại sau.");
      });
    } else {
      handleClaimMission('recap');
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
          {event.status === 'opening' && getEventStatus(event.date, event.time) !== 'past' ? (
            <div className="bg-gradient-to-br from-[#4285F4] to-[#3b77db] rounded-3xl p-8 md:p-12 text-white text-center shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Sẵn sàng nâng cấp kỹ năng?</h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Đăng ký ngay để giữ chỗ vì số lượng tham gia có giới hạn. Thông tin chi tiết về buổi học sẽ được gửi qua email cho bạn.
              </p>

              {user ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleRegister}
                    disabled={processing || isRegistered}
                    className={`inline-flex items-center justify-center gap-2 py-4 px-8 rounded-full font-bold text-lg transition-all ${isRegistered ? 'bg-slate-100 text-slate-500 cursor-not-allowed shadow-none border border-slate-200' : processing ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-white text-[#4285F4] hover:bg-slate-50 hover:shadow-lg'}`}
                  >
                    {isRegistered ? 'Bạn đã đăng ký' : processing ? 'Đang xử lý...' : 'Đăng ký giữ chỗ ngay'}
                    {!isRegistered && !processing && <ArrowRight className="h-5 w-5" />}
                  </button>
                    {debugData && (
                      <div className="mt-4 p-4 bg-red-100 text-red-800 text-xs text-left w-full max-w-md overflow-auto">
                        <strong>DEBUG INFO:</strong><br />
                        ID: {id as string}<br />
                        isRegistered State: {String(isRegistered)}<br />
                        Auth UID: {user?.uid}<br />
                        Doc: {JSON.stringify(debugData, null, 2)}
                      </div>
                    )}
                </div>
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

          {/* Missions Board */}
          {user && isRegistered && event && (
            <div className="mt-8 bg-white rounded-3xl p-8 border border-amber-200 shadow-[0_10px_40px_-10px_rgba(251,188,5,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-amber-500" />
                <h2 className="text-2xl font-bold text-slate-800">Nhiệm vụ The Gemini Elite</h2>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm">
                <strong>💡 Mẹo kiếm điểm:</strong> Đăng ký thành công bạn đã có <strong>+10đ</strong>. Hãy hoàn thành các nhiệm vụ bên dưới để tích lũy thêm tới <strong>+250đ</strong> cho sự kiện này và lọt vào Bảng Vàng nhé!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nhiệm vụ 1: Điểm danh */}
                <div className={`p-5 rounded-2xl border ${claimedMissions.includes('attendance') ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" /> Tham gia Sự kiện
                    </h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">+100đ</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Có mặt tham gia sự kiện và được Admin điểm danh.</p>
                  {claimedMissions.includes('attendance') ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Đã hoàn thành
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm italic">Chờ Admin điểm danh...</div>
                  )}
                </div>

                {/* Nhiệm vụ 2: Chia sẻ */}
                <div className={`p-5 rounded-2xl border ${claimedMissions.includes('share') ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Chia sẻ Sự kiện
                    </h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">+100đ</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Chia sẻ trang sự kiện này lên Facebook / Zalo cá nhân của bạn.</p>
                  {claimedMissions.includes('share') ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Đã hoàn thành
                    </div>
                  ) : (
                    <button
                      onClick={handleShareClick}
                      disabled={missionLoading === 'share'}
                      className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${shareStep === 1
                          ? "bg-[#4285F4] text-white hover:bg-blue-600"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-[#4285F4]"
                        }`}
                    >
                      {missionLoading === 'share'
                        ? 'Đang xử lý...'
                        : shareStep === 1
                          ? 'Đã chia sẻ (Nhận điểm)'
                          : 'Đăng Facebook & Nhận điểm'}
                    </button>
                  )}
                </div>

                {/* Nhiệm vụ 3: Recap */}
                <div className={`p-5 rounded-2xl border ${claimedMissions.includes('recap') ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Tham gia Recap
                    </h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">+100đ</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Chia sẻ cảm nhận/bài học sau sự kiện vào Nhóm Zalo lớp học.</p>
                  {claimedMissions.includes('recap') ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Đã hoàn thành
                    </div>
                  ) : (
                    <button
                      onClick={handleRecapClick}
                      disabled={missionLoading === 'recap' || getEventStatus(event.date, event.time) !== 'past'}
                      className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${getEventStatus(event.date, event.time) !== 'past'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent'
                          : recapStep === 1
                            ? 'bg-[#4285F4] text-white hover:bg-blue-600'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-[#4285F4]'
                        }`}
                      title={getEventStatus(event.date, event.time) !== 'past' ? 'Chỉ mở sau khi sự kiện kết thúc' : ''}
                    >
                      {missionLoading === 'recap'
                        ? 'Đang xử lý...'
                        : getEventStatus(event.date, event.time) !== 'past'
                          ? 'Chưa mở'
                          : recapStep === 1
                            ? 'Xác nhận Nhận điểm Recap'
                            : 'Đăng Zalo & Nhận điểm'}
                    </button>
                  )}
                </div>

                {/* Nhiệm vụ 4: Thực hành Gemini */}
                <div className={`p-5 rounded-2xl border ${claimedMissions.includes('gemini_prompt') ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" /> Thực hành Gemini
                    </h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">+50đ</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Ứng dụng thử các câu lệnh Prompt được học vào Gemini.</p>
                  {claimedMissions.includes('gemini_prompt') ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Đã hoàn thành
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimMission('gemini_prompt')}
                      disabled={missionLoading === 'gemini_prompt'}
                      className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-purple-400 transition-colors"
                    >
                      {missionLoading === 'gemini_prompt' ? 'Đang xử lý...' : 'Đã thực hành (Nhận điểm)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
