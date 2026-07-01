import React from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-10 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-[#eaf1ff] rounded-[2.5rem] p-8 md:p-12 lg:p-16 flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center relative">

          {/* Top Right Badge (Chung vai vươn mình) */}
          <div className="absolute top-6 right-6 hidden md:flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm z-40">
            <div className="text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-orange-100"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            </div>
            <div className="text-[11px] leading-tight text-slate-700">
              Chung vai Vươn mình<br />
              cùng <span className="text-orange-500 font-bold">Google AI</span>
            </div>
          </div>

          {/* Cột trái: Nội dung */}
          <div className="max-w-2xl mt-8 md:mt-0">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-2.5 rounded-2xl bg-white border border-[#4285F4]/40 shadow-sm mb-6">
              <span className="text-[#4285F4] text-base md:text-lg font-bold">Gemini</span>
              <span className="text-slate-900 text-base md:text-lg font-bold ml-1.5">Academy for Students</span>
            </div>

            {/* Headline H1 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#4285F4] mb-4 leading-tight">
              Vươn mình bứt phá cùng AI
            </h1>

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">
              Dành cho sinh viên các trường ĐH, CĐ
            </h2>

            {/* Sub-headline */}
            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              Chương trình nhằm trang bị cho sinh viên những kiến thức và kỹ năng ứng dụng Google AI vào học tập, nghiên cứu và phát triển nghề nghiệp. Giúp sinh viên khai thác hiệu quả sức mạnh của Gemini để nâng cao năng suất, phát triển tư duy sáng tạo và sẵn sàng cho kỷ nguyên số.
            </p>

            <p className="text-base text-slate-600 mb-8 leading-relaxed">
              <span className="font-bold">“Vươn mình bứt phá cùng AI”</span> (Gemini Academy) là một dự án lớp do <span className="font-bold">Google</span> triển khai, áp dụng mô hình <span className="font-bold">Peer-to-peer</span> (Sinh viên dạy sinh viên) thông qua mạng lưới <span className="font-bold">Đại sứ sinh viên Google - GSA Trainers</span>. Tập trung vào định hướng thực hành thông qua các ví dụ thực tế, bài tập ứng dụng và bộ câu lệnh chuẩn hóa, giúp học viên áp dụng ngay vào học tập và tạo ra hiệu quả rõ ràng.
            </p>

            {/* CTA & Phụ đề */}
            <div className="flex flex-col items-start gap-4">
              <Link href="/dang-ky" className="inline-flex bg-[#4285F4] hover:bg-blue-600 text-white px-8 py-3 rounded text-sm font-semibold transition-colors">
                Đăng ký ngay
              </Link>

              <div className="flex flex-col gap-2 text-sm text-slate-600 italic">
                <span>Thời gian diễn ra: 01/07/2026 - 01/10/2026</span>
                <span>5 buổi trực tuyến</span>
                <span className="font-bold">Hoàn toàn miễn phí</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Visual tĩnh */}
          <div className="relative h-[400px] lg:h-[500px] w-full flex items-center justify-center">
            {/* Vòng tròn 1 */}
            <div className="absolute top-0 right-10 w-40 h-40 md:w-56 md:h-56 rounded-full p-1.5 bg-[linear-gradient(90deg,#0086f8,#ff4131,#ffbd00,#00aa4b,#ff4131)] shadow-lg z-10">
              <img src="/anhsv1.jpg" alt="Sinh viên 1" className="w-full h-full object-cover rounded-full bg-slate-200" />
            </div>

            {/* Vòng tròn 2 */}
            <div className="absolute top-1/3 left-0 w-32 h-32 md:w-48 md:h-48 rounded-full p-1.5 bg-[linear-gradient(90deg,#0086f8,#ff4131,#ffbd00,#00aa4b,#ff4131)] shadow-lg z-20">
              <img src="/anhsv2.jpg" alt="Sinh viên 2" className="w-full h-full object-cover rounded-full bg-slate-300" />
            </div>

            {/* Vòng tròn 3 */}
            <div className="absolute bottom-10 right-0 w-48 h-48 md:w-64 md:h-64 rounded-full p-1.5 bg-[linear-gradient(90deg,#0086f8,#ff4131,#ffbd00,#00aa4b,#ff4131)] shadow-lg z-30">
              <img src="/anhsv3.JPG" alt="Sinh viên 3" className="w-full h-full object-cover rounded-full bg-slate-400" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
