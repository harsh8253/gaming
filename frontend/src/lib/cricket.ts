import type {
  EventWithStatus,
  PeriodScore,
  SportEvent,
  SportEventStatus,
  Team,
  TimelineEvent,
} from '../types/cricket';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate';
export type StatusGroup = 'live' | 'upcoming' | 'finished' | 'off';

const FORMAT_LABELS: Record<string, string> = {
  test: 'Test',
  odi: 'ODI',
  t20i: 'T20I',
  t20: 'T20',
  t10: 'T10',
  first_class: 'First-class',
  list_a: 'List A',
  the_hundred: 'The Hundred',
};

export function formatLabel(type?: string): string {
  if (!type) return '—';
  return FORMAT_LABELS[type] ?? humanize(type);
}

export function humanize(value?: string): string {
  if (!value) return '—';
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Sportradar lists people as "Surname, Given"; the desk shows "Given Surname". */
export function playerName(name?: string): string {
  if (!name) return 'Unknown player';
  const [last, first] = name.split(',').map((part) => part.trim());
  return first ? `${first} ${last}` : name;
}

export function statusGroup(status?: string): StatusGroup {
  switch (status) {
    case 'live':
    case 'interrupted':
    case 'delayed':
    case 'suspended':
      return 'live';
    case 'closed':
    case 'ended':
    case 'complete':
      return 'finished';
    case 'cancelled':
    case 'postponed':
    case 'abandoned':
      return 'off';
    default:
      return 'upcoming';
  }
}

export function statusTone(status?: string): Tone {
  return { live: 'amber', upcoming: 'blue', finished: 'slate', off: 'red' }[statusGroup(status)] as Tone;
}

export function statusLabel(status?: string): string {
  if (!status || status === 'not_started') return 'UPCOMING';
  if (status === 'closed' || status === 'ended') return 'FINISHED';
  if (status === 'match_about_to_start') return 'STARTING';
  return status.replace(/_/g, ' ').toUpperCase();
}

export function eventStatus(item: { sport_event: SportEvent; sport_event_status?: SportEventStatus }): string | undefined {
  return item.sport_event_status?.status ?? item.sport_event.status;
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? iso : dateFmt.format(date);
}

export function formatKickoff(event: SportEvent): string {
  if (!event.scheduled) return 'Time TBC';
  const date = new Date(event.scheduled);
  const day = shortDateFmt.format(date);
  return event.start_time_tbd ? `${day} · Time TBC` : `${day} · ${timeFmt.format(date)}`;
}

export function formatTime(iso?: string): string {
  return iso ? timeFmt.format(new Date(iso)) : '—';
}

export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '—';
  if (!end || start === end) return formatDate(start ?? end);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function age(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function teamCode(team?: Team): string {
  if (!team) return '—';
  return team.abbreviation ?? team.name.slice(0, 3).toUpperCase();
}

export function sideOf(event: SportEvent, side: 'home' | 'away'): Team | undefined {
  return event.competitors.find((team) => team.qualifier === side) ?? event.competitors[side === 'home' ? 0 : 1];
}

function battingSide(period: PeriodScore): 'home' | 'away' | null {
  if (period.home_wickets !== undefined || (period.home_score ?? 0) > 0) return 'home';
  if (period.away_wickets !== undefined || (period.away_score ?? 0) > 0) return 'away';
  return null;
}

export type TeamInnings = { number: number; score: string; overs?: number };

export function inningsFor(status: SportEventStatus | undefined, side: 'home' | 'away'): TeamInnings[] {
  return (status?.period_scores ?? [])
    .filter((period) => battingSide(period) === side)
    .map((period) => ({
      number: period.number,
      score:
        period.display_score ??
        `${side === 'home' ? period.home_score : period.away_score}/${(side === 'home' ? period.home_wickets : period.away_wickets) ?? 0}`,
      overs: period.display_overs,
    }));
}

export function formatOvers(overs?: number | string): string {
  if (overs === undefined || overs === null || overs === '') return '';
  return `${overs} ov`;
}

export function mergeScheduleWithResults(
  events: SportEvent[],
  results: EventWithStatus[],
  statusById: Map<string, SportEventStatus> = new Map(),
): EventWithStatus[] {
  const byId = new Map<string, EventWithStatus>();
  for (const event of events) byId.set(event.id, { sport_event: event, sport_event_status: statusById.get(event.id) });
  for (const result of results) {
    const existing = byId.get(result.sport_event.id);
    byId.set(result.sport_event.id, {
      sport_event: { ...existing?.sport_event, ...result.sport_event, tournament: result.sport_event.tournament ?? existing?.sport_event.tournament },
      sport_event_status: result.sport_event_status ?? existing?.sport_event_status,
    });
  }
  return [...byId.values()];
}

// Scorecards are derived from the ball-by-ball timeline: on this feed the
// match summary only carries partnerships, while the timeline has every delivery.

export type BatterLine = {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dots: number;
  dismissal: string | null;
};

export type BowlerLine = {
  id: string;
  name: string;
  legalBalls: number;
  runs: number;
  wickets: number;
  maidens: number;
  dots: number;
  wides: number;
  noBalls: number;
};

export type OverSummary = { over: number; runs: number; wickets: number };

export type InningsCard = {
  number: number;
  battingTeam?: Team;
  total: string;
  overs: string;
  runRate: number | null;
  batters: BatterLine[];
  bowlers: BowlerLine[];
  extras: { wides: number; noBalls: number; byes: number; legByes: number; penalty: number; total: number };
  fallOfWickets: { wicket: number; score: string; overs: string; player: string }[];
  progression: OverSummary[];
};

const BOWLER_CREDITED = new Set(['bowled', 'caught', 'leg_before_wicket', 'stumped', 'caught_and_bowled', 'hit_wicket']);

function dismissalText(
  details: NonNullable<TimelineEvent['dismissal_params']>['dismissal_details'],
  names: Map<string, string>,
): string {
  const bowler = details?.bowler_id ? playerName(names.get(details.bowler_id)) : '';
  const fielderId = details?.fielder_id ?? details?.fielders?.[0]?.id;
  const fielder = fielderId ? playerName(names.get(fielderId)) : '';
  switch (details?.type) {
    case 'bowled':
      return `b ${bowler}`;
    case 'caught':
      return fielder && fielder !== bowler ? `c ${fielder} b ${bowler}` : `c & b ${bowler}`;
    case 'caught_and_bowled':
      return `c & b ${bowler}`;
    case 'leg_before_wicket':
      return `lbw b ${bowler}`;
    case 'stumped':
      return `st ${fielder || '?'} b ${bowler}`;
    case 'run_out':
      return fielder ? `run out (${fielder})` : 'run out';
    case 'hit_wicket':
      return `hit wicket b ${bowler}`;
    default:
      return humanize(details?.type).toLowerCase();
  }
}

export function isDelivery(event: TimelineEvent): boolean {
  return event.inning !== undefined && event.bowling_params !== undefined && event.batting_params !== undefined;
}

export function playerNameMap(events: TimelineEvent[], extra: { id: string; name: string }[] = []): Map<string, string> {
  const names = new Map<string, string>();
  for (const person of extra) names.set(person.id, person.name);
  for (const event of events) {
    for (const person of [
      event.batting_params?.striker,
      event.batting_params?.non_striker,
      event.bowling_params?.bowler,
      event.dismissal_params?.player,
    ]) {
      if (person?.id && person.name && !names.has(person.id)) names.set(person.id, person.name);
    }
  }
  return names;
}

export function buildInningsCards(
  events: TimelineEvent[],
  status: SportEventStatus | undefined,
  event: SportEvent,
  names: Map<string, string>,
): InningsCard[] {
  const deliveries = events.filter(isDelivery);
  const inningNumbers = [...new Set(deliveries.map((d) => d.inning as number))].sort((a, b) => a - b);

  return inningNumbers.map((number) => {
    const balls = deliveries.filter((d) => d.inning === number);
    const batters = new Map<string, BatterLine>();
    const bowlers = new Map<string, BowlerLine>();
    const overRuns = new Map<number, OverSummary>();
    const bowlerOverRuns = new Map<string, Map<number, { runs: number; legal: number }>>();
    const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
    const fallOfWickets: InningsCard['fallOfWickets'] = [];

    const batter = (ref?: { id: string; name: string }) => {
      if (!ref?.id) return null;
      let line = batters.get(ref.id);
      if (!line) {
        line = { id: ref.id, name: ref.name, runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, dismissal: null };
        batters.set(ref.id, line);
      }
      return line;
    };

    for (const ball of balls) {
      const bat = ball.batting_params!;
      const bowl = ball.bowling_params!;
      const striker = batter(bat.striker);
      batter(bat.non_striker);
      const total = bat.runs_scored ?? 0;
      const extra = bowl.extra_runs_conceded ?? 0;
      const extraType = bowl.extra_runs_type;
      const isWide = extraType === 'wide';
      const isNoBall = extraType === 'no_ball';
      const offBat = isWide || extraType === 'bye' || extraType === 'leg_bye' ? 0 : total - (isNoBall ? extra : 0);

      if (striker) {
        striker.runs += offBat;
        if (!isWide) striker.balls += 1;
        if (!isWide && total === 0) striker.dots += 1;
        if (ball.type === 'six' || (offBat === 6 && bat.hit_to_boundary)) striker.sixes += 1;
        else if (ball.type === 'boundary' || (offBat === 4 && bat.hit_to_boundary)) striker.fours += 1;
      }

      if (isWide) extras.wides += extra;
      else if (isNoBall) extras.noBalls += extra;
      else if (extraType === 'bye') extras.byes += extra;
      else if (extraType === 'leg_bye') extras.legByes += extra;
      else if (extraType === 'penalty') extras.penalty += extra;
      extras.total += extraType ? extra : 0;

      const byeRuns = extraType === 'bye' || extraType === 'leg_bye' || extraType === 'penalty' ? extra : 0;
      const legal = !isWide && !isNoBall;
      const overNumber = ball.over_number ?? 0;
      if (bowl.bowler?.id) {
        let line = bowlers.get(bowl.bowler.id);
        if (!line) {
          line = { id: bowl.bowler.id, name: bowl.bowler.name, legalBalls: 0, runs: 0, wickets: 0, maidens: 0, dots: 0, wides: 0, noBalls: 0 };
          bowlers.set(bowl.bowler.id, line);
        }
        line.runs += total - byeRuns;
        if (legal) line.legalBalls += 1;
        if (legal && total === 0) line.dots += 1;
        if (isWide) line.wides += 1;
        if (isNoBall) line.noBalls += 1;
        const perOver = bowlerOverRuns.get(line.id) ?? new Map();
        const slot = perOver.get(overNumber) ?? { runs: 0, legal: 0 };
        slot.runs += total - byeRuns;
        if (legal) slot.legal += 1;
        perOver.set(overNumber, slot);
        bowlerOverRuns.set(line.id, perOver);
      }

      const over = overRuns.get(overNumber) ?? { over: overNumber, runs: 0, wickets: 0 };
      over.runs += total;

      const dismissal = ball.dismissal_params;
      if (dismissal?.player?.id) {
        over.wickets += 1;
        const out = batter(dismissal.player);
        if (out) out.dismissal = dismissalText(dismissal.dismissal_details, names);
        const credited = dismissal.dismissal_details?.bowler_id;
        if (credited && BOWLER_CREDITED.has(dismissal.dismissal_details?.type ?? '')) {
          const line = bowlers.get(credited);
          if (line) line.wickets += 1;
        }
        fallOfWickets.push({
          wicket: fallOfWickets.length + 1,
          score: ball.display_score ?? '',
          overs: ball.display_overs ?? '',
          player: playerName(dismissal.player.name),
        });
      }
      overRuns.set(overNumber, over);
    }

    for (const [bowlerId, perOver] of bowlerOverRuns) {
      const line = bowlers.get(bowlerId)!;
      line.maidens = [...perOver.values()].filter((slot) => slot.legal === 6 && slot.runs === 0).length;
    }

    const last = balls.at(-1);
    const period = status?.period_scores?.find((p) => p.number === number);
    const side = period ? battingSide(period) : null;
    const battingTeam = side ? sideOf(event, side) : undefined;
    const legalBalls = balls.filter((b) => !['wide', 'no_ball'].includes(b.bowling_params?.extra_runs_type ?? '')).length;
    const runs = balls.reduce((sum, b) => sum + (b.batting_params?.runs_scored ?? 0), 0);

    return {
      number,
      battingTeam,
      total: period?.display_score ?? last?.display_score ?? `${runs}`,
      overs: String(period?.display_overs ?? last?.display_overs ?? ''),
      runRate: legalBalls ? (runs / legalBalls) * 6 : null,
      batters: [...batters.values()],
      bowlers: [...bowlers.values()],
      extras,
      fallOfWickets,
      progression: [...overRuns.values()].sort((a, b) => a.over - b.over),
    };
  });
}

export function oversFromBalls(legalBalls: number): string {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

export function strikeRate(runs: number, balls: number): string {
  return balls ? ((runs / balls) * 100).toFixed(1) : '—';
}

export function economy(runs: number, legalBalls: number): string {
  return legalBalls ? ((runs / legalBalls) * 6).toFixed(2) : '—';
}

export type DeliveryOutcome = { label: string; kind: 'wicket' | 'six' | 'four' | 'extra' | 'dot' | 'runs' };

export function deliveryOutcome(event: TimelineEvent): DeliveryOutcome {
  const total = event.batting_params?.runs_scored ?? 0;
  const extraType = event.bowling_params?.extra_runs_type;
  if (event.dismissal_params) return { label: 'W', kind: 'wicket' };
  if (event.type === 'six') return { label: '6', kind: 'six' };
  if (event.type === 'boundary') return { label: '4', kind: 'four' };
  if (extraType) {
    const short = { wide: 'wd', no_ball: 'nb', bye: 'b', leg_bye: 'lb', penalty: 'p' }[extraType] ?? 'x';
    return { label: `${total}${short}`, kind: 'extra' };
  }
  return total === 0 ? { label: '0', kind: 'dot' } : { label: String(total), kind: 'runs' };
}
