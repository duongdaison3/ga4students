"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Calendar, CheckCircle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8E44AD', '#16A085', '#F39C12'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    registrations: 0
  });

  const [chartData, setChartData] = useState({
    growth: [] as any[],
    universities: [] as any[],
    events: [] as any[]
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const eventsSnap = await getDocs(collection(db, "events"));
        const regsSnap = await getDocs(collection(db, "registrations"));

        const usersData = usersSnap.docs.map(d => d.data());
        const eventsData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const regsData = regsSnap.docs.map(d => d.data());

        setStats({
          users: usersSnap.size,
          events: eventsSnap.size,
          registrations: regsSnap.size
        });

        // 1. Growth Data
        const dateObjMap: Record<string, number> = {};
        usersData.forEach(u => {
          if (u.createdAt?.seconds) {
            const d = new Date(u.createdAt.seconds * 1000);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dateObjMap[dateKey] = (dateObjMap[dateKey] || 0) + 1;
          }
        });
        const sortedKeys = Object.keys(dateObjMap).sort();
        let cumulative = 0;
        const growth = sortedKeys.map(key => {
          cumulative += dateObjMap[key];
          const [, m, d] = key.split('-');
          return { date: `${d}/${m}`, users: cumulative };
        });

        // 2. University Data
        const uniMap: Record<string, number> = {};
        usersData.forEach(u => {
          let uni = (u.university || "Chưa cập nhật").trim();
          if (uni.length > 25) uni = uni.substring(0, 25) + "...";
          uniMap[uni] = (uniMap[uni] || 0) + 1;
        });
        const universities = Object.keys(uniMap)
          .map(k => ({ name: k, value: uniMap[k] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        // 3. Event Registrations Data
        const regCountMap: Record<string, number> = {};
        regsData.forEach(r => {
          if (r.eventId) regCountMap[r.eventId] = (regCountMap[r.eventId] || 0) + 1;
        });
        const events = eventsData.map(e => ({
          name: e.title?.substring(0, 15) + (e.title?.length > 15 ? '...' : ''),
          participants: regCountMap[e.id] || 0
        })).sort((a, b) => b.participants - a.participants).slice(0, 5);

        setChartData({ growth, universities, events });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Bảng Điều Khiển</h2>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl lg:col-span-2"></div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tăng trưởng sinh viên */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tăng trưởng Sinh viên đăng ký</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="users" name="Sinh viên" stroke="#4285F4" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phân tích theo Trường Đại học */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Thống kê theo Trường ĐH / CĐ</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.universities}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.universities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lượt đăng ký tham gia sự kiện */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Lượt đăng ký tham gia Sự kiện (Top 5)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.events} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="participants" name="Lượt đăng ký" fill="#34A853" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
