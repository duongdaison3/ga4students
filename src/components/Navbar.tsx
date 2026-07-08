"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ChevronDown, User as UserIcon, LogOut, KeyRound } from "lucide-react";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất", error);
    }
  };

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Câu hỏi thường gặp", href: "/faq" },
    { name: "Sắp diễn ra", href: "/su-kien#upcoming" },
    { name: "Đang diễn ra", href: "/su-kien#ongoing" },
    { name: "Đã diễn ra", href: "/su-kien#timeline" },
  ];

  return (
    <nav className="w-full bg-white border-b border-slate-100 py-4">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/google.png" alt="Google Logo" className="h-6 w-auto object-contain" />
          <div className="text-sm font-semibold border-l-2 border-slate-300 pl-2 ml-1 text-slate-700">
            Academy for Students
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-base font-bold text-slate-700 hover:text-[#4285F4] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors focus:outline-none"
              >
                <div className="bg-[#eaf1ff] p-1.5 rounded-full">
                  <UserIcon className="h-4 w-4 text-[#4285F4]" />
                </div>
                <span className="hidden sm:block">Xin chào, {user.displayName || user.email?.split('@')[0]}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50">
                  <Link
                    href="/doi-mat-khau"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] transition-colors"
                  >
                    <KeyRound className="h-4 w-4" />
                    Đổi mật khẩu
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link 
                href="/dang-nhap"
                className="text-[#4285F4] hover:text-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hidden sm:block"
              >
                Đăng nhập
              </Link>
              <Link 
                href="/dang-ky"
                className="bg-[#4285F4] hover:bg-blue-600 text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
