import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<(ConfirmOptions & { resolve?: (val: boolean) => void }) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmModal({
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      setConfirmLoading(true);
      if (confirmModal.onConfirm) {
        await confirmModal.onConfirm();
      }
      if (confirmModal.resolve) {
        confirmModal.resolve(true);
      }
      setConfirmModal(null);
    } catch (e: any) {
      showToast('error', 'เกิดข้อผิดพลาด', e?.message || 'ไม่สามารถดำเนินการได้');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmModal?.onCancel) {
      confirmModal.onCancel();
    }
    if (confirmModal?.resolve) {
      confirmModal.resolve(false);
    }
    setConfirmModal(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Floating Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100'
                : 'bg-blue-50/95 border-blue-200 text-blue-900 dark:bg-blue-950/90 dark:border-blue-800 dark:text-blue-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal (SweetAlert replacement) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-150">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-slate-100 dark:bg-slate-800">
              {confirmModal.type === 'danger' ? (
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{confirmModal.message}</p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handleCancelAction}
                disabled={confirmLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                {confirmModal.cancelText || 'ยกเลิก'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${confirmLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {confirmLoading ? 'กำลังประมวลผล...' : confirmModal.confirmText || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
