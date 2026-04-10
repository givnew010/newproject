import React, { useState } from 'react';
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { api } from '../../lib/api';

interface DataSectionProps {
  onBackup: () => Promise<void>;
  onReset: () => Promise<void>;
}

export function DataSection({ onBackup, onReset }: DataSectionProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleBackup() {
    setStatus('loading');
    try {
      await onBackup();
      setStatus('success');
      setMessage('تم تصدير البيانات بنجاح');
    } catch {
      setStatus('error');
      setMessage('فشل تصدير البيانات');
    }
  }

  async function handleReset() {
    if (!window.confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات ولا يمكن التراجع.')) return;
    setStatus('loading');
    try {
      await onReset();
      setStatus('success');
      setMessage('تمت إعادة تهيئة قاعدة البيانات');
    } catch {
      setStatus('error');
      setMessage('فشل تنفيذ العملية');
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-container-low">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          <Database size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-on-surface">البيانات والنسخ الاحتياطية</h3>
          <p className="text-[11px] text-on-surface-variant">تصدير واستيراد وإدارة بيانات النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <Download size={16} />
            <h4 className="font-bold text-sm">تصدير البيانات</h4>
          </div>
          <p className="text-[11px] text-emerald-600">تصدير جميع البيانات بصيغة JSON أو Excel</p>
          <Button
            variant="success"
            className="w-full mt-2"
            onClick={handleBackup}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? <RefreshCw size={14} className="animate-spin ml-1.5" /> : <Download size={14} className="ml-1.5" />}
            تصدير البيانات
          </Button>
        </div>

        <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50 space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <Upload size={16} />
            <h4 className="font-bold text-sm">استيراد البيانات</h4>
          </div>
          <p className="text-[11px] text-blue-600">رفع ملف JSON لاستعادة البيانات</p>
          <Button variant="primary" className="w-full mt-2" disabled>
            <Upload size={14} className="ml-1.5" />قريباً
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-red-100 bg-red-50 space-y-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={16} />
          <h4 className="font-bold text-sm">منطقة الخطر</h4>
        </div>
        <p className="text-[11px] text-red-600">
          إعادة تهيئة قاعدة البيانات ستحذف جميع الفواتير والأصناف والعملاء والموردين. لا يمكن التراجع عن هذه العملية.
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
          onClick={handleReset}
          disabled={status === 'loading'}
        >
          <Trash2 size={14} className="ml-1.5" />
          إعادة تهيئة قاعدة البيانات
        </Button>
      </div>

      {status !== 'idle' && status !== 'loading' && (
        <div className={`flex items-center gap-2 text-sm font-bold ${status === 'success' ? 'text-success' : 'text-error'}`}>
          {status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {message}
        </div>
      )}
    </div>
  );
}

export default DataSection;
