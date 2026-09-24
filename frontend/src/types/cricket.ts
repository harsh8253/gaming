export type SrRef = { id: string; name: string };

export type Category = SrRef & { country_code?: string };

export type Season = SrRef & {
  start_date?: string;
  end_date?: string;
  year?: string;
  tournament_id?: string;
};

export type Tournament = SrRef & {
  type?: string;
  gender?: string;
  category?: Category;
  current_season?: Season;
};

export type Team = SrRef & {
  abbreviation?: string;
  country?: string;
  country_code?: string;
  gender?: string;
  qualifier?: 'home' | 'away';
  virtual?: boolean;
};

export type Venue = SrRef & {
  capacity?: number;
  city_name?: string;
  country_name?: string;
  timezone?: string;
};

export type Official = SrRef & { type?: string; nationality?: string };

export type SportEventConditions = {
  type?: string;
  day_night?: string;
  neutral_venue?: boolean;
  weather_info?: Record<string, string>;
  pitch_info?: Record<string, string>;
  outfield_info?: Record<string, string>;
  referees?: { referee?: Official; umpires?: Official[] };
  comment?: { text?: string };
};

export type SportEvent = {
  id: string;
  scheduled?: string;
  start_time_tbd?: boolean;
  status?: string;
  tournament_round?: { type?: string; number?: number; name?: string; competition_sport_event_number?: number };
  season?: Season;
  tournament?: Tournament;
  competitors: Team[];
  venue?: Venue;
  sport_event_conditions?: SportEventConditions;
};

export type PeriodScore = {
  number: number;
  type?: string;
  home_score?: number;
  away_score?: number;
  home_wickets?: number;
  away_wickets?: number;
  display_score?: string;
  display_overs?: number;
  allotted_overs?: number;
};

export type SportEventStatus = {
  status?: string;
  match_status?: string;
  display_score?: string;
  display_overs?: number;
  allotted_overs?: number;
  current_inning?: number;
  winner_id?: string;
  toss_won_by?: string;
  toss_decision?: string;
  match_result_text?: string;
  required_run_rate?: number;
  period_scores?: PeriodScore[];
};

export type EventWithStatus = { sport_event: SportEvent; sport_event_status?: SportEventStatus };

export type ScheduleResponse = { generated_at: string; sport_events?: SportEvent[] };
export type ResultsResponse = { generated_at: string; results?: EventWithStatus[] };
export type TournamentsResponse = { generated_at: string; tournaments?: Tournament[] };
export type ToursResponse = { generated_at: string; tours?: Tournament[] };

export type TournamentInfoResponse = {
  generated_at?: string;
  tournament: Tournament;
  season?: Season;
  groups?: { name?: string; teams?: Team[] }[];
};

export type SeasonsResponse = { tournament: Tournament; seasons?: Season[] };

export type TeamStanding = {
  rank: number;
  played?: number;
  win?: number;
  loss?: number;
  draw?: number;
  no_result?: number;
  points?: number;
  net_run_rate?: number;
  runs_for?: number;
  runs_against?: number;
  overs_for?: number;
  overs_against?: number;
  change?: number;
  team: Team;
};

export type StandingsResponse = {
  tournament: Tournament;
  standings?: { type?: string; groups?: { id?: string; name?: string; team_standings?: TeamStanding[] }[] }[];
};

export type Leader = {
  rank: number;
  total?: number;
  average?: number;
  rate?: number;
  player: SrRef;
  team?: Team;
};

export type LeadersResponse = {
  tournament: Tournament;
  batting?: Record<string, Leader[]>;
  bowling?: Record<string, Leader[]>;
  fielding?: Record<string, Leader[]>;
};

export type Player = SrRef & {
  date_of_birth?: string;
  country_code?: string;
  nationality?: string;
  gender?: string;
  type?: string;
  batting_style?: string;
  bowling_style?: string;
  captain?: boolean;
};

export type SquadResponse = { team: Team; manager?: Player; players?: Player[] };

export type LineupsResponse = {
  sport_event: SportEvent;
  lineups?: { team: 'home' | 'away'; starting_lineup?: Player[] }[];
};

export type PartnershipPlayer = {
  id: string;
  order?: number;
  runs?: number;
  balls_faced?: number;
  fours?: number;
  sixes?: number;
  strike_rate?: number;
};

export type Partnership = {
  wicket_number: number;
  runs?: number;
  balls_faced?: number;
  runs_extras?: number;
  minutes_at_crease?: number;
  dismissed_player?: string;
  players?: PartnershipPlayer[];
};

export type InningStatistics = {
  number: number;
  batting_team?: string;
  bowling_team?: string;
  overs_completed?: number;
  teams?: {
    id: string;
    name: string;
    abbreviation?: string;
    statistics?: {
      batting?: { partnerships?: Partnership[] };
      bowling?: { partnerships?: Partnership[] };
    };
  }[];
};

export type MatchSummaryResponse = {
  generated_at?: string;
  sport_event: SportEvent;
  sport_event_status?: SportEventStatus;
  coverage?: { sport_event_properties?: { level?: string } };
  match_notes?: { text?: string }[];
  statistics?: { innings?: InningStatistics[] };
};

type PlayerRef = SrRef & { country_code?: string };

export type TimelineEvent = {
  id: number;
  type: string;
  time?: string;
  period_name?: string;
  inning?: number;
  over_number?: number;
  ball_number?: number;
  display_overs?: string;
  display_score?: string;
  commentary?: { text?: string };
  batting_params?: {
    striker?: PlayerRef;
    non_striker?: PlayerRef;
    runs_scored?: number;
    hit_to_boundary?: boolean;
    shot_type?: string;
  };
  bowling_params?: {
    bowler?: PlayerRef;
    extra_runs_conceded?: number;
    extra_runs_type?: string;
    delivery_type?: string;
  };
  dismissal_params?: {
    player?: PlayerRef;
    dismissal_details?: { type?: string; bowler_id?: string; fielder_id?: string; fielders?: { id: string }[] };
  };
};

export type MatchTimelineResponse = MatchSummaryResponse & { timeline?: TimelineEvent[] };

export type TeamProfileResponse = {
  team: Team & { category?: Category };
  manager?: Player;
  venue?: Venue;
  players?: Player[];
};

export type TeamScheduleResponse = { team: Team; schedule?: SportEvent[] };
export type TeamResultsResponse = { generated_at?: string; team: Team; results?: EventWithStatus[] };

export type VersusResponse = {
  competitors: Team[];
  last_meetings?: EventWithStatus[];
  next_meetings?: EventWithStatus[];
};

export type PlayerProfileResponse = {
  generated_at?: string;
  player: Player;
  teams?: Team[];
  roles?: { type?: string; active?: boolean; team: Team; start_date?: string; end_date?: string }[];
};
