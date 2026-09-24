import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '../../api/client';
import {
  ErrorState,
  FeedStamp,
  PageHeading,
  Panel,
  SkeletonRows,
  StatPair,
  TeamLink,
  TeamMark,
} from '../../components/cricketUi';
import { StatusBadge } from '../../components/deskUi';
import { age, formatDate, humanize, playerName } from '../../lib/cricket';

export function CricketPlayerPage() {
  const { id = '' } = useParams();
  const profile = useQuery({ queryKey: ['cricket', 'player', id], queryFn: () => cricketApi.playerProfile(id) });
  const player = profile.data?.player;
  const roles = [...(profile.data?.roles ?? [])].sort(
    (a, b) => Number(b.active) - Number(a.active) || (b.start_date ?? '').localeCompare(a.start_date ?? ''),
  );
  const years = age(player?.date_of_birth);

  return (
    <>
      <PageHeading
        title={player ? playerName(player.name) : profile.isPending ? 'Loading player…' : 'Player'}
        description={player ? [player.type && humanize(player.type), player.nationality].filter(Boolean).join(' · ') : undefined}
        trail={[{ label: 'Cricket', to: '/cricket' }, { label: 'Players' }, { label: player ? playerName(player.name) : 'Player' }]}
        actions={<FeedStamp generatedAt={profile.data?.generated_at} fetching={profile.isFetching} />}
      />

      {profile.isPending ? (
        <Panel><SkeletonRows rows={4} /></Panel>
      ) : profile.error || !player ? (
        <Panel><ErrorState error={profile.error} onRetry={() => void profile.refetch()} /></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel title="Profile">
            <dl className="grid grid-cols-2 gap-4 px-5 py-4">
              <div className="col-span-2"><StatPair label="Full name" value={playerName(player.name)} /></div>
              <StatPair label="Role" value={humanize(player.type)} />
              <StatPair label="Nationality" value={player.nationality ?? '—'} />
              <StatPair label="Born" value={formatDate(player.date_of_birth)} />
              <StatPair label="Age" value={years ?? '—'} />
              <StatPair label="Batting" value={humanize(player.batting_style?.replace(/_batsman$/, ''))} />
              <StatPair label="Bowling" value={humanize(player.bowling_style)} />
              <StatPair label="Gender" value={humanize(player.gender)} />
              <StatPair label="Country code" value={player.country_code ?? '—'} />
            </dl>
          </Panel>

          <Panel title="Teams and roles" aside={<span className="text-[11px] tabular-nums text-slate-400">{roles.length || profile.data?.teams?.length || 0} teams</span>}>
            {roles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      <th className="px-5 py-3 font-semibold">Team</th>
                      <th className="px-3 py-3 font-semibold">Role</th>
                      <th className="px-3 py-3 font-semibold">Since</th>
                      <th className="px-5 py-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, i) => (
                      <tr key={`${role.team.id}-${i}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                        <td className="px-5 py-2.5">
                          <span className="flex items-center gap-3">
                            <TeamMark team={role.team} size="sm" />
                            <TeamLink team={role.team} className="text-[12px] font-semibold text-slate-800" />
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-600">{humanize(role.type)}</td>
                        <td className="px-3 py-2.5 text-[11px] tabular-nums text-slate-500">
                          {role.start_date ? formatDate(role.start_date.slice(0, 10)) : '—'}
                          {role.end_date && ` – ${formatDate(role.end_date.slice(0, 10))}`}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <StatusBadge tone={role.active ? 'green' : 'slate'}>{role.active ? 'ACTIVE' : 'FORMER'}</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {(profile.data?.teams ?? []).map((team) => (
                  <li key={team.id} className="flex items-center gap-3 px-5 py-2.5">
                    <TeamMark team={team} size="sm" />
                    <TeamLink team={team} className="text-[12px] font-semibold text-slate-800" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
