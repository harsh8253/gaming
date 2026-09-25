import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '../../api/client';
import {
  EmptyState,
  ErrorState,
  FeedStamp,
  LiveDot,
  MatchStatusBadge,
  PageHeading,
  Panel,
  Segmented,
  SkeletonRows,
  StatPair,
  TeamLink,
  TeamMark,
} from '../../components/cricketUi';
import {
  buildInningsCards,
  deliveryOutcome,
  economy,
  formatKickoff,
  formatLabel,
  formatOvers,
  humanize,
  inningsFor,
  isDelivery,
  oversFromBalls,
  playerName,
  playerNameMap,
  sideOf,
  statusGroup,
  strikeRate,
  teamCode,
  type InningsCard,
} from '../../lib/cricket';
import type { MatchSummaryResponse, Partnership, SportEvent, TimelineEvent } from '../../types/cricket';

type Tab = 'scorecard' | 'commentary' | 'lineups' | 'partnerships' | 'info';

const TABS: { value: Tab; label: string }[] = [
  { value: 'scorecard', label: 'Scorecard' },
  { value: 'commentary', label: 'Commentary' },
  { value: 'lineups', label: 'Lineups' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'info', label: 'Match info' },
];

const LIVE_REFRESH_MS = 60_000;

export function CricketMatchPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === searchParams.get('tab'))?.value ?? 'scorecard') as Tab;

  const summary = useQuery({
    queryKey: ['cricket', 'match', id, 'summary'],
    queryFn: () => cricketApi.matchSummary(id),
    refetchInterval: (query) => (statusGroup(query.state.data?.sport_event_status?.status ?? query.state.data?.sport_event.status) === 'live' ? LIVE_REFRESH_MS : false),
  });
  const isLive = statusGroup(summary.data?.sport_event_status?.status ?? summary.data?.sport_event.status) === 'live';
  const needsTimeline = tab === 'scorecard' || tab === 'commentary' || tab === 'partnerships';
  const timeline = useQuery({
    queryKey: ['cricket', 'match', id, 'timeline'],
    queryFn: () => cricketApi.matchTimeline(id),
    enabled: needsTimeline && Boolean(summary.data),
    refetchInterval: isLive ? LIVE_REFRESH_MS : false,
  });
  const lineups = useQuery({
    queryKey: ['cricket', 'match', id, 'lineups'],
    queryFn: () => cricketApi.matchLineups(id),
    enabled: (tab === 'lineups' || tab === 'partnerships') && Boolean(summary.data),
  });

  const event = summary.data?.sport_event;
  const names = useMemo(
    () =>
      playerNameMap(
        timeline.data?.timeline ?? [],
        (lineups.data?.lineups ?? []).flatMap((l) => l.starting_lineup ?? []),
      ),
    [timeline.data, lineups.data],
  );

  const cards = useMemo(
    () => (event && timeline.data ? buildInningsCards(timeline.data.timeline ?? [], timeline.data.sport_event_status ?? summary.data?.sport_event_status, event, names) : []),
    [event, timeline.data, summary.data, names],
  );

  const title = event ? `${sideOf(event, 'home')?.name ?? 'TBC'} vs ${sideOf(event, 'away')?.name ?? 'TBC'}` : 'Match';

  return (
    <>
      <PageHeading
        title={summary.isPending ? 'Loading match…' : title}
        description={
          event
            ? [event.season?.name ?? event.tournament?.name, event.tournament_round?.competition_sport_event_number ? `Match ${event.tournament_round.competition_sport_event_number}` : null, formatLabel(event.tournament?.type ?? event.sport_event_conditions?.type), formatKickoff(event)]
                .filter((p) => p && p !== '—')
                .join(' · ')
            : undefined
        }
        trail={[
          { label: 'Cricket', to: '/cricket' },
          ...(event?.season || event?.tournament
            ? [{ label: event.tournament?.name ?? event.season!.name, to: `/cricket/tournaments/${event.season?.id ?? event.tournament!.id}` }]
            : []),
          { label: event ? `${teamCode(sideOf(event, 'home'))} v ${teamCode(sideOf(event, 'away'))}` : 'Match' },
        ]}
        actions={<FeedStamp generatedAt={summary.data?.generated_at} fetching={summary.isFetching || timeline.isFetching} />}
      />

      {summary.isPending ? (
        <Panel><SkeletonRows rows={3} /></Panel>
      ) : summary.error || !summary.data || !event ? (
        <Panel><ErrorState error={summary.error} onRetry={() => void summary.refetch()} /></Panel>
      ) : (
        <>
          <Scoreboard data={summary.data} />

          <div className="mt-6 mb-5 overflow-x-auto">
            <Segmented
              label="Match sections"
              value={tab}
              onChange={(value) => {
                const params = new URLSearchParams(searchParams);
                if (value === 'scorecard') params.delete('tab');
                else params.set('tab', value);
                setSearchParams(params, { replace: true });
              }}
              options={TABS}
            />
          </div>

          {needsTimeline && timeline.isPending ? (
            <Panel><SkeletonRows /></Panel>
          ) : needsTimeline && timeline.error ? (
            <Panel><ErrorState error={timeline.error} onRetry={() => void timeline.refetch()} /></Panel>
          ) : (
            <>
              {tab === 'scorecard' && <ScorecardTab cards={cards} event={event} />}
              {tab === 'commentary' && <CommentaryTab events={timeline.data?.timeline ?? []} cards={cards} />}
              {tab === 'partnerships' && <PartnershipsTab summary={summary.data} names={names} cards={cards} />}
            </>
          )}
          {tab === 'lineups' && (
            lineups.isPending ? <Panel><SkeletonRows /></Panel> : lineups.error ? <Panel><ErrorState error={lineups.error} onRetry={() => void lineups.refetch()} /></Panel> : <LineupsTab event={event} lineups={lineups.data?.lineups ?? []} />
          )}
          {tab === 'info' && <InfoTab data={summary.data} />}
        </>
      )}
    </>
  );
}

