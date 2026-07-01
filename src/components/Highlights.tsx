import React from "react";

export function Highlights() {
  const highlights = [
    "Triển khai Google AI vào các hoạt động học tập thực tiễn",
    "Nâng cao năng suất, tối ưu thời gian nghiên cứu và làm việc",
    "Trang bị kỹ năng số để phát triển lợi thế cạnh tranh",
    "Gia tăng hiệu quả sáng tạo và quản lý thời gian",
  ];

  return (
    <section id="highlights" className="py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5">
            Điểm nhấn chương trình
          </h2>
          <p className="text-slate-600 text-lg md:text-xl">
            Sau khi hoàn thành chương trình, sinh viên có khả năng:
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-14">
          {highlights.map((text, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#4285F4] to-[#2b65d9] rounded-2xl p-6 text-center text-white flex items-center justify-center font-medium text-sm md:text-base leading-snug min-h-[130px] shadow-[0_10px_40px_-10px_rgba(66,133,244,0.5)] border border-blue-400/20"
            >
              {text}
            </div>
          ))}
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <p className="text-base md:text-lg text-slate-800 leading-relaxed">
            Chương trình <span className="font-bold text-[#4285F4]">"Vươn mình bứt phá cùng AI"</span> (Gemini Academy) hướng tới mục tiêu hướng dẫn sinh viên cách triển khai, ứng dụng AI để tối ưu hiệu suất, tạo ra nền tảng vững chắc cho công việc trong tương lai.
          </p>
        </div>
      </div>
    </section>
  );
}
