"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { Users, Calendar, LayoutDashboard, LogOut, ArrowLeft, Mail, Menu, ChevronLeft } from "lucide-react";

const ADMIN_EMAILS = [
  "pea44.work@gmail.com",
  "spea22@xpea.io.vn",
  "vuongtonga171105@gmail.com"
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAuthorized(true);
        } else {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              setIsAuthorized(true);
            } else {
              // Fallback check by email in case of different Google UID
              const q = query(collection(db, "users"), where("email", "==", user.email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty && querySnapshot.docs[0].data().role === 'admin') {
                setIsAuthorized(true);
              } else {
                router.replace("/");
              }
            }
          } catch (e) {
            console.error("Admin Auth Error:", e);
            router.replace("/");
          }
        }
      } else {
        router.replace("/");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4]"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Sự kiện", href: "/admin/events", icon: Calendar },
    { name: "Email Marketing", href: "/admin/marketing", icon: Mail },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-[#4285F4] shadow-sm z-10"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className={`p-6 border-b border-slate-200 ${!isSidebarOpen && "px-4 items-center flex flex-col"}`}>
          {isSidebarOpen ? (
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-[#4285F4] transition-colors mb-6 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </Link>
          ) : (
            <Link href="/" className="text-slate-600 hover:text-[#4285F4] transition-colors mb-6" title="Về trang chủ">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          
          <h1 className={`font-extrabold text-slate-900 tracking-tight transition-all ${isSidebarOpen ? "text-xl" : "text-xs text-center"}`}>
            {isSidebarOpen ? (
              <>GA4Students <span className="text-[#4285F4]">Admin</span></>
            ) : (
              <span className="text-[#4285F4]">Admin</span>
            )}
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isSidebarOpen ? item.name : undefined}
                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isSidebarOpen ? "px-4" : "justify-center"
                } ${
                  isActive 
                    ? "bg-blue-50 text-[#4285F4]" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#4285F4]" : "text-slate-400"}`} />
                {isSidebarOpen && item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={() => auth.signOut()}
            title={!isSidebarOpen ? "Đăng xuất" : undefined}
            className={`flex items-center gap-3 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all ${
              isSidebarOpen ? "px-4" : "justify-center"
            }`}
          >
            <LogOut className="w-5 h-5 text-red-500" />
            {isSidebarOpen && "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
