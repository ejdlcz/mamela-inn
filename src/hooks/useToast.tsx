import { AlertTriangle, Check, Sparkles } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}
type PushToast = (msg: string, kind?: ToastKind) => void;

const ToastContext = createContext<PushToast>(() => {});

/** Wrap the app once; any component can then call `const toast = useToast()`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<PushToast>((msg, kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto flex animate-toast items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-xl ' +
              (t.kind === 'success'
                ? 'border-vacant-bright bg-vacant text-white'
                : t.kind === 'error'
                  ? 'border-overdue-bright bg-overdue text-white'
                  : 'border-line bg-surface text-ink')
            }
          >
            {t.kind === 'success' ? (
              <Check size={16} />
            ) : t.kind === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
