import { useEffect, useMemo, useState } from 'react';
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
import { DeskSheet } from '../components/DeskSheet';
import { OrderTicket, type BetDraft } from '../components/OrderTicket';
import { ClientAvatar, ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable, StatusBadge } from '../components/deskUi';
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
    if (searchParams.get('ticket')) {
      setAddOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('ticket');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  function handlePlaceBet(draft: BetDraft) {
    const client = ACTIVE_CLIENTS.find((c) => c.id === draft.clientId) ?? ACTIVE_CLIENTS[0];
    if (!client) return;
    const { format: formatValue, match, market, selection, odds, stake } = draft;

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
      <PageHeader
        title="Bets"
        description="Every wager placed across your operational hierarchy."
        action={{ label: 'Place bet', icon: PlusCircle, onClick: () => setAddOpen(true) }}
      />

      <MetricStrip>
        <MetricCard label="Total bets" value={String(bets.length)} icon={ClipboardCheck} accent="blue" sub="All time" />
        <MetricCard label="Live bets" value={String(liveBets.length)} icon={TrendingUp} accent="violet" sub="Open, pending or accepted" />
        <MetricCard label="Total stake" value={formatINR(totalStake)} icon={Wallet} accent="teal" sub="Across all bets" />
        <MetricCard label="Current exposure" value={formatINR(totalExposure)} icon={Target} accent="amber" sub="Liability on live bets" />
      </MetricStrip>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="filter-bar flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client, bet ID, or match..."
              aria-label="Search bets"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="seg-tabs inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-[3px]">
            {(['ALL', 'LIVE', 'SETTLED'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${scope === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-muted-foreground">
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
            <MobileList label="Bets">
              {filtered.map((bet) => (
                <ListRow
                  key={bet.id}
                  onClick={() => setSelectedId(bet.id)}
                  title={<FixtureLabel match={bet.match} />}
                  subtitle={`${bet.market} · ${bet.selection} @ ${bet.odds.toFixed(2)}`}
                  meta={
                    <>
                      <span className="font-medium text-slate-700">{bet.client}</span>
                      <span>{bet.format}</span>
                      <span>{bet.placedAt}</span>
                    </>
                  }
                  trailing={formatINR(bet.stake)}
                  trailingSub={<StatusBadge tone={betStatusTone(bet.status)}>{bet.status.replace('_', ' ')}</StatusBadge>}
                />
              ))}
            </MobileList>
            <div className="hidden overflow-x-auto md:block">
              <StackTable className="w-full min-w-[880px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
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
                        <p className="font-mono text-[11px] font-semibold text-blue-600">{bet.id}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{bet.client}</p>
                      </td>
                      <td className="px-3 py-3.5 text-[12px] text-slate-600">{bet.format}</td>
                      <td className="px-3 py-3.5">
                        <FixtureLabel match={bet.match} className="text-[12px] font-medium text-slate-800" />
                        <p className="mt-1 text-[10px] text-muted-foreground">
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
                      <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">{bet.placedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </StackTable>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] text-muted-foreground">
                Showing {filtered.length} of {bets.length} bets
              </span>
            </div>
          </>
        )}
      </section>

      {selected && (
        <DeskSheet label={`${selected.id} details`} onClose={closeDrawer} variant="panel">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <p className="font-mono text-[15px] font-semibold text-slate-950">{selected.id}</p>
              <div className="mt-1.5">
                <StatusBadge tone={betStatusTone(selected.status)}>
                  {selected.status.replace('_', ' ')}
                </StatusBadge>
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
            {selectedClient && (
              <button
                onClick={() => navigate(`/clients?focus=${selectedClient.id}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
              >
                <ClientAvatar initials={selectedClient.initials} tone={selectedClient.tone} size={9} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-800">{selectedClient.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedClient.id} · View client</p>
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
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex items-center gap-2 text-[12px] text-slate-600">
              <CalendarClock size={13} className="text-muted-foreground" /> Placed {selected.placedAt}
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
              <p className="text-center text-[11px] text-muted-foreground">This bet has already been settled.</p>
            )}
          </div>
        </DeskSheet>
      )}

      {addOpen && (
        <DeskSheet label="Place bet" onClose={() => setAddOpen(false)} variant="dialog">
          <OrderTicket onCancel={() => setAddOpen(false)} onSubmit={handlePlaceBet} />
        </DeskSheet>
      )}
    </>
  );
}
