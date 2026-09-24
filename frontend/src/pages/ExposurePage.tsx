import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Target, TrendingUp } from 'lucide-react';
import { ClientAvatar, MetricCard, StackTable } from '../components/deskUi';
import { formatINR, MOCK_CLIENTS, MOCK_MATCHES, SPORTS } from '../lib/mockDesk';

export function ExposurePage() {
  const navigate = useNavigate();

  const totalExposure = MOCK_CLIENTS.reduce((sum, c) => sum + c.exposure, 0);
  const totalLimit = MOCK_CLIENTS.reduce((sum, c) => sum + c.limit, 0);

  const bySport = SPORTS.map((sport) => {
    const matches = MOCK_MATCHES.filter((m) => m.sport === sport && m.exposure > 0);
    const exposure = matches.reduce((sum, m) => sum + m.exposure, 0);
    return { sport, exposure };
  })
    .filter((row) => row.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure);
  const maxSportExposure = Math.max(...bySport.map((r) => r.exposure), 1);

  const topClients = [...MOCK_CLIENTS]
    .filter((c) => c.exposure > 0)
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 8);
  const overThreshold = MOCK_CLIENTS.filter((c) => c.exposure / c.limit >= 0.8);

  const exposedMatches = MOCK_MATCHES.filter((m) => m.exposure > 0).sort((a, b) => b.exposure - a.exposure);
  const highestClient = topClients[0];

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 hidden items-center gap-2 sm:flex">
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
            Super Admin A
          </span>
          <span className="text-[11px] text-slate-400">/</span>
          <span className="text-[11px] font-medium text-slate-500">Master network</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Exposure</h2>
        <p className="mt-1 text-[13px] text-slate-500">Live liability across clients, sports, and matches.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-slate-950">Top exposed clients</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Sorted by current exposure</p>
          </div>
          <div className="overflow-x-auto">
            <StackTable className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
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

        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-slate-950">Exposure by sport</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Live and upcoming fixtures</p>
          </div>
          <div className="space-y-4 p-5">
            {bySport.map((row) => (
              <div key={row.sport}>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{row.sport}</span>
                  <span className="font-medium tabular-nums text-slate-500">{formatINR(row.exposure)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max((row.exposure / maxSportExposure) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-[14px] font-semibold text-slate-950">Exposure by match</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Fixtures currently carrying liability</p>
        </div>
        <div className="overflow-x-auto">
          <StackTable className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                <th className="px-5 py-3 font-semibold">Match</th>
                <th className="px-3 py-3 font-semibold">Sport</th>
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
                    {match.home} vs {match.away}
                  </td>
                  <td className="px-3 py-3.5 text-[12px] text-slate-600">{match.sport}</td>
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
