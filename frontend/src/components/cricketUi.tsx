import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertTriangle, ChevronRight, RefreshCw, SearchX } from 'lucide-react';
import { StatusBadge } from './deskUi';
import { ApiError } from '../api/client';
import {
  eventStatus,
  formatKickoff,
  formatLabel,
  formatTime,
  inningsFor,
  sideOf,
  statusGroup,
  statusLabel,
  statusTone,
  teamCode,
} from '../lib/cricket';
import { teamLogo } from '../lib/teamLogos';
import type { EventWithStatus, Team } from '../types/cricket';

export function CricketSubnav() {
  const links = [
    { to: '/cricket', label: 'Live & fixtures', end: true },
    { to: '/cricket/tournaments', label: 'Tournaments', end: false },
  ];
  return (
    <nav aria-label="Cricket sections" className="mb-6 flex items-center gap-1 border-b border-slate-200">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-3 py-2.5 text-[12px] font-semibold transition-colors ${isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function PageHeading({
  title,
  description,
  trail,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  trail?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {trail && trail.length > 0 && (
          <ol className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
            {trail.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && <ChevronRight size={12} className="text-slate-300" />}
                {item.to ? (
                  <Link to={item.to} className="font-medium hover:text-blue-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-balance text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  aside,
  children,
  className = '',
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${className}`}>
      {(title || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {title && <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={`tabular-nums ${value === option.value ? 'text-blue-500' : 'text-slate-400'}`}>{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

const MARK_TONES = [
  'bg-blue-50 text-blue-700',
  'bg-violet-50 text-violet-700',
  'bg-amber-50 text-amber-800',
  'bg-teal-50 text-teal-700',
  'bg-rose-50 text-rose-700',
  'bg-slate-100 text-slate-700',
];

function toneFor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return MARK_TONES[hash % MARK_TONES.length];
}

const MARK_SIZES = {
  xs: 'h-5 w-7 text-[8px]',
  sm: 'h-6 w-9 text-[9px]',
  md: 'h-8 w-11 text-[10px]',
  lg: 'h-12 w-16 text-[13px]',
};

export function TeamMark({ team, size = 'md' }: { team?: Team; size?: keyof typeof MARK_SIZES }) {
  const logo = teamLogo(team);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (logo && failedSrc !== logo.src) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md ${MARK_SIZES[size]} ${logo.kind === 'flag' ? 'ring-1 ring-slate-200' : 'bg-white p-0.5 ring-1 ring-slate-100'}`}
      >
        <img
          src={logo.src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(logo.src)}
          className={logo.kind === 'flag' ? 'size-full object-cover' : 'size-full object-contain'}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-md font-bold tracking-[0.04em] ${MARK_SIZES[size]} ${team ? toneFor(team.id) : 'bg-slate-100 text-slate-400'}`}
    >
      {teamCode(team)}
    </span>
  );
}

/** Desk records name teams as plain strings; this gives them the same badge as feed teams. */
function namedTeam(name: string): Team {
  return { id: name, name };
}

/** A fixture label with team badges: stacked rows for tables, or a compact inline pair. */
export function Matchup({
  home,
  away,
  layout = 'stacked',
  className = '',
}: {
  home: string;
  away: string;
  layout?: 'stacked' | 'inline';
  className?: string;
}) {
  if (layout === 'inline') {
    return (
      <span className={`flex min-w-0 items-center gap-2 ${className}`}>
        <span className="flex shrink-0 items-center -space-x-1.5">
          <TeamMark team={namedTeam(home)} size="xs" />
          <TeamMark team={namedTeam(away)} size="xs" />
        </span>
        <span className="min-w-0">
          {home} <span className="font-normal text-slate-400">vs</span> {away}
        </span>
      </span>
    );
  }
  return (
    <span className={`flex flex-col gap-1.5 ${className}`}>
      {[home, away].map((name) => (
        <span key={name} className="flex min-w-0 items-center gap-2">
          <TeamMark team={namedTeam(name)} size="xs" />
          <span className="min-w-0 truncate">{name}</span>
        </span>
      ))}
    </span>
  );
}

/** An inline Matchup for a "Home vs Away" string; anything else renders as plain text. */
export function FixtureLabel({ match, className = '' }: { match: string; className?: string }) {
  const teams = match.split(/\s+(?:vs?\.?)\s+/i);
  if (teams.length !== 2 || !teams[0] || !teams[1]) return <p className={className}>{match}</p>;
  return <Matchup home={teams[0]} away={teams[1]} layout="inline" className={className} />;
}

export function TeamLink({ team, className = '' }: { team?: Team; className?: string }) {
  if (!team) return <span className={className}>TBC</span>;
  if (team.virtual) return <span className={className}>{team.name}</span>;
  return (
    <Link to={`/cricket/teams/${team.id}`} className={`hover:text-blue-700 hover:underline hover:underline-offset-2 ${className}`}>
      {team.name}
    </Link>
  );
}

export function MatchStatusBadge({ status }: { status?: string }) {
  return <StatusBadge tone={statusTone(status)}>{statusLabel(status)}</StatusBadge>;
}

export function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
    </span>
  );
}

function TeamScoreLine({ item, side }: { item: EventWithStatus; side: 'home' | 'away' }) {
  const team = sideOf(item.sport_event, side);
  const innings = inningsFor(item.sport_event_status, side);
  const won = item.sport_event_status?.winner_id && team?.id === item.sport_event_status.winner_id;
  return (
    <div className="flex items-center gap-3">
      <TeamMark team={team} size="sm" />
      <span className={`min-w-0 flex-1 truncate text-[12px] ${won ? 'font-semibold text-slate-950' : 'font-medium text-slate-700'}`}>
        {team?.name ?? 'TBC'}
      </span>
      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
        {innings.map((inn) => (
          <span key={inn.number} className="flex items-baseline gap-1">
            <span className={`text-[12px] ${won ? 'font-semibold text-slate-950' : 'font-medium text-slate-700'}`}>{inn.score}</span>
            {inn.overs !== undefined && <span className="text-[10px] text-slate-400">{inn.overs}</span>}
          </span>
        ))}
      </span>
    </div>
  );
}

export function MatchRow({ item, showTournament = false }: { item: EventWithStatus; showTournament?: boolean }) {
  const event = item.sport_event;
  const status = eventStatus(item);
  const group = statusGroup(status);
  const result = item.sport_event_status?.match_result_text;
  const round = event.tournament_round;
  const meta = [
    showTournament ? event.tournament?.name ?? event.season?.name : null,
    formatLabel(event.tournament?.type ?? event.sport_event_conditions?.type),
    round?.competition_sport_event_number ? `Match ${round.competition_sport_event_number}` : round?.name,
  ].filter((part) => part && part !== '—');

  return (
    <Link
      to={`/cricket/matches/${event.id}`}
      className="group grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
    >
      <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1.5">
        <MatchStatusBadge status={status} />
        <span className="text-[11px] tabular-nums text-slate-500">
          {group === 'upcoming' ? formatKickoff(event) : formatTime(event.scheduled)}
        </span>
      </div>
      <div className="min-w-0 space-y-1.5">
        <TeamScoreLine item={item} side="home" />
        <TeamScoreLine item={item} side="away" />
        {(result || meta.length > 0) && (
          <p className="truncate pt-0.5 text-[11px] text-slate-500">
            {result && <span className="font-semibold text-slate-700">{result}</span>}
            {result && meta.length > 0 && ' · '}
            {meta.join(' · ')}
          </p>
        )}
      </div>
      <ChevronRight size={15} className="hidden text-slate-300 transition-colors group-hover:text-blue-600 sm:block" />
    </Link>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong loading cricket data.';
  const notFound = error instanceof ApiError && error.status === 404;
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className={`flex size-10 items-center justify-center rounded-full ${notFound ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600'}`}>
        {notFound ? <SearchX size={18} /> : <AlertTriangle size={18} />}
      </span>
      <div>
        <p className="text-[13px] font-semibold text-slate-800">{notFound ? 'Nothing published yet' : 'Cricket data could not load'}</p>
        <p className="mt-1 max-w-md text-[12px] text-slate-500">{message}</p>
      </div>
      {onRetry && !notFound && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-800">
          <RefreshCw size={13} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX size={18} />
      </span>
      <div>
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        {body && <p className="mt-1 max-w-md text-[12px] text-slate-500">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function FeedStamp({ generatedAt, fetching }: { generatedAt?: string; fetching?: boolean }) {
  if (!generatedAt) return null;
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
      <RefreshCw size={11} className={fetching ? 'animate-spin motion-reduce:animate-none' : ''} />
      Sportradar · updated {formatTime(generatedAt)}
    </span>
  );
}

export function StatPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100';
