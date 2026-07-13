"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Lock, KeyRound } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [validCode, setValidCode] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError("Đường dẫn không hợp lệ hoặc đã hết hạn.");
      setVerifyingCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setValidCode(true);
        setVerifyingCode(false);
      })
      .catch((error) => {
        setError("Đường dẫn không hợp lệ hoặc đã được sử dụng. Vui lòng yêu cầu cấp lại mật khẩu.");
        setVerifyingCode(false);
      });
  }, [oobCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!oobCode) return;

    setLoading(true);
    
    try {
      await confirmPasswordReset(auth, oobCode, formData.password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 3000);
    } catch (err: any) {
      console.error("Lỗi đặt mật khẩu:", err);
      setError("Đã xảy ra lỗi khi đặt mật khẩu. Vui lòng thử lại.");
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
                <KeyRound className="h-8 w-8 text-[#4285F4]" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Thiết lập mật khẩu
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {success ? "Mật khẩu của bạn đã được thiết lập thành công." : "Vui lòng tạo mật khẩu mới cho tài khoản của bạn."}
            </p>
          </div>

          {verifyingCode ? (
            <div className="text-center py-8 text-slate-500">
              Đang xác thực đường dẫn...
            </div>
          ) : success ? (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center border border-green-200">
              <p className="font-bold mb-2">Thành công!</p>
              <p className="text-sm">Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...</p>
              <Link href="/dang-nhap" className="inline-block mt-4 text-[#4285F4] font-medium hover:underline">
                Bấm vào đây nếu không tự động chuyển hướng
              </Link>
            </div>
          ) : !validCode ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-200 text-sm">
              {error}
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Mật khẩu mới
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
                  {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
