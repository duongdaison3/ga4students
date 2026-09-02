"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Gift, AlertCircle, ShoppingBag, History, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/NotificationProvider";

const REWARDS = [
  { id: "gemini_pro_3m", name: "Gemini Pro 3 tháng", points: 2500, type: "digital", limit: "Số lượng có hạn" },
  { id: "gemini_pro_1m", name: "Gemini Pro 1 tháng", points: 2000, type: "digital", limit: "Số lượng có hạn" },
  { id: "canva_pro_1m", name: "Canva Pro 1 tháng", points: 1500, type: "digital", limit: "Số lượng có hạn" },
  { id: "digital_random", name: "Bộ quà tặng Digital ngẫu nhiên", points: 1200, type: "digital", limit: "Số lượng có hạn" },
  { id: "phys_combo", name: "Bộ quà tặng: bút, móc khóa Google", points: 650, type: "physical", limit: "Số lượng có hạn" },
  { id: "phys_keychain", name: "Móc khóa Google", points: 350, type: "physical", limit: "Số lượng có hạn" },
  { id: "phys_pen", name: "Bút bi Google", points: 350, type: "physical", limit: "Số lượng có hạn" },
  { id: "phys_random", name: "Quà lưu niệm ngẫu nhiên", points: 250, type: "physical", limit: "Số lượng có hạn" },
];

