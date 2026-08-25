import type { LucideIcon } from 'lucide-react';
import Card from './Card';
import { FOCUS_RING } from './ui';

export default function Toggle({
  on,
  onChange,
  title,
  desc,
  icon: Icon,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cardAlt">
          <Icon size={16} className="text-muted" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">{title}</div>
          <div className="text-xs text-muted">{desc}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => onChange(!on)}
        className={`h-8 w-14 shrink-0 rounded-full p-1 transition-colors ${FOCUS_RING} ${
          on ? 'bg-accent' : 'bg-cardAlt'
        }`}
      >
        <div
          className="h-6 w-6 rounded-full bg-white transition-transform"
          style={{ transform: on ? 'translateX(24px)' : 'translateX(0)' }}
        />
      </button>
    </Card>
  );
}
