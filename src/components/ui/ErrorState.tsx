import React from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

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
        <Button variant="danger" onClick={onRetry} className="inline-flex items-center gap-2">
          <RefreshCw size={14} />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