function Scoreboard({ data }: { data: MatchSummaryResponse }) {
  const event = data.sport_event;
  const status = data.sport_event_status;
  const group = statusGroup(status?.status ?? event.status);
  const toss = status?.toss_won_by ? event.competitors.find((c) => c.id === status.toss_won_by) : undefined;

  return (
    <section
      aria-label="Scoreboard"
      className={`rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${group === 'live' ? 'border-amber-200' : 'border-slate-200'}`}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
        {group === 'live' && <LiveDot />}
        <MatchStatusBadge status={status?.status ?? event.status} />
        {status?.match_status && group !== 'finished' && (
          <span className="text-[12px] font-medium text-slate-600">{humanize(status.match_status)}</span>
        )}
        {group === 'live' && <span className="ml-auto text-[11px] text-muted-foreground">Refreshes every minute</span>}
      </div>
      <div className="grid gap-4 px-5 py-5 md:grid-cols-2 md:gap-8">
        {(['home', 'away'] as const).map((side) => {
          const team = sideOf(event, side);
          const innings = inningsFor(status, side);
          const won = status?.winner_id === team?.id;
          return (
            <div key={side} className="flex items-center gap-4">
              <TeamMark team={team} size="lg" />
              <div className="min-w-0 flex-1">
                <TeamLink team={team} className={`block truncate text-[15px] font-semibold ${won ? 'text-slate-950' : 'text-slate-700'}`} />
                <p className="text-[11px] text-muted-foreground">{side === 'home' ? 'Home' : 'Away'}{won && <span className="ml-1.5 font-semibold text-emerald-700">· Winner</span>}</p>
              </div>
              <div className="text-right tabular-nums">
                {innings.length ? (
                  innings.map((inn) => (
                    <p key={inn.number} className="leading-tight">
                      <span className={`text-[24px] font-semibold tracking-tight ${won || group === 'live' ? 'text-slate-950' : 'text-slate-700'}`}>{inn.score}</span>
                      {inn.overs !== undefined && <span className="ml-1.5 text-[11px] text-muted-foreground">{formatOvers(inn.overs)}</span>}
                    </p>
                  ))
                ) : (
                  <p className="text-[12px] text-muted-foreground">{group === 'upcoming' ? '—' : 'Yet to bat'}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {(status?.match_result_text || toss || (group === 'live' && status?.required_run_rate)) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[12px] text-slate-600">
          {status?.match_result_text && <span className="font-semibold text-slate-900">{status.match_result_text}</span>}
          {toss && <span>{toss.name} won the toss and chose to {status?.toss_decision ?? 'play'}</span>}
          {group === 'live' && status?.required_run_rate !== undefined && status.current_inning !== undefined && status.current_inning > 1 && (
            <span className="tabular-nums">Required rate {status.required_run_rate.toFixed(2)}</span>
          )}
        </div>
      )}
    </section>
  );
}

function inningsLabel(card: InningsCard): string {
  return `${teamCode(card.battingTeam)} · Inns ${card.number}`;
}

function InningsPicker({ cards, value, onChange }: { cards: InningsCard[]; value: number; onChange: (n: number) => void }) {
  if (cards.length < 2) return null;
  return (
    <Segmented
      label="Innings"
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={cards.map((card) => ({ value: String(card.number), label: `${inningsLabel(card)} · ${card.total}` }))}
    />
  );
}

function ScorecardTab({ cards, event }: { cards: InningsCard[]; event: SportEvent }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (cards.length === 0) {
    return <Panel><EmptyState title="No ball-by-ball data yet" body={statusGroup(event.status) === 'upcoming' ? 'The scorecard fills in once the first ball is bowled.' : 'Sportradar has not published deliveries for this match.'} /></Panel>;
  }
  const card = cards.find((c) => c.number === selected) ?? cards.at(-1)!;

  return (
    <div className="space-y-5">
      <InningsPicker cards={cards} value={card.number} onChange={setSelected} />

      <Panel
        title={<>{card.battingTeam?.name ?? `Innings ${card.number}`} batting</>}
        aside={
          <span className="text-[12px] tabular-nums text-slate-600">
            <span className="text-[15px] font-semibold text-slate-950">{card.total}</span>
            {card.overs && <span className="ml-1.5 text-muted-foreground">{formatOvers(card.overs)}</span>}
            {card.runRate !== null && <span className="ml-3 text-slate-500">RR {card.runRate.toFixed(2)}</span>}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="w-[26%] px-5 py-3 font-semibold">Batter</th>
                <th className="px-3 py-3 font-semibold">Dismissal</th>
                {['R', 'B', '4s', '6s', 'SR'].map((h) => (
                  <th key={h} className="w-16 px-3 py-3 text-right font-semibold last:w-20 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {card.batters.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5">
                    <Link to={`/cricket/players/${b.id}`} className="text-[12px] font-semibold text-slate-800 hover:text-blue-700">{playerName(b.name)}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500">{b.dismissal ?? <span className="font-semibold text-emerald-700">not out</span>}</td>
                  <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-950">{b.runs}</td>
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{b.balls}</td>
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{b.fours}</td>
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{b.sixes}</td>
                  <td className="px-3 py-2.5 pr-5 text-right text-[12px] tabular-nums text-slate-600">{strikeRate(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 px-5 py-3 text-[12px] text-slate-600">
          <span>
            <span className="font-semibold text-slate-800">Extras {card.extras.total}</span>
            <span className="ml-1.5 tabular-nums text-slate-500">
              (w {card.extras.wides}, nb {card.extras.noBalls}, b {card.extras.byes}, lb {card.extras.legByes}{card.extras.penalty ? `, p ${card.extras.penalty}` : ''})
            </span>
          </span>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Bowling">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Bowler</th>
                  {['O', 'M', 'R', 'W', 'Econ', '0s', 'Wd', 'Nb'].map((h) => (
                    <th key={h} className="px-2.5 py-3 text-right font-semibold last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {card.bowlers.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5">
                      <Link to={`/cricket/players/${b.id}`} className="text-[12px] font-semibold text-slate-800 hover:text-blue-700">{playerName(b.name)}</Link>
                    </td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{oversFromBalls(b.legalBalls)}</td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{b.maidens}</td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{b.runs}</td>
                    <td className="px-2.5 py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-950">{b.wickets}</td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-600">{economy(b.runs, b.legalBalls)}</td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-500">{b.dots}</td>
                    <td className="px-2.5 py-2.5 text-right text-[12px] tabular-nums text-slate-500">{b.wides}</td>
                    <td className="px-2.5 py-2.5 pr-5 text-right text-[12px] tabular-nums text-slate-500">{b.noBalls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Runs per over" aside={<span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="size-2 rounded-full bg-red-500" /> Wicket</span>}>
            <OverChart card={card} />
          </Panel>
          <Panel title="Fall of wickets">
            {card.fallOfWickets.length === 0 ? (
              <p className="px-5 py-4 text-[12px] text-slate-500">No wickets fell in this innings.</p>
            ) : (
              <ol className="flex flex-wrap gap-2 px-5 py-4">
                {card.fallOfWickets.map((f) => (
                  <li key={f.wicket} className="rounded-lg border border-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold tabular-nums text-slate-900">{f.score}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    {f.player}
                    <span className="ml-1 tabular-nums text-muted-foreground">({f.overs} ov)</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function OverChart({ card }: { card: InningsCard }) {
  const max = Math.max(6, ...card.progression.map((o) => o.runs));
  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`Runs per over for ${inningsLabel(card)}`}>
        {card.progression.map((over) => (
          <div key={over.over} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`Over ${over.over}: ${over.runs} runs${over.wickets ? `, ${over.wickets} wicket${over.wickets > 1 ? 's' : ''}` : ''}`}>
            {over.wickets > 0 && (
              <span className="mb-1 flex flex-col gap-0.5">
                {Array.from({ length: over.wickets }, (_, i) => (
                  <span key={i} className="size-1.5 rounded-full bg-red-500" />
                ))}
              </span>
            )}
            <span
              className={`w-full rounded-t-[3px] transition-colors ${over.runs >= 10 ? 'bg-blue-600' : 'bg-blue-300'} group-hover:bg-blue-800`}
              style={{ height: `${Math.max(2, (over.runs / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>Over 1</span>
        <span>Over {card.progression.at(-1)?.over ?? 1}</span>
      </div>
    </div>
  );
}

type CommentaryFilter = 'all' | 'wickets' | 'boundaries';

const OUTCOME_STYLES = {
  wicket: 'bg-red-600 text-white',
  six: 'bg-violet-600 text-white',
  four: 'bg-blue-600 text-white',
  extra: 'bg-amber-100 text-amber-800',
  dot: 'bg-slate-100 text-slate-500',
  runs: 'bg-slate-100 text-slate-800',
};

function CommentaryTab({ events, cards }: { events: TimelineEvent[]; cards: InningsCard[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<CommentaryFilter>('all');
  const inning = selected ?? cards.at(-1)?.number ?? 1;

  const overs = useMemo(() => {
    const deliveries = events.filter((e) => isDelivery(e) && e.inning === inning);
    const byOver = new Map<number, TimelineEvent[]>();
    for (const d of deliveries) {
      const list = byOver.get(d.over_number ?? 0) ?? [];
      list.push(d);
      byOver.set(d.over_number ?? 0, list);
    }
    return [...byOver.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([over, balls]) => ({
        over,
        balls: balls
          .filter((b) => filter === 'all' || (filter === 'wickets' ? b.dismissal_params : b.type === 'six' || b.type === 'boundary'))
          .reverse(),
        runs: balls.reduce((sum, b) => sum + (b.batting_params?.runs_scored ?? 0), 0),
        score: balls.at(-1)?.display_score,
        bowler: balls[0]?.bowling_params?.bowler?.name,
        timeline: balls.map(deliveryOutcome),
      }))
      .filter((o) => o.balls.length);
  }, [events, inning, filter]);

  if (cards.length === 0) {
    return <Panel><EmptyState title="No commentary yet" body="Ball-by-ball commentary appears once play begins." /></Panel>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <InningsPicker cards={cards} value={inning} onChange={setSelected} />
        <Segmented
          label="Commentary filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All balls' },
            { value: 'wickets', label: 'Wickets' },
            { value: 'boundaries', label: 'Boundaries' },
          ]}
        />
      </div>
      <Panel>
        {overs.length === 0 ? (
          <EmptyState title="Nothing for this filter" body="Try another innings or show all balls." />
        ) : (
          overs.map((over) => (
            <div key={over.over} className="border-b border-slate-100 last:border-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50/70 px-5 py-2.5">
                <span className="text-[12px] font-semibold text-slate-900">Over {over.over}</span>
                <span className="text-[11px] tabular-nums text-slate-500">{over.runs} runs · {over.score}</span>
                {over.bowler && <span className="text-[11px] text-slate-500">{playerName(over.bowler)}</span>}
                <span className="ml-auto flex gap-1" aria-label="Deliveries this over">
                  {over.timeline.map((o, i) => (
                    <span key={i} className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${OUTCOME_STYLES[o.kind]}`}>
                      {o.label}
                    </span>
                  ))}
                </span>
              </div>
              <ol>
                {over.balls.map((ball) => {
                  const outcome = deliveryOutcome(ball);
                  return (
                    <li key={ball.id} className="grid grid-cols-[44px_32px_minmax(0,1fr)] items-start gap-3 px-5 py-3">
                      <span className="pt-0.5 text-[11px] font-semibold tabular-nums text-slate-500">{ball.display_overs}</span>
                      <span className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${OUTCOME_STYLES[outcome.kind]}`}>{outcome.label}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] text-slate-500">
                          <span className="font-semibold text-slate-800">{playerName(ball.bowling_params?.bowler?.name)}</span> to{' '}
                          <span className="font-semibold text-slate-800">{playerName(ball.batting_params?.striker?.name)}</span>
                          {ball.batting_params?.shot_type && <span className="text-muted-foreground"> · {humanize(ball.batting_params.shot_type)}</span>}
                        </p>
                        {ball.commentary?.text && (
                          <p className={`mt-0.5 max-w-[75ch] text-[12px] leading-relaxed ${outcome.kind === 'wicket' ? 'font-medium text-red-800' : 'text-slate-700'}`}>{ball.commentary.text}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}

function LineupsTab({ event, lineups }: { event: SportEvent; lineups: { team: 'home' | 'away'; starting_lineup?: { id: string; name: string; type?: string; captain?: boolean; nationality?: string }[] }[] }) {
  if (lineups.length === 0) {
    return <Panel><EmptyState title="Lineups not announced" body="Playing XIs are published around the toss." /></Panel>;
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {(['home', 'away'] as const).map((side) => {
        const team = sideOf(event, side);
        const players = lineups.find((l) => l.team === side)?.starting_lineup ?? [];
        return (
          <Panel key={side} title={<span className="flex items-center gap-3"><TeamMark team={team} size="sm" />{team?.name ?? side}</span>} aside={<span className="text-[11px] text-muted-foreground">Playing XI</span>}>
            {players.length === 0 ? (
              <p className="px-5 py-4 text-[12px] text-slate-500">Not announced.</p>
            ) : (
              <ol className="divide-y divide-slate-50">
                {players.map((player, index) => (
                  <li key={player.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-5 text-[11px] font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
                    <Link to={`/cricket/players/${player.id}`} className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800 hover:text-blue-700">
                      {playerName(player.name)}
                      {player.captain && <span className="ml-1.5 text-[10px] font-bold text-blue-700">(c)</span>}
                    </Link>
                    <span className="text-[11px] text-slate-500">{player.type && player.type.length > 1 ? humanize(player.type) : '—'}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

function PartnershipsTab({ summary, names, cards }: { summary: MatchSummaryResponse; names: Map<string, string>; cards: InningsCard[] }) {
  const innings = (summary.statistics?.innings ?? [])
    .map((inning) => {
      const byWicket = new Map<number, Partnership>();
      for (const team of inning.teams ?? []) {
        for (const p of [...(team.statistics?.batting?.partnerships ?? []), ...(team.statistics?.bowling?.partnerships ?? [])]) {
          if (!byWicket.has(p.wicket_number)) byWicket.set(p.wicket_number, p);
        }
      }
      return { number: inning.number, partnerships: [...byWicket.values()].sort((a, b) => a.wicket_number - b.wicket_number) };
    })
    .filter((i) => i.partnerships.length);

  if (innings.length === 0) {
    return <Panel><EmptyState title="No partnership data" body="Partnerships are published for matches with detailed coverage." /></Panel>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {innings.map((inning) => {
        const card = cards.find((c) => c.number === inning.number);
        const best = Math.max(1, ...inning.partnerships.map((p) => p.runs ?? 0));
        return (
          <Panel key={inning.number} title={card ? `${card.battingTeam?.name ?? 'Innings'} · Innings ${inning.number}` : `Innings ${inning.number}`}>
            <ol className="divide-y divide-slate-50">
              {inning.partnerships.map((p) => (
                <li key={p.wicket_number} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-semibold text-slate-500">{ordinal(p.wicket_number)} wicket</span>
                    <span className="text-[13px] font-semibold tabular-nums text-slate-950">
                      {p.runs ?? 0}
                      <span className="ml-1 text-[11px] font-normal text-muted-foreground">({p.balls_faced ?? 0})</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${((p.runs ?? 0) / best) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    {(p.players ?? []).map((pl, i) => (
                      <span key={pl.id}>
                        {i > 0 && <span className="text-slate-300"> & </span>}
                        {playerName(names.get(pl.id))} <span className="tabular-nums text-muted-foreground">{pl.runs ?? 0} ({pl.balls_faced ?? 0})</span>
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        );
      })}
    </div>
  );
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

function InfoTab({ data }: { data: MatchSummaryResponse }) {
  const event = data.sport_event;
  const conditions = event.sport_event_conditions;
  const venue = event.venue;
  const officials = [
    ...(conditions?.referees?.referee ? [conditions.referees.referee] : []),
    ...(conditions?.referees?.umpires ?? []),
  ];
  const conditionGroups = [
    { title: 'Weather', values: conditions?.weather_info },
    { title: 'Pitch', values: conditions?.pitch_info },
    { title: 'Outfield', values: conditions?.outfield_info },
  ].filter((g) => g.values && Object.keys(g.values).length);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Fixture">
        <dl className="grid grid-cols-2 gap-4 px-5 py-4">
          <StatPair label="Tournament" value={event.tournament?.name ?? '—'} />
          <StatPair label="Season" value={event.season?.name ?? '—'} />
          <StatPair label="Format" value={formatLabel(conditions?.type ?? event.tournament?.type)} />
          <StatPair label="Round" value={event.tournament_round ? [humanize(event.tournament_round.type), event.tournament_round.name ?? event.tournament_round.number].filter(Boolean).join(' · ') : '—'} />
          <StatPair label="Start" value={formatKickoff(event)} />
          <StatPair label="Day / night" value={humanize(conditions?.day_night)} />
          <StatPair label="Neutral venue" value={conditions?.neutral_venue === undefined ? '—' : conditions.neutral_venue ? 'Yes' : 'No'} />
          <StatPair label="Coverage" value={humanize(data.coverage?.sport_event_properties?.level)} />
        </dl>
      </Panel>
      <Panel title="Venue">
        {venue ? (
          <dl className="grid grid-cols-2 gap-4 px-5 py-4">
            <div className="col-span-2"><StatPair label="Ground" value={venue.name} /></div>
            <StatPair label="City" value={venue.city_name ?? '—'} />
            <StatPair label="Country" value={venue.country_name ?? '—'} />
            <StatPair label="Capacity" value={venue.capacity ? venue.capacity.toLocaleString() : '—'} />
            <StatPair label="Time zone" value={venue.timezone ?? '—'} />
          </dl>
        ) : (
          <p className="px-5 py-4 text-[12px] text-slate-500">Venue not published for this match.</p>
        )}
      </Panel>
      <Panel title="Conditions">
        {conditionGroups.length === 0 ? (
          <p className="px-5 py-4 text-[12px] text-slate-500">No pitch or weather report for this match.</p>
        ) : (
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            {conditionGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-2 text-[11px] font-semibold text-slate-900">{group.title}</h4>
                <dl className="space-y-2">
                  {Object.entries(group.values!).map(([key, value]) => (
                    <StatPair key={key} label={humanize(key.replace(/_(conditions|info)$/, ''))} value={humanize(String(value))} />
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
        {conditions?.comment?.text && <p className="border-t border-slate-100 px-5 py-3 text-[12px] text-slate-600">{conditions.comment.text}</p>}
      </Panel>
      <Panel title="Officials and notes">
        {officials.length === 0 && !data.match_notes?.length ? (
          <p className="px-5 py-4 text-[12px] text-slate-500">No officials or notes published.</p>
        ) : (
          <div className="px-5 py-4">
            {officials.length > 0 && (
              <dl className="grid grid-cols-2 gap-4">
                {officials.map((o) => (
                  <StatPair key={o.id} label={humanize(o.type) || 'Official'} value={playerName(o.name)} />
                ))}
              </dl>
            )}
            {data.match_notes?.map((note, i) => note.text && <p key={i} className="mt-3 text-[12px] text-slate-600">{note.text}</p>)}
          </div>
        )}
      </Panel>
    </div>
  );
}
