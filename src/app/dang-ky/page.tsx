"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookOpen, Mail, Phone, User, GraduationCap } from "lucide-react";
import { universities } from "@/lib/universities";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    university: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isCustomUniversity, setIsCustomUniversity] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Non-JSON response:", textResponse);
        throw new Error("Lỗi máy chủ: Không thể xử lý yêu cầu. Vui lòng kiểm tra lại cấu hình trên server (Environment Variables).");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
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
                <BookOpen className="h-8 w-8 text-[#4285F4]" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Đăng ký tham gia
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Tham gia Gemini Academy for Students ngay hôm nay.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-green-800 mb-2">Đăng ký thành công!</h3>
              <p className="text-sm text-green-600 mb-6">
                Chúng tôi đã gửi thông tin tài khoản và mật khẩu đăng nhập vào email <strong>{formData.email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).
              </p>
              <Link 
                href="/dang-nhap"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#4285F4] hover:bg-blue-600 focus:outline-none transition-colors"
              >
                Đi tới Đăng nhập
              </Link>
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
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

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
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-slate-700 mb-1">
                    Trường Đại học / Cao đẳng
                  </label>
                  {!isCustomUniversity ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        id="university"
                        name="university"
                        required
                        className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors text-slate-700 bg-white"
                        value={formData.university}
                        onChange={(e) => {
                          if (e.target.value === "other") {
                            setIsCustomUniversity(true);
                            setFormData({ ...formData, university: "" });
                          } else {
                            handleChange(e);
                          }
                        }}
                      >
                        <option value="" disabled>-- Chọn trường của bạn --</option>
                        {universities.map((uni, idx) => (
                          <option key={idx} value={uni}>{uni}</option>
                        ))}
                        <option value="other" className="font-bold text-[#4285F4]">Khác... (Nhập thủ công)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="university"
                        name="university"
                        type="text"
                        required
                        className="appearance-none block w-full pl-10 pr-24 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#4285F4] focus:border-[#4285F4] sm:text-sm transition-colors"
                        placeholder="Nhập tên trường của bạn..."
                        value={formData.university}
                        onChange={handleChange}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomUniversity(false);
                          setFormData({ ...formData, university: "" });
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-[#4285F4] hover:text-blue-700 font-medium"
                      >
                        Hủy nhập
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#4285F4] hover:bg-blue-600 focus:outline-none transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký nhận tài khoản'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Bạn đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="font-bold text-[#4285F4] hover:text-blue-600">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
