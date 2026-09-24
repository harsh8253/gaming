import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';
import { cricketApi } from '../../api/client';
import {
  CricketSubnav,
  EmptyState,
  ErrorState,
  FeedStamp,
  PageHeading,
  Panel,
  Segmented,
  SkeletonRows,
  inputClass,
} from '../../components/cricketUi';
import { StatusBadge } from '../../components/deskUi';
import { formatDateRange, formatLabel, humanize, localDateKey } from '../../lib/cricket';
import type { Tournament } from '../../types/cricket';

const PAGE_SIZE = 60;

type Phase = 'all' | 'running' | 'upcoming' | 'past';

function phaseOf(tournament: Tournament, today: string): Exclude<Phase, 'all'> {
  const season = tournament.current_season;
  if (!season?.start_date || !season.end_date) return 'past';
  if (season.start_date > today) return 'upcoming';
  if (season.end_date < today) return 'past';
  return 'running';
}

export function CricketTournamentsPage() {
  const tournaments = useQuery({ queryKey: ['cricket', 'tournaments'], queryFn: cricketApi.tournaments, staleTime: 30 * 60_000 });
  const tours = useQuery({ queryKey: ['cricket', 'tours'], queryFn: cricketApi.tours, staleTime: 30 * 60_000 });
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('running');
  const [format, setFormat] = useState('all');
  const [gender, setGender] = useState('all');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const today = localDateKey(new Date());

  const all = useMemo(() => {
    const byId = new Map<string, Tournament>();
    for (const t of [...(tournaments.data?.tournaments ?? []), ...(tours.data?.tours ?? [])]) byId.set(t.id, t);
    return [...byId.values()].sort((a, b) => (b.current_season?.start_date ?? '').localeCompare(a.current_season?.start_date ?? ''));
  }, [tournaments.data, tours.data]);

  const options = useMemo(() => {
    const unique = (values: (string | undefined)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
    return {
      formats: unique(all.map((t) => t.type)),
      genders: unique(all.map((t) => t.gender)),
      categories: unique(all.map((t) => t.category?.name)),
    };
  }, [all]);

  const phaseCounts = useMemo(() => {
    const counts: Record<Phase, number> = { all: all.length, running: 0, upcoming: 0, past: 0 };
    for (const t of all) counts[phaseOf(t, today)] += 1;
    return counts;
  }, [all, today]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = all.filter(
      (t) =>
        (phase === 'all' || phaseOf(t, today) === phase) &&
        (format === 'all' || t.type === format) &&
        (gender === 'all' || t.gender === gender) &&
        (category === 'all' || t.category?.name === category) &&
        (!needle || `${t.name} ${t.category?.name ?? ''} ${t.current_season?.name ?? ''}`.toLowerCase().includes(needle)),
    );
    return phase === 'upcoming' ? list.reverse() : list;
  }, [all, query, phase, format, gender, category, today]);

  function resetLimit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setLimit(PAGE_SIZE);
    };
  }

  function clearFilters() {
    setQuery('');
    setPhase('all');
    setFormat('all');
    setGender('all');
    setCategory('all');
  }

  return (
    <>
      <PageHeading
        title="Tournaments"
        description="Every competition and tour in the feed, with standings, leaders, squads, fixtures, and results."
        trail={[{ label: 'Cricket', to: '/cricket' }, { label: 'Tournaments' }]}
        actions={<FeedStamp generatedAt={tournaments.data?.generated_at} fetching={tournaments.isFetching} />}
      />
      <CricketSubnav />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Segmented
            label="Season phase"
            value={phase}
            onChange={resetLimit(setPhase)}
            options={[
              { value: 'running', label: 'In progress', count: phaseCounts.running },
              { value: 'upcoming', label: 'Upcoming', count: phaseCounts.upcoming },
              { value: 'past', label: 'Completed', count: phaseCounts.past },
              { value: 'all', label: 'All', count: phaseCounts.all },
            ]}
          />
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => resetLimit(setQuery)(e.target.value)}
              placeholder="Search tournaments, countries, seasons..."
              aria-label="Search tournaments"
              className={`${inputClass} w-full bg-slate-50 pl-9 focus:bg-white`}
            />
          </div>
          <select value={format} onChange={(e) => resetLimit(setFormat)(e.target.value)} aria-label="Filter by format" className={inputClass}>
            <option value="all">All formats</option>
            {options.formats.map((f) => (
              <option key={f} value={f}>{formatLabel(f)}</option>
            ))}
          </select>
          <select value={gender} onChange={(e) => resetLimit(setGender)(e.target.value)} aria-label="Filter by gender" className={inputClass}>
            <option value="all">Men & women</option>
            {options.genders.map((g) => (
              <option key={g} value={g}>{humanize(g)}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => resetLimit(setCategory)(e.target.value)} aria-label="Filter by category" className={`${inputClass} max-w-[180px]`}>
            <option value="all">All categories</option>
            {options.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {tournaments.isPending ? (
          <SkeletonRows rows={8} />
        ) : tournaments.error ? (
          <ErrorState error={tournaments.error} onRetry={() => void tournaments.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No tournaments match"
            body="Try another phase, format, or search term."
            action={<button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">Clear filters</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Tournament</th>
                    <th className="px-3 py-3 font-semibold">Format</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Current season</th>
                    <th className="px-3 py-3 font-semibold">Dates</th>
                    <th className="px-5 py-3 font-semibold"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, limit).map((t) => {
                    const current = phaseOf(t, today);
                    return (
                      <tr key={t.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <Link to={`/cricket/tournaments/${t.id}`} className="text-[12px] font-semibold text-slate-800 group-hover:text-blue-700">
                            {t.name}
                          </Link>
                          {t.gender && t.gender !== 'men' && <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-violet-600">{t.gender}</span>}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-slate-600">{formatLabel(t.type)}</td>
                        <td className="px-3 py-3 text-[11px] text-slate-500">{t.category?.name ?? '—'}</td>
                        <td className="px-3 py-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-2">
                            {current === 'running' && <StatusBadge tone="amber">IN PROGRESS</StatusBadge>}
                            {current === 'upcoming' && <StatusBadge tone="blue">UPCOMING</StatusBadge>}
                            <span className="truncate">{t.current_season?.year ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[11px] tabular-nums text-slate-500">
                          {formatDateRange(t.current_season?.start_date, t.current_season?.end_date)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight size={15} className="inline text-slate-300 group-hover:text-blue-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              <span className="tabular-nums">
                Showing {Math.min(limit, filtered.length)} of {filtered.length}
              </span>
              {limit < filtered.length && (
                <button onClick={() => setLimit((n) => n + PAGE_SIZE)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                  Show more
                </button>
              )}
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
