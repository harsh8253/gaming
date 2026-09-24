import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { env } from '../env';

export const SPORTRADAR_FETCH = Symbol('SPORTRADAR_FETCH');

type CacheEntry = { value: unknown; expiresAt: number };

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const MIN_GAP_MS = 1100;
const STALE_GRACE_MS = 6 * 60 * 60 * 1000;

/**
 * Sportradar trial keys allow roughly one request per second and a small
 * monthly quota, so every upstream call is serialized, cached, and served
 * stale when the upstream refuses.
 */
@Injectable()
export class SportradarClient {
  private readonly logger = new Logger(SportradarClient.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private queue: Promise<void> = Promise.resolve();
  private lastCallAt = 0;

  private readonly fetchImpl: FetchLike;

  constructor(@Optional() @Inject(SPORTRADAR_FETCH) fetchImpl?: FetchLike) {
    this.fetchImpl = fetchImpl ?? (fetch as FetchLike);
  }

  private get apiKey(): string {
    return env('CRICKET_API_URL', '').trim();
  }

  private get baseUrl(): string {
    const level = env('CRICKET_ACCESS_LEVEL', 't') === 'p' ? 'p' : 't';
    return `https://api.sportradar.com/cricket-${level}2/en`;
  }

  async get<T>(path: string, ttlMs: number): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const pending = this.inFlight.get(path);
    if (pending) {
      return pending as Promise<T>;
    }

    const request = this.schedule(() => this.fetchUpstream(path))
      .then((value) => {
        this.cache.set(path, { value, expiresAt: Date.now() + ttlMs });
        return value;
      })
      .catch((error: unknown) => {
        if (
          cached &&
          cached.expiresAt + STALE_GRACE_MS > Date.now() &&
          !(error instanceof NotFoundException)
        ) {
          this.logger.warn(`Serving stale ${path}: ${String(error)}`);
          return cached.value;
        }
        throw error;
      })
      .finally(() => this.inFlight.delete(path));

    this.inFlight.set(path, request);
    return request as Promise<T>;
  }

  private schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastCallAt + MIN_GAP_MS - Date.now();
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      this.lastCallAt = Date.now();
      return task();
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async fetchUpstream(path: string): Promise<unknown> {
    const key = this.apiKey;
    if (!key) {
      throw new ServiceUnavailableException(
        'Cricket data feed is not configured. Set CRICKET_API_URL on the API server.',
      );
    }

    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/${path}`, {
        headers: { 'x-api-key': key, accept: 'application/json' },
      });
    } catch {
      throw new BadGatewayException('Cricket data feed could not be reached.');
    }

    if (response.ok) {
      return response.json();
    }
    if (response.status === 404) {
      throw new NotFoundException('No cricket data exists for this request.');
    }
    if (response.status === 429) {
      throw new ServiceUnavailableException(
        'Cricket data feed rate limit reached. Try again in a moment.',
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException(
        'Cricket data feed rejected the API key. Check CRICKET_API_URL and CRICKET_ACCESS_LEVEL.',
      );
    }
    throw new BadGatewayException(
      `Cricket data feed returned an error (${response.status}).`,
    );
  }
}
