import {
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SportradarClient, type FetchLike } from './sportradar.client';

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('SportradarClient', () => {
  const originalKey = process.env.CRICKET_API_URL;

  beforeEach(() => {
    process.env.CRICKET_API_URL = 'test-key';
  });

  afterAll(() => {
    process.env.CRICKET_API_URL = originalKey;
  });

  it('sends the key as a header to the trial base URL and caches the result', async () => {
    const fetchMock = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(
      async () => reply(200, { ok: 1 }),
    );
    const client = new SportradarClient(fetchMock);

    await expect(client.get('tours.json', 60_000)).resolves.toEqual({ ok: 1 });
    await expect(client.get('tours.json', 60_000)).resolves.toEqual({ ok: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sportradar.com/cricket-t2/en/tours.json');
    expect(init?.headers?.['x-api-key']).toBe('test-key');
  });

  it('shares one upstream call between concurrent requests', async () => {
    const fetchMock = jest.fn(async () => reply(200, { n: 1 }));
    const client = new SportradarClient(fetchMock);

    await Promise.all([
      client.get('tournaments.json', 1000),
      client.get('tournaments.json', 1000),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves the last good payload when the upstream rate-limits', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(reply(200, { v: 'fresh' }))
      .mockResolvedValueOnce(reply(429));
    const client = new SportradarClient(fetchMock);

    await client.get('schedules/live/schedule.json', 0);
    await expect(
      client.get('schedules/live/schedule.json', 0),
    ).resolves.toEqual({ v: 'fresh' });
  });

  it('maps upstream failures to clear HTTP errors', async () => {
    const client = new SportradarClient(async () => reply(404));
    await expect(client.get('matches/x/summary.json', 0)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    process.env.CRICKET_API_URL = '';
    await expect(client.get('tours.json', 0)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
