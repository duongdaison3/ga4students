import React from "react";
import { User, Award, BookOpen, Briefcase } from "lucide-react";

const SPEAKERS = [
  {
    id: 1,
    name: "Dương Đại Sơn",
    title: "Google Student Ambassador (GSA Trainer)",
    image: "/speaker.jpg",
    bio: "Xin chào! Mình là Sơn, người chia sẻ và đồng hành cùng các bạn trong suốt chuỗi chương trình Gemini Academy for Students trên website này. Với đam mê công nghệ và kinh nghiệm ứng dụng AI vào thực tiễn, mình mong muốn được chia sẻ những kỹ năng hữu ích nhất để giúp các bạn sinh viên tối ưu hóa hiệu suất học tập và làm việc.",
    achievements: [
      { text: "Chứng nhận Google AI và AI for All", icon: Award, colorClass: "text-[#4285F4]", bgClass: "bg-blue-100" },
      { text: "Đại sứ sinh viên Google (GSA)", icon: Briefcase, colorClass: "text-[#34A853]", bgClass: "bg-green-100" },
      { text: "Nghiên cứu & Cố vấn học tập", icon: BookOpen, colorClass: "text-[#FBBC05]", bgClass: "bg-yellow-100" }
    ]
  },
  {
    id: 2,
    name: "Vương Tố Nga",
    title: "Google Student Ambassador Trainer",
    image: "/tonga.jpg",
    bio: "Mình tin rằng AI không thay thế con người, mà giúp mỗi người phát huy tốt hơn khả năng của mình. Vì vậy, mình mong muốn chia sẻ những gì đã học được, từ cách học tập hiệu quả, xây dựng thương hiệu cá nhân đến việc ứng dụng AI để giải quyết công việc hằng ngày.",
    achievements: [
      { text: "Google Student Ambassador Trainer", icon: Award, colorClass: "text-[#4285F4]", bgClass: "bg-blue-100" },
      { text: "Media & Communications Team Member, VSAC", icon: Briefcase, colorClass: "text-[#34A853]", bgClass: "bg-green-100" },
      { text: "Top 25 Đại sứ Sinh viên Google", icon: BookOpen, colorClass: "text-[#FBBC05]", bgClass: "bg-yellow-100" }
    ]
  }
];

export function Speaker() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Thông tin <span className="text-[#4285F4]">Diễn giả</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SPEAKERS.map(speaker => (
            <div key={speaker.id} className="flex flex-col items-center text-center gap-8 bg-[#f8fbff] rounded-3xl p-8 border border-blue-100 shadow-[0_10px_40px_-10px_rgba(66,133,244,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(66,133,244,0.15)] transition-all h-full">
              {/* Avatar Area */}
              <div className="w-40 h-40 flex-shrink-0 relative mt-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#4285F4] to-[#34A853] rounded-full blur-2xl opacity-40"></div>
                <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white flex items-center justify-center">
                  <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Info Area */}
              <div className="flex-1 flex flex-col items-center w-full">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{speaker.name}</h3>
                <p className="text-[#4285F4] font-bold text-sm mb-6">{speaker.title}</p>

                <p className="text-slate-600 mb-8 leading-relaxed text-sm flex-1">
                  {speaker.bio}
                </p>

                <div className="flex flex-col gap-4 w-full mt-auto">
                  {speaker.achievements.map((ach, idx) => {
                    const Icon = ach.icon;
                    return (
                      <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className={`h-10 w-10 rounded-full ${ach.bgClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${ach.colorClass}`} />
                        </div>
                        <div className="text-sm font-medium text-slate-700 text-left leading-snug">{ach.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
