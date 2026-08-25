import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { FOCUS_RING } from './ui';

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  busy = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const off = disabled || busy;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={off}
      className={`flex h-action w-full items-center justify-center gap-2 rounded-card font-semibold transition-colors ${FOCUS_RING} ${
        off
          ? 'cursor-not-allowed bg-cardAlt text-muted'
          : 'bg-accent text-white hover:brightness-110'
      }`}
    >
      {busy && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}
