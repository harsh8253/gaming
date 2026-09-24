import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardCheck, Search, User, Wallet, X, XCircle } from 'lucide-react';
import { MetricCard, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  formatINR,
  MOCK_SETTLEMENTS,
  settlementStatusTone,
  type MockSettlement,
  type SettlementStatus,
} from '../lib/mockDesk';

type ScopeFilter = 'ALL' | SettlementStatus;

export function SettlementsPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settlements, setSettlements] = useState<MockSettlement[]>(MOCK_SETTLEMENTS);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) setSelectedId(focus);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return settlements.filter((settlement) => {
      const matchesQuery = !needle || settlement.match.toLowerCase().includes(needle);
      const matchesScope = scope === 'ALL' || settlement.status === scope;
      return matchesQuery && matchesScope;
    });
  }, [settlements, query, scope]);

  const selected = settlements.find((s) => s.id === selectedId) ?? null;
  const pending = settlements.filter((s) => s.status === 'PENDING');
  const approved = settlements.filter((s) => s.status === 'APPROVED');
  const rejected = settlements.filter((s) => s.status === 'REJECTED');
  const pendingPayout = pending.reduce((sum, s) => sum + s.totalPayout, 0);

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

  function decide(settlement: MockSettlement, status: SettlementStatus) {
    setSettlements((prev) => prev.map((s) => (s.id === settlement.id ? { ...s, status } : s)));
    setNotice(`${settlement.id} for ${settlement.match} was ${status.toLowerCase()}.`);
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
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Settlements</h2>
        <p className="mt-1 text-[13px] text-slate-500">Review and approve settlement requests raised by masters.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Pending" value={String(pending.length)} icon={ClipboardCheck} accent="amber" sub="Awaiting your decision" />
        <MetricCard label="Approved" value={String(approved.length)} icon={CheckCircle2} accent="green" sub="All time" />
        <MetricCard label="Rejected" value={String(rejected.length)} icon={XCircle} accent="red" sub="All time" />
        <MetricCard label="Payout pending" value={formatINR(pendingPayout)} icon={Wallet} accent="blue" sub="Across pending requests" />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by match..."
              aria-label="Search settlements"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${scope === value ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">No settlements found</p>
              <p className="mt-1 text-[12px] text-slate-500">Try a different match or status.</p>
            </div>
            <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <StackTable className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-5 py-3 font-semibold">Settlement / Match</th>
                  <th className="px-3 py-3 text-right font-semibold">Bets</th>
                  <th className="px-3 py-3 text-right font-semibold">Payout</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Requested</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((settlement) => (
                  <tr
                    key={settlement.id}
                    onClick={() => setSelectedId(settlement.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[11px] font-semibold text-blue-600">{settlement.id}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-slate-700">{settlement.match}</p>
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {settlement.betsCount}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                      {formatINR(settlement.totalPayout)}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={settlementStatusTone(settlement.status)}>{settlement.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[11px] text-slate-400">{settlement.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </StackTable>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-40" role="presentation">
          <button
            aria-label="Close settlement details"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.id} details`}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:pb-0"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold text-slate-950">{selected.id}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{selected.match}</p>
                <div className="mt-1.5">
                  <StatusBadge tone={settlementStatusTone(selected.status)}>{selected.status}</StatusBadge>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Bets included</dt>
                  <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{selected.betsCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total payout</dt>
                  <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">
                    {formatINR(selected.totalPayout)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2 text-[12px] text-slate-600">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-slate-400" /> Requested by {selected.requestedBy}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock size={13} className="text-slate-400" /> {selected.requestedAt}
                </div>
              </div>
            </div>

            {selected.status === 'PENDING' && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => decide(selected, 'REJECTED')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-[12px] font-semibold text-red-700 hover:bg-red-50"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => decide(selected, 'APPROVED')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#172554] py-2.5 text-[12px] font-semibold text-white hover:bg-blue-900"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
