"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export function Timeline() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [successIds, setSuccessIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleRegister = async (moduleId: string, moduleTitle: string) => {
    if (!user) return;
    
    setLoadingIds(prev => ({ ...prev, [moduleId]: true }));
    
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/workshops/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ workshopId: moduleId, workshopTitle: moduleTitle })
      });
      
      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Non-JSON response:", textResponse);
        throw new Error("Hệ thống đang gặp lỗi xử lý. Vui lòng thử lại sau.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }
      
      setSuccessIds(prev => ({ ...prev, [moduleId]: true }));
      alert(`Đăng ký tham gia ${moduleTitle} thành công! Vui lòng kiểm tra email.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingIds(prev => ({ ...prev, [moduleId]: false }));
    }
  };
  const modules = [
    {
      id: "01",
      title: "Academic Excellence",
      desc: "Học thông minh, Nghiên cứu sâu cùng Google AI",
      image: "/topic1.jpg"
    },
    {
      id: "02",
      title: "Productivity Hub",
      desc: "Tối ưu hiệu suất, làm việc nhóm mượt mà",
      image: "/topic2.jpg"
    },
    {
      id: "03",
      title: "Creativity Studio",
      desc: "Đột phá sáng tạo & Bắt trend hiệu quả",
      image: "/topic3.jpg"
    },
    {
      id: "04",
      title: "Tech & Innovation",
      desc: "Kỹ năng số: Biến ý tưởng thành ứng dụng thực tế",
      image: "/topic4.jpg"
    },
    {
      id: "05",
      title: "Lifestyle & Soft Skills",
      desc: "Khám phá bản thân Nâng cao nhịp sống",
      image: "/topic5.jpg"
    },
  ];

  return (
    <section id="timeline" className="py-16">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Featured Lesson */}
        <div className="bg-[#f0f4ff] rounded-3xl p-8 md:p-12 mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[#4285F4] text-[#4285F4] text-xs font-bold uppercase tracking-wider mb-6 bg-white">
            Tóm tắt nội dung chương trình
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
                Chủ đề đào tạo về Gemini
              </h3>
              
              <div className="space-y-3 text-base md:text-lg text-slate-700 leading-relaxed">
                <p><strong className="text-slate-900">Mục tiêu:</strong> Giúp sinh viên Việt Nam Tiếp cận, Làm chủ, và Ứng dụng AI trong học tập và phát triển bản thân.</p>
                <p>- Sinh viên đang theo học tại các trường CĐ, ĐH trên toàn quốc</p>
                <p>- Người muốn nâng cao hiệu suất học tập và phát triển bản thân</p>
                <p>- Người có hiểu biết về AI còn hạn chế</p>
                <p>- Học viên, nhân viên muốn hiểu thêm về AI</p>
              </div>
            </div>
            
            {/* Featured Image */}
            <div className="flex justify-center">
              <div className="w-full max-w-xl rounded-2xl shadow-lg border border-[#4285F4]/20 overflow-hidden">
                 <img src="/tongquan.png" alt="Tổng quan chương trình" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">Tổng quan Chương trình</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] w-full rounded-xl mb-5 overflow-hidden">
                 <img src={module.image} alt={module.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="inline-flex items-center self-start px-3 py-1.5 bg-[#eaf1ff] text-[#4285F4] rounded text-xs font-bold mb-4">
                  Chủ đề {module.id}
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 leading-snug mb-3">
                  {module.title}
                </h4>
                
                <p className="text-sm md:text-base text-slate-600 mb-6">
                  {module.desc}
                </p>

                <div className="mt-auto">
                  {user ? (
                    <button
                      onClick={() => handleRegister(module.id, module.title)}
                      disabled={loadingIds[module.id] || successIds[module.id]}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
                        successIds[module.id] 
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-[#4285F4] hover:bg-blue-600 text-white shadow-sm'
                      } ${loadingIds[module.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loadingIds[module.id] 
                        ? 'Đang xử lý...' 
                        : successIds[module.id] 
                          ? 'Đã đăng ký' 
                          : 'Đăng ký tham gia'}
                    </button>
                  ) : (
                    <Link href="/dang-nhap" className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-lg text-sm font-bold transition-colors">
                      Đăng nhập để đăng ký
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
