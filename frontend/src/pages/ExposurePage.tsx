import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Target, TrendingUp } from 'lucide-react';
import { Matchup } from '../components/cricketUi';
import { ClientAvatar, ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable } from '../components/deskUi';
import { formatINR, MOCK_CLIENTS, MOCK_MATCHES, FORMATS } from '../lib/mockDesk';

export function ExposurePage() {
  const navigate = useNavigate();

  const totalExposure = MOCK_CLIENTS.reduce((sum, c) => sum + c.exposure, 0);
  const totalLimit = MOCK_CLIENTS.reduce((sum, c) => sum + c.limit, 0);

  const byFormat = FORMATS.map((format) => {
    const matches = MOCK_MATCHES.filter((m) => m.format === format && m.exposure > 0);
    const exposure = matches.reduce((sum, m) => sum + m.exposure, 0);
    return { format, exposure };
  })
    .filter((row) => row.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure);
  const maxFormatExposure = Math.max(...byFormat.map((r) => r.exposure), 1);

  const topClients = [...MOCK_CLIENTS]
    .filter((c) => c.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 8);
  const overThreshold = MOCK_CLIENTS.filter((c) => c.exposure / c.limit >= 0.8);

  const exposedMatches = MOCK_MATCHES.filter((m) => m.exposure > 0).sort((a, b) => b.exposure - a.exposure);
  const highestClient = topClients[0];

  return (
    <>
      <PageHeader title="Exposure" description="Live liability across clients, formats, and matches." />

      <MetricStrip>
        <MetricCard label="Total exposure" value={formatINR(totalExposure)} icon={ShieldAlert} accent="amber" sub="Across all clients" />
        <MetricCard
          label="Highest client"
          value={highestClient ? formatINR(highestClient.exposure) : '—'}
          icon={TrendingUp}
          accent="blue"
          sub={highestClient?.name ?? 'No exposure yet'}
        />
        <MetricCard label="Over 80% of limit" value={String(overThreshold.length)} icon={AlertTriangle} accent="red" sub="Clients to review" />
        <MetricCard label="Limit headroom" value={formatINR(totalLimit - totalExposure)} icon={Target} accent="green" sub="Remaining across hierarchy" />
      </MetricStrip>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-[14px] font-semibold text-foreground">Top exposed clients</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Sorted by current exposure</p>
          </div>
          <MobileList label="Top exposed clients">
            {topClients.map((client) => {
              const pct = Math.round((client.exposure / client.limit) * 100);
              return (
                <ListRow
                  key={client.id}
                  onClick={() => navigate(`/clients?focus=${client.id}`)}
                  leading={<ClientAvatar initials={client.initials} tone={client.tone} size={9} />}
                  title={client.name}
                  subtitle={`Limit ${formatINR(client.limit)}`}
                  meta={
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${pct >= 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </span>
                  }
                  trailing={<span className="text-amber-700">{formatINR(client.exposure)}</span>}
                  trailingSub={
                    <span className={`text-[12px] font-semibold tabular-nums ${pct >= 80 ? 'text-red-700' : 'text-slate-500'}`}>
                      {pct}% used
                    </span>
                  }
                />
              );
            })}
          </MobileList>
          <div className="hidden overflow-x-auto md:block">
            <StackTable className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 text-right font-semibold">Exposure</th>
                  <th className="px-3 py-3 text-right font-semibold">Limit</th>
                  <th className="px-5 py-3 text-right font-semibold">Utilized</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client) => {
                  const pct = Math.round((client.exposure / client.limit) * 100);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/clients?focus=${client.id}`)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <ClientAvatar initials={client.initials} tone={client.tone} />
                          <p className="text-[12px] font-semibold text-slate-800">{client.name}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                        {formatINR(client.exposure)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-600">
                        {formatINR(client.limit)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${pct >= 80 ? 'text-red-700' : 'text-slate-600'}`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </StackTable>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-[14px] font-semibold text-foreground">Exposure by format</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Live and upcoming fixtures</p>
          </div>
          <div className="space-y-4 p-5">
            {byFormat.map((row) => (
              <div key={row.format}>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{row.format}</span>
                  <span className="font-medium tabular-nums text-slate-500">{formatINR(row.exposure)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max((row.exposure / maxFormatExposure) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-[14px] font-semibold text-foreground">Exposure by match</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Fixtures currently carrying liability</p>
        </div>
        <MobileList label="Exposure by match">
          {exposedMatches.map((match) => (
            <ListRow
              key={match.id}
              onClick={() => navigate(`/matches?focus=${match.id}`)}
              title={<Matchup home={match.home} away={match.away} layout="inline" />}
              subtitle={`${match.competition} · ${match.format}`}
              trailing={<span className="text-amber-700">{formatINR(match.exposure)}</span>}
            />
          ))}
        </MobileList>
        <div className="hidden overflow-x-auto md:block">
          <StackTable className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Match</th>
                <th className="px-3 py-3 font-semibold">Format</th>
                <th className="px-5 py-3 text-right font-semibold">Exposure</th>
              </tr>
            </thead>
            <tbody>
              {exposedMatches.map((match) => (
                <tr
                  key={match.id}
                  onClick={() => navigate(`/matches?focus=${match.id}`)}
                  className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">
                    <Matchup home={match.home} away={match.away} layout="inline" />
                  </td>
                  <td className="px-3 py-3.5 text-[12px] text-slate-600">{match.format}</td>
                  <td className="px-5 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                    {formatINR(match.exposure)}
                  </td>
                </tr>
              ))}
            </tbody>
          </StackTable>
        </div>
      </section>
    </>
  );
}
