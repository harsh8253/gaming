import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AlertOctagon, CheckCircle2, PlusCircle, Search, Wallet, X } from 'lucide-react';
import { DeskSheet } from '../components/DeskSheet';
import { ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  cashStatusTone,
  formatINR,
  MASTERS,
  MOCK_CASH_SESSIONS,
  type CashSessionStatus,
  type MockCashSession,
} from '../lib/mockDesk';

type ScopeFilter = 'ALL' | CashSessionStatus;

export function CashPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<MockCashSession[]>(MOCK_CASH_SESSIONS);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) setSelectedId(focus);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId && !addOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDrawer();
        setAddOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, addOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesQuery = !needle || session.master.toLowerCase().includes(needle);
      const matchesScope = scope === 'ALL' || session.status === scope;
      return matchesQuery && matchesScope;
    });
  }, [sessions, query, scope]);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const openSessions = sessions.filter((s) => s.status === 'OPEN');
  const flagged = sessions.filter((s) => s.status === 'FLAGGED');
  const totalPhysical = sessions.reduce((sum, s) => sum + s.physicalCount, 0);
  const totalDifference = sessions.reduce((sum, s) => sum + s.difference, 0);

  function closeDrawer() {
    setSelectedId(null);
    if (searchParams.get('focus')) {
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }
  }

  function clearFilters() {
    setQuery('');
    setScope('ALL');
  }

  function resolveSession(session: MockCashSession, status: CashSessionStatus) {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, status } : s)));
    setNotice(`${session.id} for ${session.master} was marked ${status.toLowerCase()}.`);
  }

  function handleOpenSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const master = String(form.get('master') ?? MASTERS[0]);
    const opening = Number(form.get('opening') ?? 0);

    const session: MockCashSession = {
      id: `CSH-${104 + sessions.length}`,
      master,
      date: 'Today',
      opening,
      received: 0,
      paid: 0,
      expectedClosing: opening,
      physicalCount: opening,
      difference: 0,
      status: 'OPEN',
    };
    setSessions((prev) => [session, ...prev]);
    setAddOpen(false);
    setNotice(`Cash session opened for ${master}.`);
  }

  return (
    <>
      <PageHeader
        title="Cash"
        description="Physical cash sessions and reconciliation, kept separate from ledger balance."
        action={{ label: 'Open session', icon: PlusCircle, onClick: () => setAddOpen(true) }}
      />

      <MetricStrip>
        <MetricCard label="Open sessions" value={String(openSessions.length)} icon={Wallet} accent="blue" sub="Not yet reconciled" />
        <MetricCard label="Total physical cash" value={formatINR(totalPhysical)} icon={Wallet} accent="teal" sub="Counted across sessions" />
        <MetricCard
          label="Net difference"
          value={`${totalDifference < 0 ? '− ' : ''}${formatINR(totalDifference)}`}
          icon={AlertOctagon}
          accent={totalDifference === 0 ? 'green' : 'amber'}
          sub="Physical vs expected"
        />
        <MetricCard label="Flagged" value={String(flagged.length)} icon={AlertOctagon} accent="red" sub="Need review" />
      </MetricStrip>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="filter-bar flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by master..."
              aria-label="Search cash sessions"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="seg-tabs inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-[3px]">
            {(['ALL', 'OPEN', 'RECONCILED', 'FLAGGED'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${scope === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-muted-foreground">
              <Search size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">No sessions found</p>
              <p className="mt-1 text-[12px] text-slate-500">Try a different master or status.</p>
            </div>
            <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              Clear filters
            </button>
          </div>
        ) : (
          <>
          <MobileList label="Cash sessions">
            {filtered.map((session) => (
              <ListRow
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                title={session.master}
                subtitle={`${session.id} · ${session.date}`}
                meta={
                  <>
                    <span>Expected <span className="font-medium tabular-nums text-slate-700">{formatINR(session.expectedClosing)}</span></span>
                    <span>Counted <span className="font-medium tabular-nums text-slate-700">{formatINR(session.physicalCount)}</span></span>
                  </>
                }
                trailing={
                  <span className={session.difference === 0 ? 'text-slate-500' : session.difference > 0 ? 'text-emerald-700' : 'text-red-700'}>
                    {session.difference === 0 ? 'Balanced' : `${session.difference > 0 ? '+ ' : '− '}${formatINR(session.difference)}`}
                  </span>
                }
                trailingSub={<StatusBadge tone={cashStatusTone(session.status)}>{session.status}</StatusBadge>}
              />
            ))}
          </MobileList>
          <div className="hidden overflow-x-auto md:block">
            <StackTable className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Session</th>
                  <th className="px-3 py-3 font-semibold">Master</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 text-right font-semibold">Expected</th>
                  <th className="px-3 py-3 text-right font-semibold">Physical</th>
                  <th className="px-3 py-3 text-right font-semibold">Difference</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => setSelectedId(session.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="font-mono px-5 py-3.5 text-[11px] font-semibold text-blue-600">{session.id}</td>
                    <td className="px-3 py-3.5 text-[12px] text-slate-700">{session.master}</td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-500">{session.date}</td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {formatINR(session.expectedClosing)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {formatINR(session.physicalCount)}
                    </td>
                    <td
                      className={`px-3 py-3.5 text-right text-[12px] font-semibold tabular-nums ${session.difference === 0 ? 'text-slate-500' : session.difference > 0 ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                      {session.difference === 0 ? '—' : `${session.difference > 0 ? '+ ' : '− '}${formatINR(session.difference)}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={cashStatusTone(session.status)}>{session.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StackTable>
          </div>
          </>
        )}
      </section>

      {selected && (
        <DeskSheet label={`${selected.id} details`} onClose={closeDrawer} variant="panel">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <p className="font-mono text-[15px] font-semibold text-slate-950">{selected.id}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{selected.master} · {selected.date}</p>
              <div className="mt-1.5">
                <StatusBadge tone={cashStatusTone(selected.status)}>{selected.status}</StatusBadge>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close"
              className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              {(
                [
                  ['Opening cash', formatINR(selected.opening), false],
                  ['Cash received', `+ ${formatINR(selected.received)}`, false],
                  ['Cash paid', `− ${formatINR(selected.paid)}`, false],
                  ['Expected closing cash', formatINR(selected.expectedClosing), true],
                  ['Physical count', formatINR(selected.physicalCount), true],
                ] as const
              ).map(([label, value, strong]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between ${strong ? 'border-t border-slate-100 pt-4' : ''}`}
                >
                  <span className={`text-[11px] ${strong ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <span className={`text-[12px] tabular-nums ${strong ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${selected.difference === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}
              >
                <span className={`text-[11px] font-semibold ${selected.difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  Reconciliation difference
                </span>
                <span className={`text-[12px] font-bold tabular-nums ${selected.difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selected.difference === 0 ? '₹ 0' : `${selected.difference > 0 ? '+ ' : '− '}${formatINR(selected.difference)}`}
                </span>
              </div>
            </div>
          </div>

          {selected.status === 'OPEN' && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => resolveSession(selected, 'FLAGGED')}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-[12px] font-semibold text-red-700 hover:bg-red-50"
              >
                <AlertOctagon size={14} /> Flag
              </button>
              <button
                onClick={() => resolveSession(selected, 'RECONCILED')}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#172554] py-2.5 text-[12px] font-semibold text-white hover:bg-blue-900"
              >
                <CheckCircle2 size={14} /> Mark reconciled
              </button>
            </div>
          )}
        </DeskSheet>
      )}

      {addOpen && (
        <DeskSheet label="Open cash session" onClose={() => setAddOpen(false)} variant="dialog">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-950">Open cash session</h3>
            <button
              onClick={() => setAddOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <form className="space-y-3" onSubmit={handleOpenSession}>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Master</span>
              <select
                name="master"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                {MASTERS.map((master) => (
                  <option key={master} value={master}>
                    {master}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Opening cash</span>
              <input
                name="opening"
                type="number"
                min={0}
                step={1000}
                defaultValue={100000}
                required
                autoFocus
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#172554] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-blue-900"
              >
                Open session
              </button>
            </div>
          </form>
        </DeskSheet>
      )}
    </>
  );
}
