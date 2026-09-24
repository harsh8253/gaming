import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { ChevronRight, ClipboardCheck, PauseCircle, PlayCircle, PlusCircle, Search, ShieldAlert, X } from 'lucide-react';
import { MetricCard, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  formatINR,
  marketStatusTone,
  MOCK_MARKETS,
  MOCK_MATCHES,
  type MarketStatus,
  type MockMarket,
} from '../lib/mockDesk';

type ScopeFilter = 'ALL' | MarketStatus;

export function MarketsPage() {
  const navigate = useNavigate();
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [markets, setMarkets] = useState<MockMarket[]>(MOCK_MARKETS);
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
    return markets.filter((market) => {
      const matchesQuery = !needle || `${market.marketType} ${market.match}`.toLowerCase().includes(needle);
      const matchesScope = scope === 'ALL' || market.status === scope;
      return matchesQuery && matchesScope;
    });
  }, [markets, query, scope]);

  const selected = markets.find((m) => m.id === selectedId) ?? null;
  const openCount = markets.filter((m) => m.status === 'OPEN').length;
  const suspendedCount = markets.filter((m) => m.status === 'SUSPENDED').length;
  const totalExposure = markets.reduce((sum, m) => sum + m.exposure, 0);

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

  function setStatus(market: MockMarket, status: MarketStatus) {
    setMarkets((prev) => prev.map((m) => (m.id === market.id ? { ...m, status } : m)));
    setNotice(`${market.marketType} on ${market.match} is now ${status.toLowerCase()}.`);
  }

  function handleAddMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const matchId = String(form.get('matchId') ?? '');
    const match = MOCK_MATCHES.find((m) => m.id === matchId) ?? MOCK_MATCHES[0];
    if (!match) return;
    const marketType = String(form.get('marketType') ?? '').trim();
    if (!marketType) return;

    const market: MockMarket = {
      id: `MKT-${3400 + markets.length}`,
      matchId: match.id,
      match: `${match.home} vs ${match.away}`,
      sport: match.sport,
      marketType,
      status: 'OPEN',
      betsCount: 0,
      exposure: 0,
    };
    setMarkets((prev) => [market, ...prev]);
    setAddOpen(false);
    setNotice(`${marketType} was added for ${market.match}.`);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 hidden items-center gap-2 sm:flex">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
              Super Admin A
            </span>
            <span className="text-[11px] text-slate-400">/</span>
            <span className="text-[11px] font-medium text-slate-500">Master network</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Markets</h2>
          <p className="mt-1 text-[13px] text-slate-500">Every betting market open across your fixtures.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-900"
        >
          <PlusCircle size={14} /> Add market
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total markets" value={String(markets.length)} icon={ClipboardCheck} accent="blue" sub="Across all matches" />
        <MetricCard label="Open" value={String(openCount)} icon={PlayCircle} accent="green" sub="Accepting bets" />
        <MetricCard label="Suspended" value={String(suspendedCount)} icon={PauseCircle} accent="amber" sub="Temporarily closed" />
        <MetricCard label="Total exposure" value={formatINR(totalExposure)} icon={ShieldAlert} accent="teal" sub="Across open markets" />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by market or match..."
              aria-label="Search markets"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {(['ALL', 'OPEN', 'SUSPENDED', 'SETTLED'] as const).map((value) => (
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
              <p className="text-[13px] font-semibold text-slate-800">No markets found</p>
              <p className="mt-1 text-[12px] text-slate-500">Try a different market, match, or status.</p>
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
                  <th className="px-5 py-3 font-semibold">Market</th>
                  <th className="px-3 py-3 font-semibold">Match</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Bets</th>
                  <th className="px-5 py-3 text-right font-semibold">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((market) => (
                  <tr
                    key={market.id}
                    onClick={() => setSelectedId(market.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">{market.marketType}</td>
                    <td className="px-3 py-3.5">
                      <p className="text-[12px] font-medium text-slate-700">{market.match}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{market.sport}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={marketStatusTone(market.status)}>{market.status}</StatusBadge>
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {market.betsCount}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                      {market.exposure ? formatINR(market.exposure) : '—'}
                    </td>
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
            aria-label="Close market details"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.marketType} details`}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:pb-0"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold text-slate-950">{selected.marketType}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{selected.match}</p>
                <div className="mt-1.5">
                  <StatusBadge tone={marketStatusTone(selected.status)}>{selected.status}</StatusBadge>
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
              <button
                onClick={() => navigate(`/matches?focus=${selected.matchId}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-800">{selected.match}</p>
                  <p className="text-[10px] text-slate-400">{selected.sport} · View match</p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
              </button>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Bets placed</dt>
                  <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{selected.betsCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Exposure</dt>
                  <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">
                    {formatINR(selected.exposure)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-6 py-4">
              {selected.status !== 'SETTLED' && (
                <button
                  onClick={() => setStatus(selected, selected.status === 'OPEN' ? 'SUSPENDED' : 'OPEN')}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-[11px] font-semibold ${
                    selected.status === 'OPEN'
                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {selected.status === 'OPEN' ? (
                    <>
                      <PauseCircle size={14} /> Suspend
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} /> Reopen
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setStatus(selected, 'SETTLED')}
                disabled={selected.status === 'SETTLED'}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#172554] py-2.5 text-[11px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ClipboardCheck size={14} /> Settle market
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4" role="presentation">
          <button
            aria-label="Close add market form"
            onClick={() => setAddOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div role="dialog" aria-modal="true" aria-label="Add market" className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-950">Add market</h3>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleAddMarket}>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Match</span>
                <select
                  name="matchId"
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {MOCK_MATCHES.filter((m) => m.status !== 'FINISHED').map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.home} vs {match.away}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Market type</span>
                <input
                  name="marketType"
                  required
                  autoFocus
                  placeholder="e.g. Total Sixes Over/Under"
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
                  Add market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
