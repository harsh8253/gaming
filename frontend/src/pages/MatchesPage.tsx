import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Activity, CalendarClock, PlusCircle, Radio, Search, ShieldAlert, Trophy, X } from 'lucide-react';
import { MetricCard, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  formatINR,
  marketStatusTone,
  matchStatusTone,
  MOCK_MARKETS,
  MOCK_MATCHES,
  SPORTS,
  type MatchStatus,
  type MockMatch,
} from '../lib/mockDesk';

type ScopeFilter = 'ALL' | MatchStatus;

export function MatchesPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState<MockMatch[]>(MOCK_MATCHES);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [sport, setSport] = useState('ALL');
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
    return matches.filter((match) => {
      const label = `${match.home} ${match.away} ${match.competition}`.toLowerCase();
      const matchesQuery = !needle || label.includes(needle);
      const matchesScope = scope === 'ALL' || match.status === scope;
      const matchesSport = sport === 'ALL' || match.sport === sport;
      return matchesQuery && matchesScope && matchesSport;
    });
  }, [matches, query, scope, sport]);

  const selected = matches.find((m) => m.id === selectedId) ?? null;
  const selectedMarkets = selected ? MOCK_MARKETS.filter((m) => m.matchId === selected.id) : [];
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const upcomingCount = matches.filter((m) => m.status === 'UPCOMING').length;
  const totalExposure = matches.reduce((sum, m) => sum + m.exposure, 0);

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
    setSport('ALL');
  }

  function handleAddMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sportValue = String(form.get('sport') ?? SPORTS[0]);
    const home = String(form.get('home') ?? '').trim();
    const away = String(form.get('away') ?? '').trim();
    const competition = String(form.get('competition') ?? '').trim();
    const startTime = String(form.get('startTime') ?? '').trim();
    if (!home || !away || !competition || !startTime) return;

    const match: MockMatch = {
      id: `MTC-${1200 + matches.length}`,
      sport: sportValue,
      home,
      away,
      competition,
      startTime,
      status: 'UPCOMING',
      exposure: 0,
    };
    setMatches((prev) => [match, ...prev]);
    setAddOpen(false);
    setNotice(`${home} vs ${away} was added to the fixture list.`);
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Matches</h2>
          <p className="mt-1 text-[13px] text-slate-500">Fixtures open for betting across every sport.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-900"
        >
          <PlusCircle size={14} /> Add match
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total matches" value={String(matches.length)} icon={Trophy} accent="blue" sub="Tracked fixtures" />
        <MetricCard label="Live now" value={String(liveCount)} icon={Radio} accent="amber" sub="In progress" />
        <MetricCard label="Upcoming" value={String(upcomingCount)} icon={CalendarClock} accent="teal" sub="Not yet started" />
        <MetricCard label="Total exposure" value={formatINR(totalExposure)} icon={ShieldAlert} accent="green" sub="Across live and upcoming" />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by team or competition..."
              aria-label="Search matches"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {(['ALL', 'LIVE', 'UPCOMING', 'FINISHED'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${scope === value ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            aria-label="Filter by sport"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All sports</option>
            {SPORTS.map((s) => (
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
              <p className="text-[13px] font-semibold text-slate-800">No matches found</p>
              <p className="mt-1 text-[12px] text-slate-500">Try a different team, competition, sport, or scope.</p>
            </div>
            <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <StackTable className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-5 py-3 font-semibold">Match</th>
                  <th className="px-3 py-3 font-semibold">Sport</th>
                  <th className="px-3 py-3 font-semibold">Competition</th>
                  <th className="px-3 py-3 font-semibold">Start</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((match) => (
                  <tr
                    key={match.id}
                    onClick={() => setSelectedId(match.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">
                      {match.home} vs {match.away}
                    </td>
                    <td className="px-3 py-3.5 text-[12px] text-slate-600">{match.sport}</td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-500">{match.competition}</td>
                    <td className="px-3 py-3.5 text-[11px] text-slate-500">{match.startTime}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={matchStatusTone(match.status)}>{match.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                      {match.exposure ? formatINR(match.exposure) : '—'}
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
            aria-label="Close match details"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.home} vs ${selected.away} details`}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:pb-0"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold text-slate-950">
                  {selected.home} vs {selected.away}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {selected.sport} · {selected.competition}
                </p>
                <div className="mt-1.5">
                  <StatusBadge tone={matchStatusTone(selected.status)}>{selected.status}</StatusBadge>
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
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <CalendarClock size={13} className="text-slate-400" /> {selected.startTime}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-slate-600">
                <ShieldAlert size={13} className="text-slate-400" /> Exposure {formatINR(selected.exposure)}
              </div>

              <div className="mt-6">
                <h4 className="text-[12px] font-semibold text-slate-800">
                  Markets ({selectedMarkets.length})
                </h4>
                {selectedMarkets.length ? (
                  <ul className="mt-2 space-y-2">
                    {selectedMarkets.map((market) => (
                      <li
                        key={market.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-[11px] font-semibold text-slate-800">{market.marketType}</p>
                          <p className="text-[10px] text-slate-400">{market.betsCount} bets</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                            {market.exposure ? formatINR(market.exposure) : '—'}
                          </span>
                          <StatusBadge tone={marketStatusTone(market.status)}>{market.status}</StatusBadge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-slate-400">No markets listed for this match yet.</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setNotice(`All markets for ${selected.home} vs ${selected.away} were suspended.`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 py-2.5 text-[12px] font-semibold text-amber-700 hover:bg-amber-50"
              >
                <Activity size={14} /> Suspend all markets
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4" role="presentation">
          <button
            aria-label="Close add match form"
            onClick={() => setAddOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div role="dialog" aria-modal="true" aria-label="Add match" className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-950">Add match</h3>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleAddMatch}>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Sport</span>
                <select
                  name="sport"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Home team</span>
                  <input
                    name="home"
                    required
                    autoFocus
                    placeholder="India"
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Away team</span>
                  <input
                    name="away"
                    required
                    placeholder="England"
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Competition</span>
                <input
                  name="competition"
                  required
                  placeholder="e.g. T20 World Cup"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Start time</span>
                <input
                  name="startTime"
                  required
                  placeholder="e.g. Tomorrow, 7:00 PM"
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
                  Add match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
