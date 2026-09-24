import {
  BadRequestException,
  Controller,
  Get,
  Param,
  type PipeTransform,
} from '@nestjs/common';
import { SportradarClient } from './sportradar.client';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const TTL = {
  live: MINUTE,
  daily: 5 * MINUTE,
  match: MINUTE,
  catalog: 12 * HOUR,
  tournament: 30 * MINUTE,
  profile: 6 * HOUR,
} as const;

class SportradarIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^sr:[a-z_]+:\d+$/.test(value)) {
      throw new BadRequestException(`"${value}" is not a valid Sportradar id.`);
    }
    return value;
  }
}

class IsoDatePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw new BadRequestException('Date must use the YYYY-MM-DD format.');
    }
    return value;
  }
}

const id = new SportradarIdPipe();
const date = new IsoDatePipe();

@Controller('cricket')
export class CricketController {
  constructor(private readonly sportradar: SportradarClient) {}

  @Get('live')
  liveSchedule() {
    return this.sportradar.get('schedules/live/schedule.json', TTL.live);
  }

  @Get('daily/:date/schedule')
  dailySchedule(@Param('date', date) day: string) {
    return this.sportradar.get(`schedules/${day}/schedule.json`, TTL.daily);
  }

  @Get('daily/:date/results')
  dailyResults(@Param('date', date) day: string) {
    return this.sportradar.get(`schedules/${day}/results.json`, TTL.daily);
  }

  @Get('tournaments')
  tournaments() {
    return this.sportradar.get('tournaments.json', TTL.catalog);
  }

  @Get('tours')
  tours() {
    return this.sportradar.get('tours.json', TTL.catalog);
  }

  @Get('tournaments/:id/seasons')
  tournamentSeasons(@Param('id', id) tournamentId: string) {
    return this.sportradar.get(
      `tournaments/${tournamentId}/seasons.json`,
      TTL.catalog,
    );
  }

  @Get('tournaments/:id/:feed')
  tournamentFeed(
    @Param('id', id) tournamentId: string,
    @Param('feed') feed: string,
  ) {
    const feeds = ['info', 'schedule', 'results', 'standings', 'leaders'];
    if (!feeds.includes(feed)) {
      throw new BadRequestException(`Unknown tournament feed "${feed}".`);
    }
    return this.sportradar.get(
      `tournaments/${tournamentId}/${feed}.json`,
      TTL.tournament,
    );
  }

  @Get('tournaments/:id/teams/:teamId/squads')
  tournamentSquad(
    @Param('id', id) tournamentId: string,
    @Param('teamId', id) teamId: string,
  ) {
    return this.sportradar.get(
      `tournaments/${tournamentId}/teams/${teamId}/squads.json`,
      TTL.tournament,
    );
  }

  @Get('matches/:id/:feed')
  matchFeed(@Param('id', id) matchId: string, @Param('feed') feed: string) {
    const feeds = ['summary', 'lineups', 'timeline'];
    if (!feeds.includes(feed)) {
      throw new BadRequestException(`Unknown match feed "${feed}".`);
    }
    return this.sportradar.get(`matches/${matchId}/${feed}.json`, TTL.match);
  }

  @Get('teams/:id/versus/:otherId')
  teamVersus(
    @Param('id', id) teamId: string,
    @Param('otherId', id) otherId: string,
  ) {
    return this.sportradar.get(
      `teams/${teamId}/versus/${otherId}/matches.json`,
      TTL.tournament,
    );
  }

  @Get('teams/:id/:feed')
  teamFeed(@Param('id', id) teamId: string, @Param('feed') feed: string) {
    const feeds = ['profile', 'schedule', 'results'];
    if (!feeds.includes(feed)) {
      throw new BadRequestException(`Unknown team feed "${feed}".`);
    }
    return this.sportradar.get(
      `teams/${teamId}/${feed}.json`,
      feed === 'profile' ? TTL.profile : TTL.tournament,
    );
  }

  @Get('players/:id/profile')
  playerProfile(@Param('id', id) playerId: string) {
    return this.sportradar.get(`players/${playerId}/profile.json`, TTL.profile);
  }
}
