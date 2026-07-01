import React from "react";
import { User, Award, BookOpen, Briefcase } from "lucide-react";

export function Speaker() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Thông tin <span className="text-[#4285F4]">Diễn giả</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 bg-[#f8fbff] rounded-3xl p-8 md:p-12 border border-blue-100 shadow-[0_10px_40px_-10px_rgba(66,133,244,0.1)]">
          {/* Avatar Area */}
          <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#4285F4] to-[#34A853] rounded-full blur-2xl opacity-40"></div>
            <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white flex items-center justify-center">
              <User className="w-24 h-24 text-slate-300" />
              {/* TODO: Khi có ảnh thực tế, bạn có thể xóa thẻ <User /> ở trên và mở comment thẻ <img /> bên dưới */}
              {/* <img src="/avatar-dien-gia.jpg" alt="Diễn giả" className="w-full h-full object-cover" /> */}
            </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Dương Đại Sơn</h3>
            <p className="text-[#4285F4] font-bold text-lg mb-6">Google Student Ambassador (GSA Trainer)</p>
            
            <p className="text-slate-600 mb-8 leading-relaxed">
              Xin chào! Mình là Sơn, diễn giả và người đồng hành cùng các bạn trong suốt chuỗi chương trình Gemini Academy for Students. 
              Với đam mê công nghệ và kinh nghiệm ứng dụng AI vào thực tiễn, mình mong muốn được chia sẻ những kỹ năng hữu ích nhất 
              để giúp các bạn sinh viên tối ưu hóa hiệu suất học tập và làm việc.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-[#4285F4]" />
                </div>
                <div className="text-sm font-medium text-slate-700 text-left">Chuyên gia đào tạo ứng dụng AI</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-[#34A853]" />
                </div>
                <div className="text-sm font-medium text-slate-700 text-left">Đại sứ sinh viên Google (GSA)</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-[#FBBC05]" />
                </div>
                <div className="text-sm font-medium text-slate-700 text-left">Nghiên cứu & Cố vấn học tập</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
