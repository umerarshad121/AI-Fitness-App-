'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
type ToastContextValue = { showToast: (message: string, type?: Toast['type']) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 4000);
  }, []);
  return <ToastContext.Provider value={{ showToast }}>{children}<div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">{toasts.map(toast => <div key={toast.id} role="status" className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>{toast.message}</div>)}</div></ToastContext.Provider>;
}
