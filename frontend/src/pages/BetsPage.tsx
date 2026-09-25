import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Award,
  Ban,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  PlusCircle,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
import { FixtureLabel } from '../components/cricketUi';
import { ClientAvatar, MetricCard, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  betStatusTone,
  formatINR,
  MOCK_BETS,
  MOCK_CLIENTS,
  FORMATS,
  type BetStatus,
  type MockBet,
} from '../lib/mockDesk';

type ScopeFilter = 'ALL' | 'LIVE' | 'SETTLED';

const LIVE_STATUSES = new Set<BetStatus>(['OPEN', 'PENDING', 'ACCEPTED']);
const ACTIVE_CLIENTS = MOCK_CLIENTS.filter((c) => c.status === 'ACTIVE');

function nextBetId(count: number): string {
  return `BET-${String(864 + count).padStart(4, '0')}`;
}

export function BetsPage() {
  const navigate = useNavigate();
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bets, setBets] = useState<MockBet[]>(MOCK_BETS);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [format, setFormat] = useState('ALL');
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
    return bets.filter((bet) => {
      const matchesQuery =
        !needle ||
        `${bet.client} ${bet.id} ${bet.match}`.toLowerCase().includes(needle);
      const matchesScope =
        scope === 'ALL' ||
        (scope === 'LIVE' ? LIVE_STATUSES.has(bet.status) : !LIVE_STATUSES.has(bet.status));
      const matchesFormat = format === 'ALL' || bet.format === format;
      return matchesQuery && matchesScope && matchesFormat;
    });
  }, [bets, query, scope, format]);

  const selected = bets.find((b) => b.id === selectedId) ?? null;
  const selectedClient = selected ? MOCK_CLIENTS.find((c) => c.id === selected.clientId) : null;
  const liveBets = bets.filter((b) => LIVE_STATUSES.has(b.status));
  const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalExposure = liveBets.reduce((sum, b) => sum + b.exposure, 0);

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
    setFormat('ALL');
  }

  function settleBet(bet: MockBet, status: BetStatus) {
    setBets((prev) => prev.map((b) => (b.id === bet.id ? { ...b, status } : b)));
    const label = status === 'SETTLED_WON' ? 'won' : status === 'SETTLED_LOST' ? 'lost' : 'voided';
    setNotice(`${bet.id} for ${bet.client} was marked ${label}.`);
  }

  function handlePlaceBet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const clientId = String(form.get('clientId') ?? '');
    const client = ACTIVE_CLIENTS.find((c) => c.id === clientId) ?? ACTIVE_CLIENTS[0];
    if (!client) return;
    const formatValue = FORMATS.find((f) => f === form.get('format')) ?? FORMATS[0];
    const match = String(form.get('match') ?? '').trim();
    const market = String(form.get('market') ?? '').trim();
    const selection = String(form.get('selection') ?? '').trim();
    const odds = Number(form.get('odds') ?? 1.5);
    const stake = Number(form.get('stake') ?? 0);
    if (!match || !market || !selection || stake <= 0) return;

    const bet: MockBet = {
      id: nextBetId(bets.length),
      client: client.name,
      clientId: client.id,
      format: formatValue,
      match,
      market,
      selection,
      odds,
      stake,
      exposure: stake,
      potentialPayout: Math.round(stake * odds),
      status: 'OPEN',
      placedAt: 'Just now',
    };
    setBets((prev) => [bet, ...prev]);
    setAddOpen(false);
    setNotice(`New bet placed for ${client.name}.`);
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Bets</h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Every wager placed across your operational hierarchy.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-900"
        >
          <PlusCircle size={14} /> Place bet
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total bets" value={String(bets.length)} icon={ClipboardCheck} accent="blue" sub="All time" />
        <MetricCard label="Live bets" value={String(liveBets.length)} icon={TrendingUp} accent="violet" sub="Open, pending or accepted" />
        <MetricCard label="Total stake" value={formatINR(totalStake)} icon={Wallet} accent="teal" sub="Across all bets" />
        <MetricCard label="Current exposure" value={formatINR(totalExposure)} icon={Target} accent="amber" sub="Liability on live bets" />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client, bet ID, or match..."
              aria-label="Search bets"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {(['ALL', 'LIVE', 'SETTLED'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${scope === value ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {value === 'ALL' ? 'All' : value === 'LIVE' ? 'Live' : 'Settled'}
              </button>
            ))}
          </div>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            aria-label="Filter by format"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All formats</option>
            {FORMATS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">No bets match these filters</p>
              <p className="mt-1 text-[12px] text-slate-500">
                Try a different client, match, format, or scope.
              </p>
            </div>
            <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <StackTable className="w-full min-w-[880px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Bet / Client</th>
                    <th className="px-3 py-3 font-semibold">Format</th>
                    <th className="px-3 py-3 font-semibold">Match / Selection</th>
                    <th className="px-3 py-3 text-right font-semibold">Stake</th>
                    <th className="px-3 py-3 text-right font-semibold">Exposure</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bet) => (
                    <tr
                      key={bet.id}
                      onClick={() => setSelectedId(bet.id)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[11px] font-semibold text-blue-600">{bet.id}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{bet.client}</p>
                      </td>
                      <td className="px-3 py-3.5 text-[12px] text-slate-600">{bet.format}</td>
                      <td className="px-3 py-3.5">
                        <FixtureLabel match={bet.match} className="text-[12px] font-medium text-slate-800" />
                        <p className="mt-1 text-[10px] text-slate-400">
                          {bet.market} · {bet.selection} @ {bet.odds.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                        {formatINR(bet.stake)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                        {formatINR(bet.exposure)}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge tone={betStatusTone(bet.status)}>{bet.status.replace('_', ' ')}</StatusBadge>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[11px] text-slate-400">{bet.placedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </StackTable>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] text-slate-400">
                Showing {filtered.length} of {bets.length} bets
              </span>
            </div>
          </>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-40" role="presentation">
          <button
            aria-label="Close bet details"
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
                <div className="mt-1.5">
                  <StatusBadge tone={betStatusTone(selected.status)}>
                    {selected.status.replace('_', ' ')}
                  </StatusBadge>
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
              {selectedClient && (
                <button
                  onClick={() => navigate(`/clients?focus=${selectedClient.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
                >
                  <ClientAvatar initials={selectedClient.initials} tone={selectedClient.tone} size={9} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-800">{selectedClient.name}</p>
                    <p className="text-[10px] text-slate-400">{selectedClient.id} · View client</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-slate-300" />
                </button>
              )}

              <div className="mt-5">
                <FixtureLabel match={selected.match} className="text-[13px] font-semibold text-slate-900" />
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {selected.format} · {selected.market}
                </p>
                <p className="mt-1 text-[12px] font-medium text-blue-700">
                  Selection: {selected.selection} @ {selected.odds.toFixed(2)}
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Stake', formatINR(selected.stake)],
                  ['Potential payout', formatINR(selected.potentialPayout)],
                  ['Exposure', formatINR(selected.exposure)],
                  ['Odds', selected.odds.toFixed(2)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
                    <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-center gap-2 text-[12px] text-slate-600">
                <CalendarClock size={13} className="text-slate-400" /> Placed {selected.placedAt}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              {LIVE_STATUSES.has(selected.status) ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => settleBet(selected, 'SETTLED_WON')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-emerald-200 py-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <Trophy size={14} /> Won
                  </button>
                  <button
                    onClick={() => settleBet(selected, 'SETTLED_LOST')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-red-200 py-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Award size={14} /> Lost
                  </button>
                  <button
                    onClick={() => settleBet(selected, 'VOID')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Ban size={14} /> Void
                  </button>
                </div>
              ) : (
                <p className="text-center text-[11px] text-slate-400">This bet has already been settled.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4" role="presentation">
          <button
            aria-label="Close place bet form"
            onClick={() => setAddOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Place bet"
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-950">Place bet</h3>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-3" onSubmit={handlePlaceBet}>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Client</span>
                <select
                  name="clientId"
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {ACTIVE_CLIENTS.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Format</span>
                <select
                  name="format"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {FORMATS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Match</span>
                <input
                  name="match"
                  required
                  autoFocus
                  placeholder="e.g. India vs England"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Market</span>
                  <input
                    name="market"
                    required
                    placeholder="Match Winner"
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Selection</span>
                  <input
                    name="selection"
                    required
                    placeholder="India"
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Odds</span>
                  <input
                    name="odds"
                    type="number"
                    min={1.01}
                    step={0.01}
                    defaultValue={1.85}
                    required
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Stake</span>
                  <input
                    name="stake"
                    type="number"
                    min={0}
                    step={100}
                    defaultValue={5000}
                    required
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
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
                  Place bet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
