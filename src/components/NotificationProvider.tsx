"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType) => void;
  confirm: (message: string) => Promise<boolean>;
}

type NotificationType = "success" | "error" | "info";
type DialogState = {
  message: string;
  type: NotificationType;
  resolve?: (confirmed: boolean) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const notify = useCallback((message: string, type: NotificationType = "info") => {
    setDialog({ message, type });
  }, []);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>(resolve => {
      setDialog({ message, type: "info", resolve });
    });
  }, []);

  const closeDialog = (confirmed: boolean) => {
    dialog?.resolve?.(confirmed);
    setDialog(null);
  };

  const isConfirmation = Boolean(dialog?.resolve);
  const Icon = dialog?.type === "success" ? CheckCircle2 : dialog?.type === "error" ? TriangleAlert : Info;
  const iconClass = dialog?.type === "success" ? "text-emerald-600 bg-emerald-50" : dialog?.type === "error" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50";

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" role="alertdialog" aria-modal="true" aria-live="polite">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">{isConfirmation ? "Xác nhận thao tác" : dialog.type === "success" ? "Thành công" : dialog.type === "error" ? "Có lỗi xảy ra" : "Thông báo"}</h2>
                  <button type="button" onClick={() => closeDialog(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{dialog.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {isConfirmation && <button type="button" onClick={() => closeDialog(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>}
              <button type="button" onClick={() => closeDialog(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${dialog.type === "error" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {isConfirmation ? "Xác nhận" : "Đã hiểu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification phải được dùng bên trong NotificationProvider");
  return context;
}
