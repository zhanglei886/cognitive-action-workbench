import { X } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { cx } from "../ui";

interface BottomSheetProps {
  open: boolean; onClose: () => void; title?: string;
  children: ReactNode; safeBottom?: boolean;
}

export function BottomSheet({ open, onClose, title, children, safeBottom = true }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-end justify-center" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cx("relative w-full max-w-lg animate-slide-up rounded-t-2xl bg-white dark:bg-[#1c1c1e] p-5 shadow-2xl", safeBottom && "pb-[max(1.25rem,env(safe-area-inset-bottom))]")}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-white/25" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="rounded-full p-1 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
