'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-sage-subtle border-sage text-sage',
    error: 'bg-negative/10 border-negative/30 text-negative',
    warning: 'bg-warning/10 border-warning/30 text-warning',
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[360px] w-[calc(100%-32px)] px-4 py-3 rounded-btn border text-sm font-medium shadow-card-elevated animate-in slide-in-from-top-4 ${colors[type]}`}
    >
      {message}
    </div>
  );
}

// Toast manager hook
import { useCallback } from 'react';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
