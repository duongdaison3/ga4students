"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Calendar, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    registrations: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const eventsSnap = await getDocs(collection(db, "events"));
        const registrationsSnap = await getDocs(collection(db, "registrations"));

        setStats({
          users: usersSnap.size,
          events: eventsSnap.size,
          registrations: registrationsSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Bảng Điều Khiển</h2>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { name: "Tổng Sinh viên Đăng ký", value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Sự kiện (Workshop)", value: stats.events, icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
    { name: "Lượt Sinh viên tham gia", value: stats.registrations, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Bảng Điều Khiển</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${card.bg}`}>
              <card.icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.name}</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
