'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Diálogo modal acessível: rótulo associado, foco preso enquanto aberto,
 * Escape para fechar e devolução do foco ao elemento anterior.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, labelledBy, describedBy, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (nativeEvent: KeyboardEvent) => {
      if (nativeEvent.key === 'Escape') {
        nativeEvent.preventDefault();
        onClose();
        return;
      }
      if (nativeEvent.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;

      if (nativeEvent.shiftKey && document.activeElement === first) {
        nativeEvent.preventDefault();
        last.focus();
      } else if (!nativeEvent.shiftKey && document.activeElement === last) {
        nativeEvent.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Foca o primeiro elemento interativo do painel.
    const timer = window.setTimeout(() => {
      const panel = panelRef.current;
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    }, 30);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-nicopel-black/60 animate-[var(--animate-fade)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-card)] bg-white shadow-[var(--shadow-lifted)] animate-[var(--animate-rise)] sm:rounded-[var(--radius-card)]"
      >
        {children}
      </div>
    </div>
  );
}
