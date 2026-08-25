import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-card border border-line bg-cardAlt p-3 text-xs leading-relaxed text-muted">
      <AlertCircle size={15} className="mt-0.5 shrink-0 text-muted" />
      <div>{children}</div>
    </div>
  );
}