export default function RewardStorePage() {
  const router = useRouter();
  const { notify, confirm } = useNotification();
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Form state
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.push("/dang-nhap?redirect=/doi-qua");
        return;
      }
      setUser(currentUser);

      try {
        // Fetch user points
        const uDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (uDoc.exists()) {
          setUserPoints(uDoc.data().totalPoints || 0);
        }

        // Fetch redemption history
        const q = query(
          collection(db, "reward_requests"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleRedeemClick = (reward: any) => {
    if (userPoints < reward.points) {
      notify("Bạn chưa đủ điểm để đổi phần quà này.", "error");
      return;
    }
    setSelectedReward(reward);
    setAddress("");
    setPhone("");
    setFormError("");
  };

  const submitRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (selectedReward.type === "physical" && (!address || !phone)) {
      setFormError("Vui lòng điền đầy đủ số điện thoại và địa chỉ nhận quà.");
      return;
    }

    if (!await confirm(`Xác nhận dùng ${selectedReward.points} điểm để đổi ${selectedReward.name}?`)) return;

    setIsRedeeming(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          rewardName: selectedReward.name,
          points: selectedReward.points,
          type: selectedReward.type,
          address,
          phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi hệ thống");

      notify(data.message, "success");

      // Cập nhật giao diện nội bộ (giảm điểm, thêm lịch sử)
      setUserPoints(prev => prev - selectedReward.points);

      const newRecord = {
        id: "temp_" + Date.now(),
        rewardName: selectedReward.name,
        pointsUsed: selectedReward.points,
        status: "pending",
        createdAt: { seconds: Date.now() / 1000 }
      };
      setHistory(prev => [newRecord, ...prev]);

      setSelectedReward(null);
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-slate-500">Đang tải cửa hàng quà tặng...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#4285F4] to-purple-600 pt-16 pb-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Cửa Hàng Quà Tặng</h1>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
          Sử dụng điểm tích lũy The Gemini Elite của bạn để đổi lấy những phần quà độc quyền từ Google.
        </p>
        <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 text-white font-bold shadow-lg">
          <ShoppingBag className="w-5 h-5" /> Điểm hiện tại của bạn: <span className="text-2xl text-yellow-300">{userPoints}</span>
        </div>
      </div>

      <main className="flex-1 -mt-10 mb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">

          <div className="flex justify-end mb-6">
            <Link href="/the-gemini-elite" className="text-white hover:text-blue-100 flex items-center gap-2 font-medium transition-colors">
              Đến Bảng Vàng <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Nhiệm vụ kiếm điểm */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Làm sao để kiếm điểm thưởng?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">+50</div>
                <div>
                  <h3 className="font-bold text-slate-800">Đăng ký tài khoản</h3>
                  <p className="text-sm text-slate-500">Tự động nhận 1 lần duy nhất khi tạo tài khoản trên hệ thống.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">+10</div>
                <div>
                  <h3 className="font-bold text-slate-800">Đăng ký sự kiện mới</h3>
                  <p className="text-sm text-slate-500">Tự động nhận khi bấm đăng ký tham gia mỗi sự kiện.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 md:col-span-2">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-tighter">Bonus</div>
                <div>
                  <h3 className="font-bold text-amber-900">Hoàn thành nhiệm vụ sự kiện (Tới +250đ/sự kiện)</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    <strong>Lưu ý quan trọng:</strong> Bạn có thể kiếm thêm rất nhiều điểm thưởng bằng cách quay lại trang Sự kiện đã đăng ký và làm các nhiệm vụ: Điểm danh (100đ), Chia sẻ sự kiện (100đ), Thực hành Prompt (50đ)...
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">+20</div>
                <div>
                  <h3 className="font-bold text-slate-800">Nhận Giấy chứng nhận từ Google</h3>
                  <p className="text-sm text-slate-500">Nhận 20 điểm cho mỗi Giấy chứng nhận hoàn thành khoá học của Google (Liên hệ BTC để được cộng điểm).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Quà tặng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16 relative z-10">
            {REWARDS.map((reward) => (
              <div key={reward.id} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 text-slate-900 group-hover:opacity-10 transition-opacity">
                  <Gift className="w-24 h-24 -mr-6 -mt-6" />
                </div>

                <div>
                  <div className="inline-block px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded mb-3">
                    {reward.limit}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight min-h-[56px]">{reward.name}</h3>
                  <div className="text-2xl font-black text-[#4285F4] mb-6">
                    {reward.points} <span className="text-sm font-bold text-slate-400">điểm</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRedeemClick(reward)}
                  disabled={userPoints < reward.points}
                  className={`w-full py-2.5 rounded-xl font-bold transition-colors ${userPoints >= reward.points
                    ? "bg-[#4285F4] text-white hover:bg-blue-600 shadow-md shadow-blue-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {userPoints >= reward.points ? "Đổi Quà" : "Chưa đủ điểm"}
                </button>
              </div>
            ))}
          </div>

          {/* Lịch sử đổi quà */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-800">Lịch sử đổi quà của bạn</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">
                Bạn chưa đổi phần quà nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                      <th className="p-4">Phần quà</th>
                      <th className="p-4 text-center">Điểm trừ</th>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{item.rewardName}</td>
                        <td className="p-4 text-center text-red-500 font-bold">-{item.pointsUsed}</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString("vi-VN") : "N/A"}
                        </td>
                        <td className="p-4 text-center">
                          {item.status === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-600"><Clock className="w-3 h-3" /> Chờ xử lý</span>}
                          {item.status === 'processing' && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-600"><ArrowRight className="w-3 h-3" /> Đang gửi / Đã xuất kho</span>}
                          {item.status === 'completed' && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-green-50 text-green-600"><CheckCircle className="w-3 h-3" /> Hoàn thành</span>}
                          {item.status === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-red-50 text-red-600"><XCircle className="w-3 h-3" /> Đã hủy (Hoàn điểm)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />

      {/* Modal Đổi quà */}
      {selectedReward && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Xác nhận đổi quà</h2>
            <p className="text-slate-500 mb-6 border-b border-slate-100 pb-4">
              Bạn đang dùng <span className="font-bold text-[#4285F4]">{selectedReward.points} điểm</span> để đổi <span className="font-bold text-slate-800">{selectedReward.name}</span>.
            </p>

            <form onSubmit={submitRedemption}>
              {selectedReward.type === 'physical' && (
                <div className="space-y-4 mb-6">
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p><strong>Lưu ý quan trọng:</strong> Có thể áp dụng phí vận chuyển (người nhận trả phí) đối với các địa chỉ nhận quà nằm ngoài khu vực Hà Nội.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50"
                      placeholder="VD: 0987654321"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Địa chỉ nhận quà cụ thể <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/50 min-h-[80px]"
                      placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-red-500 text-sm font-medium mb-4">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReward(null)}
                  disabled={isRedeeming}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#4285F4] hover:bg-blue-600 transition-colors shadow-md shadow-blue-200 disabled:opacity-70 flex justify-center items-center"
                >
                  {isRedeeming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Xác nhận đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
