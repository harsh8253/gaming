import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Globe, ShieldCheck, User, Users, X } from 'lucide-react';
import { StatusBadge, MetricCard, StackTable } from '../components/deskUi';
import { auditCategoryTone, MOCK_AUDIT_LOG, type AuditCategory } from '../lib/mockDesk';

type ScopeFilter = 'ALL' | AuditCategory;

export function AuditPage() {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = MOCK_AUDIT_LOG.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedId(null);
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MOCK_AUDIT_LOG.filter((entry) => {
      const label = `${entry.actor} ${entry.action} ${entry.target}`.toLowerCase();
      const matchesQuery = !needle || label.includes(needle);
      const matchesScope = scope === 'ALL' || entry.category === scope;
      return matchesQuery && matchesScope;
    });
  }, [query, scope]);

  const today = MOCK_AUDIT_LOG.filter((e) => e.timestamp.startsWith('Today'));
  const security = MOCK_AUDIT_LOG.filter((e) => e.category === 'SECURITY');
  const actors = new Set(MOCK_AUDIT_LOG.map((e) => e.actor)).size;

  function clearFilters() {
    setQuery('');
    setScope('ALL');
  }

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 hidden items-center gap-2 sm:flex">
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
            Super Admin A
          </span>
          <span className="text-[11px] text-slate-400">/</span>
          <span className="text-[11px] font-medium text-slate-500">Master network</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Audit</h2>
        <p className="mt-1 text-[13px] text-slate-500">Every sensitive action across your hierarchy, immutably logged.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Events today" value={String(today.length)} icon={CalendarClock} accent="blue" sub="Since midnight" />
        <MetricCard label="Total events" value={String(MOCK_AUDIT_LOG.length)} icon={ShieldCheck} accent="teal" sub="Retained log" />
        <MetricCard label="Security events" value={String(security.length)} icon={ShieldCheck} accent="red" sub="Sign-ins & settings" />
        <MetricCard label="Unique actors" value={String(actors)} icon={Users} accent="violet" sub="Across your hierarchy" />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by actor, action, or target..."
              aria-label="Search audit log"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as ScopeFilter)}
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All categories</option>
            <option value="SECURITY">Security</option>
            <option value="FINANCIAL">Financial</option>
            <option value="HIERARCHY">Hierarchy</option>
            <option value="OPERATIONS">Operations</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <User size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">No events found</p>
              <p className="mt-1 text-[12px] text-slate-500">Try a different actor, action, or category.</p>
            </div>
            <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <StackTable className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                  <th className="px-3 py-3 font-semibold">Target</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 text-right font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] font-semibold text-slate-800">{entry.actor}</p>
                      <p className="text-[10px] text-slate-400">{entry.role}</p>
                    </td>
                    <td className="px-3 py-3.5 text-[12px] text-slate-700">{entry.action}</td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-500">{entry.target}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={auditCategoryTone(entry.category)}>{entry.category}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[11px] text-slate-400">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </StackTable>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4" role="presentation">
          <button
            aria-label="Close event details"
            onClick={() => setSelectedId(null)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div role="dialog" aria-modal="true" aria-label="Audit event" className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-slate-950">{selected.action}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{selected.id}</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-4">
              <StatusBadge tone={auditCategoryTone(selected.category)}>{selected.category}</StatusBadge>
            </div>
            <dl className="space-y-3 text-[12px]">
              <div className="flex items-center gap-2 text-slate-600">
                <User size={13} className="text-slate-400" />
                {selected.actor} · {selected.role}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarClock size={13} className="text-slate-400" />
                {selected.timestamp}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Globe size={13} className="text-slate-400" />
                {selected.ip}
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Target</dt>
                <dd className="mt-1 font-medium text-slate-800">{selected.target}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
