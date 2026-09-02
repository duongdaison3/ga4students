"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emailMode?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, emailMode = false }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }, { color: [] }, { background: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="bg-white rounded-lg">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || "Nhập nội dung chi tiết..."}
        className="h-64 mb-12"
      />
      {emailMode && (
        <button
          type="button"
          onClick={() => onChange(`${value}<p style="text-align: center; margin: 24px 0;"><a href="https://example.com" style="background-color: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 700;">Xem thêm</a></p>`)}
          className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          + Chèn nút kêu gọi hành động
        </button>
      )}
    </div>
  );
}
