"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Lock, KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import { updatePassword, onAuthStateChanged, User } from "firebase/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/dang-nhap");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setLoading(false);
      return;
    }

    try {
      if (user) {
        await updatePassword(user, formData.newPassword);
        setSuccess(true);
        setFormData({ newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      console.error("Lỗi đổi mật khẩu:", err);
      if (err.code === 'auth/requires-recent-login') {
        setError("Vì lý do bảo mật, vui lòng Đăng xuất và Đăng nhập lại trước khi đổi mật khẩu.");
      } else {
        setError("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Wait for auth check

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen bg-[#f8fbff] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(66,133,244,0.15)] border border-blue-100">
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-[#eaf1ff] rounded-2xl flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-[#4285F4]" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Đổi mật khẩu
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn.
            </p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm text-center font-medium">
              Đổi mật khẩu thành công! Lần đăng nhập sau bạn hãy sử dụng mật khẩu mới này nhé.
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
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
                {loading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm font-bold text-[#4285F4] hover:text-blue-600">
              Quay lại Trang chủ
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
