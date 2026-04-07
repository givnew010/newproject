import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = 'تأكيد',
  message = 'هل أنت متأكد؟',
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative z-[80] w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-extrabold">{title}</h3>
              <button onClick={onCancel} className="p-2 rounded-xl hover:bg-surface-container-low"><X size={16} /></button>
            </div>

            <div className="p-4">
              <p className="text-sm text-on-surface-variant">{message}</p>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl border">{cancelLabel}</button>
              <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-error text-white font-bold">{confirmLabel}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
