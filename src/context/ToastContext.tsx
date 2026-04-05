import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; title?: string; duration: number; }

interface ToastContextType {
  showSuccess: (message: string, opts?: { title?: string; duration?: number }) => void;
  showError: (message: string, opts?: { title?: string; duration?: number }) => void;
  showInfo: (message: string, opts?: { title?: string; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(tst => tst.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string, opts?: { title?: string; duration?: number }) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const toast: Toast = { id, type, message, title: opts?.title, duration: opts?.duration ?? 4000 };
    setToasts(t => [toast, ...t]);
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
  }, [remove]);

  const showSuccess = useCallback((message: string, opts?: { title?: string; duration?: number }) => show('success', message, opts), [show]);
  const showError = useCallback((message: string, opts?: { title?: string; duration?: number }) => show('error', message, opts), [show]);
  const showInfo = useCallback((message: string, opts?: { title?: string; duration?: number }) => show('info', message, opts), [show]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}

      <div className="fixed left-4 top-4 z-[9999] flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className={`max-w-sm w-full min-h-[48px] rounded-xl p-3 shadow-lg border ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200' : t.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-surface-container-high'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
                  {t.type === 'error' && <AlertTriangle size={18} className="text-red-600" />}
                  {t.type === 'info' && <Info size={18} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface">{t.title ?? (t.type === 'success' ? 'نجاح' : t.type === 'error' ? 'خطأ' : 'معلومة')}</p>
                  <p className="text-[13px] text-on-surface-variant mt-0.5 leading-snug line-clamp-3">{t.message}</p>
                </div>
                <button onClick={() => remove(t.id)} className="p-1.5 ml-2 text-on-surface-variant hover:text-on-surface transition-colors">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
