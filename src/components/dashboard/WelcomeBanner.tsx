import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface WelcomeBannerProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function WelcomeBanner({ onRefresh, loading }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="bg-gradient-to-l from-blue-600 to-blue-800 rounded-2xl p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="relative">
        <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
        <h3 className="text-xl lg:text-2xl font-extrabold text-white">مرحباً بك في المُنسق</h3>
        <p className="text-blue-200 text-sm mt-1.5">إليك ملخص شامل لنشاط عملك اليوم</p>
      </div>
      <div className="relative flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 w-fit">
          <Activity size={15} className="text-emerald-300" />
          <span className="text-xs font-bold text-white">النظام يعمل بشكل طبيعي</span>
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;
