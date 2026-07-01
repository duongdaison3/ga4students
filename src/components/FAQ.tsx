"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Đối tượng nào có thể đăng ký tham gia khóa đào tạo này?",
      answer: "Chương trình tập trung hỗ trợ các bạn sinh viên đang theo học tại các trường Đại học, Cao đẳng trên toàn quốc có nhu cầu ứng dụng AI vào hoạt động học tập, nghiên cứu và phát triển bản thân. Ngoài ra, những cá nhân, học viên, nhân viên muốn hiểu thêm về AI và nâng cao hiệu suất làm việc đều được chào đón đăng ký tham gia.",
    },
    {
      question: "Hình thức học tập và thời gian diễn ra như thế nào?",
      answer: "• Hình thức: Học trực tuyến (Online) thông qua Google Meet hoặc nền tảng tương đương, đường link sẽ được gửi trước buổi học.\n• Thời gian: Khóa học kéo dài trong 5 buổi, bắt đầu từ ngày 01/07/2026.\n• Lịch học: Thông tin chi tiết sẽ được thông báo qua email cho học viên đăng ký thành công.",
    },
    {
      question: "Tôi có phải trả phí khi tham gia học không?",
      answer: "• Không, khóa học này hoàn toàn miễn phí.",
    },
    {
      question: "Sau khóa học tôi có nhận được xác nhận hoàn thành khóa học không?",
      answer: "• Có. Sau khi tham gia đầy đủ các buổi học và hoàn thành bài tập, bạn sẽ nhận được email xác nhận và Giấy chứng nhận (trực tuyến) đã tham gia hoàn thành khóa học.",
    },
    {
      question: "Lợi ích cụ thể mà tôi nhận được sau khóa học là gì?",
      answer: "Sau 5 buổi học, học viên có thể:\n• Hiểu cách ứng dụng Google AI (Gemini) vào các hoạt động học tập và nghiên cứu thực tiễn.\n• Nâng cao năng suất, tối ưu thời gian học tập và làm việc.\n• Trang bị kỹ năng số để phát triển lợi thế cạnh tranh.\n• Gia tăng hiệu quả sáng tạo và quản lý thời gian.",
    },
    {
      question: "Làm thế nào để tôi có thể đăng ký tham gia?",
      answer: "• Đăng ký tham gia ngay bằng cách nhấn vào nút \"Đăng ký ngay\" trên trang web này và điền đầy đủ thông tin vào form đăng ký.",
    },
    {
      question: "Trang web này có cung cấp tài liệu học tập sau khi kết thúc buổi học không?",
      answer: "• Có, toàn bộ tài liệu bài giảng và video ghi hình sẽ được gửi qua email và cập nhật đầy đủ trong nhóm học tập của lớp để học viên tiện ôn tập bất cứ lúc nào.",
    },
    {
      question: "Mỗi buổi học trực tuyến thường kéo dài trong bao lâu?",
      answer: "• Mỗi buổi học kéo dài khoảng 2 đến 2.5 tiếng, bao gồm phần hướng dẫn lý thuyết và thực hành trực tiếp.",
    },
    {
      question: "Nếu tôi bỏ lỡ một buổi học trực tuyến, tôi có thể xem lại video bài giảng không?",
      answer: "• Có, hệ thống sẽ lưu lại video bài giảng để bạn có thể dễ dàng xem lại bất cứ lúc nào nếu lỡ lịch học trực tuyến.",
    },
    {
      question: "Trong quá trình học, tôi có được tương tác trực tiếp với chuyên gia không?",
      answer: "• Có, bạn hoàn toàn có thể đặt câu hỏi và trao đổi trực tiếp với các GSA Trainers ngay trong thời gian diễn ra lớp học.",
    },
    {
      question: "Chương trình có giới hạn số lượng đăng ký tham gia không?",
      answer: "• Để đảm bảo chất lượng hướng dẫn và hỗ trợ thực hành tốt nhất, chương trình có giới hạn số lượng học viên. Bạn nên đăng ký sớm để giữ chỗ.",
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 pb-24">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#4285F4] text-center mb-12">
          Câu hỏi thường gặp
        </h2>
        
        <div className="space-y-5 md:space-y-6">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-b from-white to-blue-50/50 shadow-sm"
              >
                <button
                  className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-base md:text-lg font-bold text-slate-800 pr-8">{faq.question}</span>
                  <span className="text-[#4285F4]">
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </span>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 text-base md:text-lg text-slate-600 whitespace-pre-line leading-relaxed border-t border-blue-100 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
