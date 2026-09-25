import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClientTone } from '../lib/mockDesk';

type PageAction = { label: string; icon: typeof Activity; onClick: () => void };

/**
 * Page title row. On phones the description drops away and the primary
 * action becomes a floating button above the tab bar, inside thumb reach.
 */
export function PageHeader({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: PageAction;
  children?: ReactNode;
}) {
  const ActionIcon = action?.icon;
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[20px]">{title}</h2>
        {description && <p className="mt-0.5 hidden text-[13px] text-muted-foreground sm:block">{description}</p>}
      </div>
      {(children || action) && (
        <div className="flex items-center gap-2">
          {children}
          {action && ActionIcon && (
            <>
              <Button onClick={action.onClick} className="hidden h-9 px-3.5 sm:inline-flex">
                <ActionIcon /> {action.label}
              </Button>
              <button
                onClick={action.onClick}
                className="fab fixed right-4 z-20 flex h-13 items-center gap-2 rounded-full bg-primary pr-5 pl-4 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.97] sm:hidden"
              >
                <ActionIcon size={19} strokeWidth={2.2} /> {action.label}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The positions band: one ruled strip of figures, like a terminal's funds
 * summary. Swipes sideways on phones, becomes a divided grid from sm up.
 */
export function MetricStrip({ className = 'md:grid-cols-4', children }: { className?: string; children: ReactNode }) {
  return (
    <section
      aria-label="Key figures"
      className={cn(
        'metric-strip -mx-4 flex snap-x snap-mandatory scroll-px-4 divide-x divide-border overflow-x-auto border-y border-border bg-card sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:rounded-lg sm:border',
        className,
      )}
    >
      {children}
    </section>
  );
}

function deltaTone(change: string) {
  return change.trim().startsWith('-') || change.trim().startsWith('−') ? 'text-loss' : 'text-gain';
}

/** A figure that tints green or red for a beat when it moves, like a price tick. */
export function FlashValue({ value, className = '' }: { value: string; className?: string }) {
  const previous = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previous.current === value) return;
    const toNumber = (v: string) => Number(v.replace(/[^\d.-]/g, '')) || 0;
    setFlash(toNumber(value) >= toNumber(previous.current) ? 'up' : 'down');
    previous.current = value;
    const t = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span className={cn('rounded-sm tabular-nums transition-colors', flash && `flash-${flash}`, className)}>{value}</span>
  );
}

export function MetricCard({
  label,
  value,
  change,
  sub,
}: {
  label: string;
  value: string;
  change?: string;
  icon?: typeof Activity;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="w-[46%] min-w-[9.75rem] shrink-0 snap-start px-4 py-3.5 sm:w-auto sm:min-w-0 sm:px-5 sm:py-4">
      <p className="truncate text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <FlashValue value={value} className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-foreground" />
        {change && <span className={cn('text-[12px] font-semibold tabular-nums', deltaTone(change))}>{change}</span>}
      </p>
      {sub && <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Phone-only list that replaces a desk table below the md breakpoint. */
export function MobileList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="divide-y divide-border md:hidden">
      {children}
    </ul>
  );
}

/** A watchlist row: leading mark, title and subtitle, trailing figure and status. */
export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  trailingSub,
  onClick,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  trailingSub?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      {leading && <span className="mt-0.5 shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug text-foreground">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{subtitle}</span>}
        {meta && <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">{meta}</span>}
      </span>
      {(trailing || trailingSub) && (
        <span className="flex shrink-0 flex-col items-end gap-1 pl-2 text-right">
          {trailing && <span className="text-[15px] font-semibold tabular-nums text-foreground">{trailing}</span>}
          {trailingSub}
        </span>
      )}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button onClick={onClick} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-accent">
          {body}
        </button>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3">{body}</div>
      )}
    </li>
  );
}

/** A table that reflows into one card per row below the md breakpoint. */
export function StackTable({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
    const table = ref.current;
    if (!table) return;
    const labels = Array.from(table.querySelectorAll('thead th'), (th) => th.textContent?.trim() ?? '');
    table.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (labels[index]) cell.setAttribute('data-label', labels[index]);
      });
    });
  });

  return (
    <table ref={ref} className={`stack-table ${className}`}>
      {children}
    </table>
  );
}

/** Terminal order-status tag: the label carries the meaning, the tint backs it up. */
export function StatusBadge({
  children,
  tone = 'green',
}: {
  children: ReactNode;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate';
}) {
  const styles = {
    green: 'bg-gain-soft text-gain',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-loss-soft text-loss',
    blue: 'bg-accent text-blue-700',
    slate: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center rounded-[4px] px-1.5 py-[3px] text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] whitespace-nowrap ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

const TONE_CLASSES: Record<ClientTone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-800',
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
  const sizeClass = { 7: 'size-7 text-[10px]', 9: 'size-9 text-[11px]', 12: 'size-12 text-[13px]' }[size];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${TONE_CLASSES[tone]}`}>
      {initials}
    </span>
  );
}
