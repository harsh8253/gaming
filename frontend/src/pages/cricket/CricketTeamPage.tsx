import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '../../api/client';
import {
  EmptyState,
  ErrorState,
  FeedStamp,
  MatchRow,
  PageHeading,
  Panel,
  SkeletonRows,
  StatPair,
  TeamMark,
  inputClass,
} from '../../components/cricketUi';
import { age, humanize, playerName, statusGroup } from '../../lib/cricket';
import type { EventWithStatus, Team } from '../../types/cricket';

export function CricketTeamPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useQuery({ queryKey: ['cricket', 'team', id, 'profile'], queryFn: () => cricketApi.teamProfile(id) });
  const schedule = useQuery({ queryKey: ['cricket', 'team', id, 'schedule'], queryFn: () => cricketApi.teamSchedule(id) });
  const results = useQuery({ queryKey: ['cricket', 'team', id, 'results'], queryFn: () => cricketApi.teamResults(id) });

  const team = profile.data?.team ?? schedule.data?.team ?? results.data?.team;

  const recent: EventWithStatus[] = useMemo(
    () => [...(results.data?.results ?? [])].sort((a, b) => (b.sport_event.scheduled ?? '').localeCompare(a.sport_event.scheduled ?? '')),
    [results.data],
  );
  const upcoming: EventWithStatus[] = useMemo(
    () =>
      (schedule.data?.schedule ?? [])
        .filter((e) => statusGroup(e.status) !== 'finished')
        .sort((a, b) => (a.scheduled ?? '').localeCompare(b.scheduled ?? ''))
        .map((sport_event) => ({ sport_event })),
    [schedule.data],
  );

  const form = recent.slice(0, 10).map((r) => {
    const winner = r.sport_event_status?.winner_id;
    const outcome: 'W' | 'L' | 'NR' = !winner ? 'NR' : winner === id ? 'W' : 'L';
    return { id: r.sport_event.id, outcome };
  });
  const wins = form.filter((f) => f.outcome === 'W').length;
  const losses = form.filter((f) => f.outcome === 'L').length;

  const opponents = useMemo(() => {
    const byId = new Map<string, Team>();
    for (const e of [...(schedule.data?.schedule ?? []), ...recent.map((r) => r.sport_event)]) {
      for (const c of e.competitors) if (c.id !== id && !c.virtual) byId.set(c.id, c);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [schedule.data, recent, id]);

  const vs = searchParams.get('vs') ?? '';
  const versus = useQuery({
    queryKey: ['cricket', 'team', id, 'versus', vs],
    queryFn: () => cricketApi.teamVersus(id, vs),
    enabled: Boolean(vs),
  });

  const loading = profile.isPending && schedule.isPending;

  return (
    <>
      <PageHeading
        title={
          <span className="flex items-center gap-4">
            <TeamMark team={team} size="lg" />
            {team?.name ?? (loading ? 'Loading team…' : 'Team')}
          </span>
        }
        description={team ? [team.country, profile.data?.team.category?.name, team.gender && humanize(team.gender)].filter(Boolean).join(' · ') : undefined}
        trail={[{ label: 'Cricket', to: '/cricket' }, { label: 'Teams' }, { label: team?.abbreviation ?? team?.name ?? 'Team' }]}
        actions={<FeedStamp generatedAt={results.data?.generated_at} fetching={results.isFetching} />}
      />

      {profile.error && schedule.error ? (
        <Panel><ErrorState error={profile.error} onRetry={() => void profile.refetch()} /></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Panel title="Upcoming fixtures" aside={<span className="text-[11px] tabular-nums text-slate-400">{upcoming.length}</span>}>
              {schedule.isPending ? <SkeletonRows rows={3} /> : schedule.error ? <ErrorState error={schedule.error} onRetry={() => void schedule.refetch()} /> : upcoming.length === 0 ? (
                <EmptyState title="No fixtures scheduled" />
              ) : (
                <div className="divide-y divide-slate-50">{upcoming.map((item) => <MatchRow key={item.sport_event.id} item={item} showTournament />)}</div>
              )}
            </Panel>
            <Panel title="Recent results" aside={<span className="text-[11px] tabular-nums text-slate-400">Last {recent.length}</span>}>
              {results.isPending ? <SkeletonRows /> : results.error ? <ErrorState error={results.error} onRetry={() => void results.refetch()} /> : recent.length === 0 ? (
                <EmptyState title="No recent results" />
              ) : (
                <div className="divide-y divide-slate-50">{recent.map((item) => <MatchRow key={item.sport_event.id} item={item} showTournament />)}</div>
              )}
            </Panel>
            <Panel
              title="Head to head"
              aside={
                <select
                  value={vs}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) params.set('vs', e.target.value);
                    else params.delete('vs');
                    setSearchParams(params, { replace: true });
                  }}
                  aria-label="Opponent"
                  className={inputClass}
                >
                  <option value="">Choose an opponent</option>
                  {opponents.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              }
            >
              {!vs ? (
                <p className="px-5 py-4 text-[12px] text-slate-500">Pick a recent or upcoming opponent to see previous and next meetings.</p>
              ) : versus.isPending ? (
                <SkeletonRows rows={3} />
              ) : versus.error ? (
                <ErrorState error={versus.error} onRetry={() => void versus.refetch()} />
              ) : (
                <HeadToHead teamId={id} last={versus.data?.last_meetings ?? []} next={versus.data?.next_meetings ?? []} />
              )}
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel title="Form" aside={form.length > 0 && <span className="text-[11px] tabular-nums text-slate-500">{wins}W · {losses}L</span>}>
              {form.length === 0 ? (
                <p className="px-5 py-4 text-[12px] text-slate-500">No completed matches yet.</p>
              ) : (
                <ol className="flex flex-wrap gap-1.5 px-5 py-4" aria-label="Most recent first">
                  {form.map((f) => (
                    <li key={f.id}>
                      <Link
                        to={`/cricket/matches/${f.id}`}
                        className={`flex size-8 items-center justify-center rounded-md text-[11px] font-bold ${f.outcome === 'W' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : f.outcome === 'L' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {f.outcome}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
            <Panel title="Profile">
              <dl className="grid grid-cols-2 gap-4 px-5 py-4">
                <StatPair label="Abbreviation" value={team?.abbreviation ?? '—'} />
                <StatPair label="Country" value={team?.country ?? '—'} />
                <StatPair label="Category" value={profile.data?.team.category?.name ?? '—'} />
                <StatPair label="Gender" value={humanize(team?.gender)} />
                {profile.data?.manager && <div className="col-span-2"><StatPair label="Coach" value={playerName(profile.data.manager.name)} /></div>}
                {profile.data?.venue && <div className="col-span-2"><StatPair label="Home ground" value={profile.data.venue.name} /></div>}
              </dl>
            </Panel>
            {profile.data?.players && profile.data.players.length > 0 && (
              <Panel title="Players">
                <ul className="divide-y divide-slate-50">
                  {profile.data.players.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <Link to={`/cricket/players/${p.id}`} className="truncate text-[12px] font-semibold text-slate-800 hover:text-blue-700">{playerName(p.name)}</Link>
                      <span className="shrink-0 text-[11px] text-slate-500">{[p.type && humanize(p.type), age(p.date_of_birth)].filter(Boolean).join(' · ')}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function HeadToHead({ teamId, last, next }: { teamId: string; last: EventWithStatus[]; next: EventWithStatus[] }) {
  const wins = last.filter((m) => m.sport_event_status?.winner_id === teamId).length;
  const losses = last.filter((m) => m.sport_event_status?.winner_id && m.sport_event_status.winner_id !== teamId).length;
  if (last.length === 0 && next.length === 0) return <EmptyState title="These teams have not met in the feed" />;
  return (
    <>
      {last.length > 0 && (
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] font-semibold tabular-nums text-slate-600">
          Previous meetings · {wins} won · {losses} lost · {last.length - wins - losses} no result
        </div>
      )}
      <div className="divide-y divide-slate-50">
        {[...next, ...last].map((item) => <MatchRow key={item.sport_event.id} item={item} showTournament />)}
      </div>
    </>
  );
}
