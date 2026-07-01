import React from "react";

export function Footer() {
  return (
    <footer className="bg-[#eff5ff] pt-12 pb-6 border-t border-blue-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-2">
            <img src="/google.png" alt="Google Logo" className="h-7 w-auto object-contain" />
            <div className="text-sm font-semibold border-l-2 border-slate-300 pl-2 ml-1 text-slate-700">
              Academy for Students
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="text-slate-500">Mạng xã hội</span>
            <a href="#" className="hover:text-[#4285F4] transition-colors">Facebook</a>
            <a href="#" className="hover:text-[#4285F4] transition-colors">YouTube</a>
          </div>
        </div>
        
        <div className="text-center text-xs text-slate-500 pt-6 border-t border-blue-200/50 leading-relaxed">
          Dự án cá nhân do GSA Trainer Dương Đại Sơn tự tổ chức và xây dựng.
        </div>
      </div>
    </footer>
  );
}
