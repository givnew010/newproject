import React from 'react';
import { XCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = 'إعادة المحاولة' }: ErrorStateProps) {
  return (
    <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center space-y-3">
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
        <XCircle size={24} className="text-red-600" />
      </div>
      <p className="text-error font-medium text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-error text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-error/90 transition-colors"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
