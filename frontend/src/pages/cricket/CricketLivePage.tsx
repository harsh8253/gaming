import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cricketApi } from '../../api/client';
import {
  CricketSubnav,
  EmptyState,
  ErrorState,
  FeedStamp,
  LiveDot,
  MatchRow,
  PageHeading,
  Panel,
  Segmented,
  SkeletonRows,
  TeamMark,
  inputClass,
} from '../../components/cricketUi';
import {
  eventStatus,
  formatDate,
  formatLabel,
  formatOvers,
  humanize,
  inningsFor,
  localDateKey,
  mergeScheduleWithResults,
  shiftDateKey,
  sideOf,
  statusGroup,
  type StatusGroup,
} from '../../lib/cricket';
import type { EventWithStatus, MatchSummaryResponse, SportEventStatus } from '../../types/cricket';

const LIVE_REFRESH_MS = 60_000;
const MAX_LIVE_SCORECARDS = 6;

type Filter = 'all' | StatusGroup;

export function CricketLivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = localDateKey(new Date());
  const date = searchParams.get('date') ?? today;
  const isToday = date === today;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');

  const schedule = useQuery({ queryKey: ['cricket', 'schedule', date], queryFn: () => cricketApi.dailySchedule(date) });
  const results = useQuery({ queryKey: ['cricket', 'results', date], queryFn: () => cricketApi.dailyResults(date) });
  const live = useQuery({
    queryKey: ['cricket', 'live'],
    queryFn: cricketApi.live,
    enabled: isToday,
    refetchInterval: LIVE_REFRESH_MS,
  });

  const liveIds = (live.data?.sport_events ?? [])
    .filter((event) => statusGroup(event.status) === 'live')
    .slice(0, MAX_LIVE_SCORECARDS)
    .map((event) => event.id);

  const liveSummaries = useQueries({
    queries: liveIds.map((id) => ({
      queryKey: ['cricket', 'match', id, 'summary'],
      queryFn: () => cricketApi.matchSummary(id),
      refetchInterval: LIVE_REFRESH_MS,
    })),
  });

  const summaryData = liveSummaries.map((q) => q.data).filter((d): d is MatchSummaryResponse => Boolean(d));
  const summaryKey = summaryData.map((d) => `${d.sport_event.id}:${d.sport_event_status?.display_score}`).join('|');

  const items = useMemo(() => {
    const statusById = new Map<string, SportEventStatus>();
    for (const summary of summaryData) {
      if (summary.sport_event_status) statusById.set(summary.sport_event.id, summary.sport_event_status);
    }
    const events = [...(schedule.data?.sport_events ?? [])];
    if (isToday) {
      for (const event of live.data?.sport_events ?? []) {
        if (!events.some((e) => e.id === event.id)) events.push(event);
      }
    }
    const liveStatus = new Map((live.data?.sport_events ?? []).map((e) => [e.id, e.status]));
    return mergeScheduleWithResults(
      events.map((e) => (liveStatus.has(e.id) ? { ...e, status: liveStatus.get(e.id) } : e)),
      results.data?.results ?? [],
      statusById,
    ).sort((a, b) => (a.sport_event.scheduled ?? '').localeCompare(b.sport_event.scheduled ?? ''));
    // summaryKey stands in for summaryData, which is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.data, results.data, live.data, isToday, summaryKey]);

  const counts = useMemo(() => {
    const tally: Record<Filter, number> = { all: items.length, live: 0, upcoming: 0, finished: 0, off: 0 };
    for (const item of items) tally[statusGroup(eventStatus(item))] += 1;
    return tally;
  }, [items]);

  const formats = useMemo(
    () => [...new Set(items.map((i) => i.sport_event.tournament?.type).filter((t): t is string => Boolean(t)))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const event = item.sport_event;
      const haystack = `${event.competitors.map((c) => c.name).join(' ')} ${event.tournament?.name ?? ''} ${event.season?.name ?? ''}`.toLowerCase();
      return (
        (filter === 'all' || statusGroup(eventStatus(item)) === filter) &&
        (format === 'all' || event.tournament?.type === format) &&
        (!needle || haystack.includes(needle))
      );
    });
  }, [items, filter, format, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, { key: string; tournamentId?: string; name: string; type?: string; category?: string; items: EventWithStatus[] }>();
    for (const item of filtered) {
      const event = item.sport_event;
      const key = event.season?.id ?? event.tournament?.id ?? 'other';
      const group = groups.get(key) ?? {
        key,
        tournamentId: event.season?.id ?? event.tournament?.id,
        name: event.season?.name ?? event.tournament?.name ?? 'Other matches',
        type: event.tournament?.type,
        category: event.tournament?.category?.name,
        items: [],
      };
      group.items.push(item);
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [filtered]);

  const liveCards = items.filter((item) => liveIds.includes(item.sport_event.id));
  const loading = schedule.isPending || results.isPending;
  const error = schedule.error ?? results.error;

  function goTo(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === today) params.delete('date');
    else params.set('date', next);
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setFilter('all');
    setFormat('all');
    setQuery('');
  }

  return (
    <>
      <PageHeading
        title="Cricket"
        description="Live scores, fixtures, and results from the Sportradar Cricket feed."
        actions={<FeedStamp generatedAt={live.data?.generated_at ?? schedule.data?.generated_at} fetching={live.isFetching || schedule.isFetching} />}
      />
      <CricketSubnav />

      {isToday && liveCards.length > 0 && (
        <section aria-labelledby="live-now" className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <LiveDot />
            <h3 id="live-now" className="text-[13px] font-semibold text-slate-900">
              Live now
            </h3>
            <span className="text-[11px] text-muted-foreground">Scores refresh every minute</span>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3 [&>*]:w-[86%] [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-auto">
            {liveCards.map((item) => (
              <LiveScoreCard key={item.sport_event.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <Panel>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <div className="flex w-full items-center gap-1 sm:w-auto">
            <button onClick={() => goTo(shiftDateKey(date, -1))} aria-label="Previous day" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && goTo(e.target.value)}
              aria-label="Match day"
              className={`${inputClass} min-w-0 flex-1 tabular-nums sm:flex-none`}
            />
            <button onClick={() => goTo(shiftDateKey(date, 1))} aria-label="Next day" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <button onClick={() => goTo(today)} className="ml-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50">
                Today
              </button>
            )}
          </div>
          <Segmented
            label="Match status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'live', label: 'Live', count: counts.live },
              { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
              { value: 'finished', label: 'Finished', count: counts.finished },
              ...(counts.off ? [{ value: 'off' as const, label: 'Called off', count: counts.off }] : []),
            ]}
          />
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team or tournament..."
              aria-label="Search matches"
              className={`${inputClass} w-full bg-slate-50 pl-9 focus:bg-white`}
            />
          </div>
          <select value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Filter by format" className={inputClass}>
            <option value="all">All formats</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {formatLabel(f)}
              </option>
            ))}
          </select>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] font-semibold text-slate-500">
          {isToday ? 'Today' : formatDate(date)} · {items.length} {items.length === 1 ? 'match' : 'matches'}
        </div>

        {loading ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => { void schedule.refetch(); void results.refetch(); }} />
        ) : items.length === 0 ? (
          <EmptyState
            title={`No cricket scheduled for ${isToday ? 'today' : formatDate(date)}`}
            body="Try another day, or browse tournaments for full fixture lists."
            action={<Link to="/cricket/tournaments" className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">Browse tournaments</Link>}
          />
        ) : grouped.length === 0 ? (
          <EmptyState
            title="No matches fit these filters"
            body="Try a different status, format, or search."
            action={<button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">Clear filters</button>}
          />
        ) : (
          grouped.map((group) => (
            <div key={group.key} className="border-b border-slate-100 last:border-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2 bg-white px-5 pt-4 pb-1">
                {group.tournamentId ? (
                  <Link to={`/cricket/tournaments/${group.tournamentId}`} className="text-[12px] font-semibold text-slate-900 hover:text-blue-700">
                    {group.name}
                  </Link>
                ) : (
                  <span className="text-[12px] font-semibold text-slate-900">{group.name}</span>
                )}
                <span className="text-[11px] text-muted-foreground">{[group.category, formatLabel(group.type)].filter((p) => p && p !== '—').join(' · ')}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {group.items.map((item) => (
                  <MatchRow key={item.sport_event.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}

function LiveScoreCard({ item }: { item: EventWithStatus }) {
  const event = item.sport_event;
  const status = item.sport_event_status;
  const toss = status?.toss_won_by ? event.competitors.find((c) => c.id === status.toss_won_by) : undefined;

  return (
    <Link
      to={`/cricket/matches/${event.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-slate-500">{event.season?.name ?? event.tournament?.name}</span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">{formatLabel(event.tournament?.type)}</span>
      </div>
      <div className="mt-3 space-y-2">
        {(['home', 'away'] as const).map((side) => {
          const team = sideOf(event, side);
          const innings = inningsFor(status, side);
          const batting = status?.current_inning !== undefined && innings.some((inn) => inn.number === status.current_inning);
          return (
            <div key={side} className="flex items-center gap-3">
              <TeamMark team={team} />
              <span className={`min-w-0 flex-1 truncate text-[13px] ${batting ? 'font-semibold text-slate-950' : 'font-medium text-slate-600'}`}>
                {team?.name ?? 'TBC'}
              </span>
              <span className="text-right tabular-nums">
                {innings.length ? (
                  innings.map((inn) => (
                    <span key={inn.number} className="ml-2 inline-flex items-baseline gap-1">
                      <span className={`text-[17px] font-semibold tracking-tight ${batting && inn.number === status?.current_inning ? 'text-slate-950' : 'text-slate-500'}`}>
                        {inn.score}
                      </span>
                      {inn.overs !== undefined && <span className="text-[10px] text-muted-foreground">{formatOvers(inn.overs)}</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-muted-foreground">Yet to bat</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
        {status ? (
          <>
            <span className="font-semibold text-amber-700">{humanize(status.match_status)}</span>
            {toss && ` · ${toss.name} won the toss, chose to ${status.toss_decision ?? 'play'}`}
          </>
        ) : (
          'Loading live score…'
        )}
      </p>
    </Link>
  );
}
