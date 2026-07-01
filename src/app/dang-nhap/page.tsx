"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Lock, LogIn } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Đăng nhập thành công, chuyển hướng về trang chủ
      router.push("/");
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      // Firebase auth error message handling
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Email hoặc Mật khẩu không chính xác.");
      } else {
        setError("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen bg-[#f8fbff] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(66,133,244,0.15)] border border-blue-100">
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-[#eaf1ff] rounded-2xl flex items-center justify-center">
                <LogIn className="h-8 w-8 text-[#4285F4]" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Đăng nhập
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Vui lòng sử dụng thông tin tài khoản đã được gửi qua email của bạn.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                    placeholder="sinhvien@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#4285F4] hover:bg-blue-600 focus:outline-none transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Bạn chưa có tài khoản?{" "}
              <Link href="/dang-ky" className="font-bold text-[#4285F4] hover:text-blue-600">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
