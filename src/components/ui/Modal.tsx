import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Extra large (used by the booking calendar). */
  xl?: boolean;
  label?: string;
}

/** Centered dialog. Closes on Esc or when the dark backdrop is clicked. */
export default function Modal({ onClose, children, wide, xl, label }: ModalProps) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={
          'flex max-h-[92vh] w-full animate-rise flex-col overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl ' +
          (xl ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-md')
        }
      >
        {children}
      </div>
    </div>
  );
}
