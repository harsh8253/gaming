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
  Segmented,
  SkeletonRows,
  StatPair,
  TeamLink,
  TeamMark,
  inputClass,
} from '../../components/cricketUi';
import { age, formatDateRange, formatLabel, humanize, playerName, statusGroup } from '../../lib/cricket';
import type { EventWithStatus, Leader, Team } from '../../types/cricket';

type Tab = 'overview' | 'fixtures' | 'results' | 'standings' | 'leaders' | 'squads';

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'results', label: 'Results' },
  { value: 'standings', label: 'Standings' },
  { value: 'leaders', label: 'Leaders' },
  { value: 'squads', label: 'Squads' },
];

export function CricketTournamentPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === searchParams.get('tab'))?.value ?? 'overview') as Tab;
  const seasonParam = searchParams.get('season');
  const feedId = seasonParam ?? id;

  const info = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'info'], queryFn: () => cricketApi.tournamentInfo(feedId) });
  const tournamentId = info.data?.tournament.id ?? (id.startsWith('sr:tournament:') ? id : undefined);
  const seasons = useQuery({
    queryKey: ['cricket', 'tournament', tournamentId, 'seasons'],
    queryFn: () => cricketApi.tournamentSeasons(tournamentId!),
    enabled: Boolean(tournamentId),
  });

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }

  const tournament = info.data?.tournament;
  const season =
    seasons.data?.seasons?.find((s) => s.id === feedId) ?? info.data?.season ?? tournament?.current_season;
  const seasonList = [...(seasons.data?.seasons ?? [])].sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''));

  return (
    <>
      <PageHeading
        title={info.isPending ? 'Loading tournament…' : (season?.name ?? tournament?.name ?? 'Tournament')}
        description={
          tournament
            ? [formatLabel(tournament.type), tournament.category?.name, humanize(tournament.gender), formatDateRange(season?.start_date, season?.end_date)]
                .filter((p) => p && p !== '—')
                .join(' · ')
            : undefined
        }
        trail={[
          { label: 'Cricket', to: '/cricket' },
          { label: 'Tournaments', to: '/cricket/tournaments' },
          { label: tournament?.name ?? 'Tournament' },
        ]}
        actions={
          <>
            <FeedStamp generatedAt={info.data?.generated_at} fetching={info.isFetching} />
            {seasonList.length > 1 && (
              <select
                value={season?.id ?? ''}
                onChange={(e) => update({ season: e.target.value === tournament?.current_season?.id ? null : e.target.value })}
                aria-label="Season"
                className={inputClass}
              >
                {seasonList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </>
        }
      />

      <div className="mb-5 overflow-x-auto">
        <Segmented label="Tournament sections" value={tab} onChange={(value) => update({ tab: value === 'overview' ? null : value })} options={TABS} />
      </div>

      {info.error ? (
        <Panel>
          <ErrorState error={info.error} onRetry={() => void info.refetch()} />
        </Panel>
      ) : (
        <>
          {tab === 'overview' && <OverviewTab feedId={feedId} />}
          {tab === 'fixtures' && <MatchesTab feedId={feedId} kind="fixtures" />}
          {tab === 'results' && <MatchesTab feedId={feedId} kind="results" />}
          {tab === 'standings' && <StandingsTab feedId={feedId} />}
          {tab === 'leaders' && <LeadersTab feedId={feedId} />}
          {tab === 'squads' && <SquadsTab feedId={feedId} selected={searchParams.get('team')} onSelect={(team) => update({ team })} />}
        </>
      )}
    </>
  );
}

function OverviewTab({ feedId }: { feedId: string }) {
  const info = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'info'], queryFn: () => cricketApi.tournamentInfo(feedId) });
  const tournament = info.data?.tournament;
  const season = info.data?.season ?? tournament?.current_season;
  const groups = (info.data?.groups ?? []).filter((g) => g.teams?.length);

  if (info.isPending) return <Panel><SkeletonRows rows={4} /></Panel>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Panel title={groups.length > 1 ? 'Groups' : 'Participating teams'}>
        {groups.length === 0 ? (
          <EmptyState title="No team list published" body="Sportradar has not published the participating teams for this season yet." />
        ) : (
          <div className={`grid grid-cols-1 gap-px bg-slate-100 ${groups.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {groups.map((group, index) => (
              <div key={group.name ?? index} className="bg-white px-5 py-4">
                {groups.length > 1 && <h4 className="mb-3 text-[12px] font-semibold text-slate-900">Group {group.name}</h4>}
                <ul className={`grid grid-cols-1 gap-2 ${groups.length > 1 ? '' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                  {group.teams!.map((team) => (
                    <li key={team.id} className="flex items-center gap-3">
                      <TeamMark team={team} size="sm" />
                      <TeamLink team={team} className="truncate text-[12px] font-medium text-slate-800" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Season details">
        <dl className="grid grid-cols-2 gap-4 px-5 py-4">
          <StatPair label="Format" value={formatLabel(tournament?.type)} />
          <StatPair label="Gender" value={humanize(tournament?.gender)} />
          <StatPair label="Category" value={tournament?.category?.name ?? '—'} />
          <StatPair label="Season" value={season?.year ?? '—'} />
          <div className="col-span-2">
            <StatPair label="Dates" value={formatDateRange(season?.start_date, season?.end_date)} />
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function MatchesTab({ feedId, kind }: { feedId: string; kind: 'fixtures' | 'results' }) {
  const schedule = useQuery({
    queryKey: ['cricket', 'tournament', feedId, 'schedule'],
    queryFn: () => cricketApi.tournamentSchedule(feedId),
    enabled: kind === 'fixtures',
  });
  const results = useQuery({
    queryKey: ['cricket', 'tournament', feedId, 'results'],
    queryFn: () => cricketApi.tournamentResults(feedId),
    enabled: kind === 'results',
  });
  const active = kind === 'fixtures' ? schedule : results;

  const items: EventWithStatus[] = useMemo(() => {
    if (kind === 'fixtures') {
      return (schedule.data?.sport_events ?? [])
        .filter((e) => statusGroup(e.status) !== 'finished')
        .sort((a, b) => (a.scheduled ?? '').localeCompare(b.scheduled ?? ''))
        .map((sport_event) => ({ sport_event }));
    }
    return [...(results.data?.results ?? [])].sort((a, b) => (b.sport_event.scheduled ?? '').localeCompare(a.sport_event.scheduled ?? ''));
  }, [kind, schedule.data, results.data]);

  return (
    <Panel
      title={kind === 'fixtures' ? 'Upcoming and live fixtures' : 'Completed matches'}
      aside={<span className="text-[11px] tabular-nums text-muted-foreground">{items.length} matches</span>}
    >
      {active.isPending ? (
        <SkeletonRows />
      ) : active.error ? (
        <ErrorState error={active.error} onRetry={() => void active.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={kind === 'fixtures' ? 'No fixtures remaining' : 'No results yet'} body={kind === 'fixtures' ? 'Every scheduled match in this season has been played.' : 'Results appear here once matches finish.'} />
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map((item) => (
            <MatchRow key={item.sport_event.id} item={item} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function StandingsTab({ feedId }: { feedId: string }) {
  const standings = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'standings'], queryFn: () => cricketApi.tournamentStandings(feedId) });
  const groups = (standings.data?.standings ?? []).filter((s) => !s.type || s.type === 'total').flatMap((s) => s.groups ?? []).filter((g) => g.team_standings?.length);

  if (standings.isPending) return <Panel><SkeletonRows /></Panel>;
  if (standings.error) return <Panel><ErrorState error={standings.error} onRetry={() => void standings.refetch()} /></Panel>;
  if (groups.length === 0) {
    return <Panel><EmptyState title="No standings for this season" body="Standings are published for league and group stages once matches are played. Bilateral series usually have none." /></Panel>;
  }

  return (
    <div className="space-y-5">
      {groups.map((group, index) => (
        <Panel key={group.id ?? index} title={groups.length > 1 ? group.name : 'Points table'}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="w-12 px-5 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold">Team</th>
                  {['P', 'W', 'L', 'D', 'NR'].map((h) => (
                    <th key={h} className="px-3 py-3 text-right font-semibold">{h}</th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold">NRR</th>
                  <th className="px-3 py-3 text-right font-semibold">For</th>
                  <th className="px-3 py-3 text-right font-semibold">Against</th>
                  <th className="px-5 py-3 text-right font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.team_standings!.map((row) => (
                  <tr key={row.team.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-[12px] font-semibold tabular-nums text-slate-500">{row.rank}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-3">
                        <TeamMark team={row.team} size="sm" />
                        <TeamLink team={row.team} className="text-[12px] font-semibold text-slate-800" />
                      </span>
                    </td>
                    {[row.played, row.win, row.loss, row.draw, row.no_result].map((value, i) => (
                      <td key={i} className="px-3 py-3 text-right text-[12px] tabular-nums text-slate-600">{value ?? 0}</td>
                    ))}
                    <td className={`px-3 py-3 text-right text-[12px] font-medium tabular-nums ${(row.net_run_rate ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {row.net_run_rate !== undefined ? `${row.net_run_rate > 0 ? '+' : ''}${row.net_run_rate.toFixed(3)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] tabular-nums text-slate-500">
                      {row.runs_for ?? '—'}{row.overs_for !== undefined && <span className="text-muted-foreground">/{row.overs_for}</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] tabular-nums text-slate-500">
                      {row.runs_against ?? '—'}{row.overs_against !== undefined && <span className="text-muted-foreground">/{row.overs_against}</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold tabular-nums text-slate-950">{row.points ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </div>
  );
}

const LEADER_LABELS: Record<string, { label: string; unit: 'total' | 'average' | 'rate'; suffix?: string }> = {
  top_runs: { label: 'Most runs', unit: 'total' },
  highest_score: { label: 'Highest score', unit: 'total' },
  top_average: { label: 'Best batting average', unit: 'average' },
  top_strike_rate: { label: 'Best strike rate', unit: 'rate' },
  top_sixes: { label: 'Most sixes', unit: 'total' },
  top_fours: { label: 'Most fours', unit: 'total' },
  top_fifties: { label: 'Most fifties', unit: 'total' },
  top_hundreds: { label: 'Most hundreds', unit: 'total' },
  top_wickets: { label: 'Most wickets', unit: 'total' },
  top_economy: { label: 'Best economy', unit: 'rate' },
  top_bowling_average: { label: 'Best bowling average', unit: 'average' },
  top_dot_balls: { label: 'Most dot balls', unit: 'total' },
  top_catches: { label: 'Most catches', unit: 'total' },
};

function leaderOrder(key: string): number {
  const index = Object.keys(LEADER_LABELS).indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function leaderValue(leader: Leader, unit: 'total' | 'average' | 'rate'): string {
  const value = leader[unit] ?? leader.total ?? leader.average ?? leader.rate;
  if (value === undefined) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function LeadersTab({ feedId }: { feedId: string }) {
  const leaders = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'leaders'], queryFn: () => cricketApi.tournamentLeaders(feedId) });

  if (leaders.isPending) return <Panel><SkeletonRows /></Panel>;
  if (leaders.error) return <Panel><ErrorState error={leaders.error} onRetry={() => void leaders.refetch()} /></Panel>;

  const disciplines = (['batting', 'bowling', 'fielding'] as const)
    .map((d) => ({
      discipline: d,
      boards: Object.entries(leaders.data?.[d] ?? {})
        .filter(([, list]) => list.length)
        .sort(([a], [b]) => leaderOrder(a) - leaderOrder(b)),
    }))
    .filter((d) => d.boards.length);

  if (disciplines.length === 0) {
    return <Panel><EmptyState title="No leaderboards yet" body="Leaders are published once matches in this season have scorecards." /></Panel>;
  }

  return (
    <div className="space-y-6">
      {disciplines.map(({ discipline, boards }) => (
        <section key={discipline} aria-labelledby={`leaders-${discipline}`}>
          <h3 id={`leaders-${discipline}`} className="mb-3 text-[13px] font-semibold text-slate-900">{humanize(discipline)}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {boards.map(([key, list]) => {
              const meta = LEADER_LABELS[key] ?? { label: humanize(key.replace(/^top_/, '')), unit: 'total' as const };
              return (
                <Panel key={key} title={meta.label}>
                  <ol className="divide-y divide-slate-50">
                    {list.slice(0, 8).map((leader, index) => (
                      <li key={`${leader.player.id}-${index}`} className="flex items-center gap-3 px-5 py-2.5">
                        <span className={`w-5 text-[11px] font-semibold tabular-nums ${leader.rank === 1 ? 'text-blue-700' : 'text-muted-foreground'}`}>{leader.rank}</span>
                        <span className="min-w-0 flex-1">
                          <Link to={`/cricket/players/${leader.player.id}`} className="block truncate text-[12px] font-semibold text-slate-800 hover:text-blue-700">
                            {playerName(leader.player.name)}
                          </Link>
                          <span className="block truncate text-[10px] text-muted-foreground">{leader.team?.name}</span>
                        </span>
                        <span className={`text-[13px] font-semibold tabular-nums ${leader.rank === 1 ? 'text-slate-950' : 'text-slate-700'}`}>{leaderValue(leader, meta.unit)}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function SquadsTab({ feedId, selected, onSelect }: { feedId: string; selected: string | null; onSelect: (teamId: string) => void }) {
  const info = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'info'], queryFn: () => cricketApi.tournamentInfo(feedId) });
  const standings = useQuery({ queryKey: ['cricket', 'tournament', feedId, 'standings'], queryFn: () => cricketApi.tournamentStandings(feedId) });

  const teams = useMemo(() => {
    const byId = new Map<string, Team>();
    for (const group of info.data?.groups ?? []) for (const team of group.teams ?? []) byId.set(team.id, team);
    for (const s of standings.data?.standings ?? []) for (const g of s.groups ?? []) for (const row of g.team_standings ?? []) byId.set(row.team.id, row.team);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [info.data, standings.data]);

  const teamId = selected ?? teams[0]?.id;
  const squad = useQuery({
    queryKey: ['cricket', 'tournament', feedId, 'squad', teamId],
    queryFn: () => cricketApi.tournamentSquad(feedId, teamId!),
    enabled: Boolean(teamId),
  });

  if (info.isPending) return <Panel><SkeletonRows /></Panel>;
  if (teams.length === 0) return <Panel><EmptyState title="No squads published" body="Squads appear once teams are announced for this season." /></Panel>;

  const players = [...(squad.data?.players ?? [])].sort((a, b) => (a.type ?? 'z').localeCompare(b.type ?? 'z') || a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Panel title="Teams">
        <ul className="max-h-[520px] overflow-y-auto p-2">
          {teams.map((team) => (
            <li key={team.id}>
              <button
                onClick={() => onSelect(team.id)}
                aria-current={team.id === teamId}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${team.id === teamId ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <TeamMark team={team} size="sm" />
                <span className="truncate">{team.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={squad.data?.team.name ?? teams.find((t) => t.id === teamId)?.name}
        aside={squad.data?.manager && <span className="text-[11px] text-slate-500">Coach · <span className="font-semibold text-slate-700">{playerName(squad.data.manager.name)}</span></span>}
      >
        {squad.isPending ? (
          <SkeletonRows />
        ) : squad.error ? (
          <ErrorState error={squad.error} onRetry={() => void squad.refetch()} />
        ) : players.length === 0 ? (
          <EmptyState title="Squad not announced" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Player</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Nationality</th>
                  <th className="px-5 py-3 text-right font-semibold">Age</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-2.5">
                      <Link to={`/cricket/players/${player.id}`} className="text-[12px] font-semibold text-slate-800 hover:text-blue-700">
                        {playerName(player.name)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600">{player.type ? humanize(player.type) : '—'}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500">{player.nationality ?? '—'}</td>
                    <td className="px-5 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{age(player.date_of_birth) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
