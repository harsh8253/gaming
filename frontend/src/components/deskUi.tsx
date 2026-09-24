import type { ReactNode } from 'react';
import type { Activity } from 'lucide-react';
import type { ClientTone } from '../lib/mockDesk';

export function StatusBadge({
  children,
  tone = 'green',
}: {
  children: ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate';
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    red: 'bg-red-50 text-red-700 ring-red-600/15',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
    slate: 'bg-slate-100 text-slate-600 ring-slate-600/10',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-[0.08em] ring-1 ring-inset ${styles[tone]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  accent = 'slate',
  sub,
}: {
  label: string;
  value: string;
  change?: string;
  icon: typeof Activity;
  accent?: string;
  sub?: string;
}) {
  const accents: Record<string, string> = {
    slate: 'text-slate-500 bg-slate-100',
    blue: 'text-blue-600 bg-blue-50',
    violet: 'text-violet-600 bg-violet-50',
    amber: 'text-amber-600 bg-amber-50',
    teal: 'text-teal-600 bg-teal-50',
    green: 'text-emerald-600 bg-emerald-50',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
          {label}
        </p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${accents[accent]}`}>
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-[22px] font-semibold tracking-tight text-slate-950">{value}</p>
        {change && <span className="text-[11px] font-semibold text-emerald-600">{change}</span>}
      </div>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

const TONE_CLASSES: Record<ClientTone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-700',
  teal: 'bg-teal-50 text-teal-700',
  rose: 'bg-rose-50 text-rose-700',
};

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export function ClientAvatar({
  initials,
  tone,
  size = 7,
}: {
  initials: string;
  tone: ClientTone;
  size?: 7 | 9 | 12;
}) {
  const sizeClass = { 7: 'size-7 text-[10px]', 9: 'size-9 text-[11px]', 12: 'size-12 text-[13px]' }[
    size
  ];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md font-bold ${sizeClass} ${TONE_CLASSES[tone]}`}
    >
      {initials}
    </span>
  );
}
