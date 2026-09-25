import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Command,
  Filter,
  LifeBuoy,
  PlusCircle,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { FixtureLabel } from '../components/cricketUi';
import { MarketWatchSection } from '../components/MarketWatch';
import { ClientAvatar, ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable, StatusBadge } from '../components/deskUi';
import { betStatusTone, formatINR, MOCK_BETS, MOCK_CLIENTS } from '../lib/mockDesk';

const attentionItems = [
  { icon: AlertTriangle, title: 'Exposure threshold reached', text: 'Arjun Mehta · India vs Australia', figure: '₹ 2,50,000', tag: 'LIMIT', tone: 'red' as const, to: '/exposure' },
  { icon: ClipboardCheck, title: 'Settlement pending approval', text: 'STL-019 · 14 bets', figure: '₹ 46,500', tag: 'APPROVE', tone: 'amber' as const, to: '/settlements?focus=STL-019' },
  { icon: WalletCards, title: 'Cash difference detected', text: 'Session CSH-104 · A. Rao', figure: '− ₹ 12,500', tag: 'CASH', tone: 'red' as const, to: '/cash?focus=CSH-104' },
  { icon: ShieldCheck, title: 'Limit approaching', text: 'Rahul Verma · CLI-1042', figure: '82%', tag: 'LIMIT', tone: 'amber' as const, to: '/clients?focus=CLI-1042' },
];

const asOf = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date());

export function DashboardPage() {
  const navigate = useNavigate();
  const previewClients = MOCK_CLIENTS.slice(0, 4);
  const activeCount = MOCK_CLIENTS.filter((c) => c.status === 'ACTIVE').length;

  return (
    <>
      <PageHeader
        title="Positions"
        description={`Today · as of ${asOf}`}
        action={{ label: 'Place bet', icon: PlusCircle, onClick: () => navigate('/bets?ticket=1') }}
      />

      <MetricStrip className="md:grid-cols-4 2xl:grid-cols-8">
        <MetricCard label="Current exposure" value="₹ 4.2L" sub="24.1% of position" />
        <MetricCard label="Account position" value="₹ 17.4L" sub="Ledger balance" />
        <MetricCard label="Open bets" value="86" change="+12" sub="₹ 4,82,500 staked" />
        <MetricCard label="Active clients" value={String(activeCount)} change="+2" sub={`Across ${new Set(MOCK_CLIENTS.map((c) => c.master)).size} masters`} />
        <MetricCard label="Physical cash" value="₹ 6.8L" sub="Counted today" />
        <MetricCard label="Expected cash" value="₹ 6.9L" change="−₹ 12,500" sub="vs physical count" />
        <MetricCard label="Settlements" value="3" sub="Awaiting approval" />
        <MetricCard label="Commission" value="₹ 82,450" change="+8.4%" sub="This month" />
      </MetricStrip>

      <MarketWatchSection onOpen={(id) => navigate(`/matches?focus=${id}`)} />

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">Active clients</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Clients under your operational hierarchy
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/clients')}
                className="hidden h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 sm:flex"
              >
                <Filter size={13} /> Filters
              </button>
              <button
                onClick={() => navigate('/clients')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                View all
              </button>
            </div>
          </div>
          <MobileList label="Active clients">
            {previewClients.map((client) => (
              <ListRow
                key={client.id}
                onClick={() => navigate(`/clients?focus=${client.id}`)}
                leading={<ClientAvatar initials={client.initials} tone={client.tone} size={9} />}
                title={client.name}
                subtitle={`${client.bets} open bets · ${client.activity}`}
                trailing={formatINR(client.position)}
                trailingSub={
                  client.exposure ? (
                    <span className="text-[12px] font-medium tabular-nums text-amber-700">{formatINR(client.exposure)} exp.</span>
                  ) : (
                    <StatusBadge tone={client.status === 'SUSPENDED' ? 'red' : 'green'}>{client.status}</StatusBadge>
                  )
                }
              />
            ))}
          </MobileList>
          <div className="hidden overflow-x-auto md:block">
            <StackTable className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Account position</th>
                  <th className="px-3 py-3 text-right font-semibold">Exposure</th>
                  <th className="px-3 py-3 text-right font-semibold">Open bets</th>
                  <th className="px-3 py-3 text-right font-semibold">Cash</th>
                  <th className="px-5 py-3 text-right font-semibold">Activity</th>
                </tr>
              </thead>
              <tbody>
                {previewClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients?focus=${client.id}`)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ClientAvatar initials={client.initials} tone={client.tone} />
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">{client.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{client.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={client.status === 'SUSPENDED' ? 'red' : 'green'}>
                        {client.status}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-semibold tabular-nums text-slate-800">
                      {formatINR(client.position)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                      {client.exposure ? formatINR(client.exposure) : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {client.bets}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-600">
                      {formatINR(client.cash)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">{client.activity}</td>
                  </tr>
                ))}
              </tbody>
            </StackTable>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-[11px] text-muted-foreground">
              Showing {previewClients.length} of {MOCK_CLIENTS.length} clients
            </span>
            <button onClick={() => navigate('/clients')} className="text-[11px] font-semibold text-blue-600">
              Manage clients <ArrowRight size={14} className="inline" />
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card max-2xl:order-first desk-panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">Attention required</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Items needing a review</p>
            </div>
            <StatusBadge tone="red">{attentionItems.length} open</StatusBadge>
          </div>
          <ul className="divide-y divide-border">
            {attentionItems.map((item) => (
              <li key={item.title}>
                <button onClick={() => navigate(item.to)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-accent/60 active:bg-accent">
                  <item.icon size={17} strokeWidth={1.9} className={item.tone === 'red' ? 'shrink-0 text-loss' : 'shrink-0 text-amber-700'} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-foreground">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{item.text}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`text-[14px] font-semibold tabular-nums ${item.tone === 'red' ? 'text-loss' : 'text-foreground'}`}>{item.figure}</span>
                    <StatusBadge tone={item.tone}>{item.tag}</StatusBadge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/audit')} className="flex w-full items-center gap-1.5 border-t border-border px-5 py-3 text-left text-[13px] font-medium text-blue-700 hover:bg-accent/60">
            View audit activity <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">Recent betting activity</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Latest activity across your clients</p>
            </div>
            <button onClick={() => navigate('/bets')} className="text-[11px] font-semibold text-blue-600">
              View all bets <ArrowRight size={14} className="inline" />
            </button>
          </div>
          <MobileList label="Recent betting activity">
            {MOCK_BETS.slice(0, 4).map((bet) => (
              <ListRow
                key={bet.id}
                onClick={() => navigate(`/bets?focus=${bet.id}`)}
                title={<FixtureLabel match={bet.match} />}
                subtitle={`${bet.client} · ${bet.market}`}
                trailing={formatINR(bet.stake)}
                trailingSub={<StatusBadge tone={betStatusTone(bet.status)}>{bet.status.replace('_', ' ')}</StatusBadge>}
              />
            ))}
          </MobileList>
          <div className="hidden overflow-x-auto md:block">
            <StackTable className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Bet ID / Client</th>
                  <th className="px-3 py-3 font-semibold">Match / Market</th>
                  <th className="px-3 py-3 text-right font-semibold">Stake</th>
                  <th className="px-3 py-3 text-right font-semibold">Exposure</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_BETS.slice(0, 4).map((bet) => (
                  <tr
                    key={bet.id}
                    onClick={() => navigate(`/bets?focus=${bet.id}`)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-[12px] font-medium text-blue-700">{bet.id}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{bet.client}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[12px] font-medium text-slate-800">{bet.match}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{bet.market}</p>
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                      {formatINR(bet.stake)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-amber-700">
                      {formatINR(bet.exposure)}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={betStatusTone(bet.status)}>{bet.status.replace('_', ' ')}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[11px] text-muted-foreground">{bet.placedAt}</td>
                  </tr>
                ))}
              </tbody>
            </StackTable>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-[14px] font-semibold text-foreground">Cash reconciliation</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Session <span className="font-mono">CSH-104</span> · Today</p>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {(
                [
                  ['Opening cash', '₹ 5,80,000', false],
                  ['Cash received', '+ ₹ 2,15,000', false],
                  ['Cash paid', '− ₹ 1,08,500', false],
                  ['Expected closing cash', '₹ 6,86,500', true],
                  ['Physical count', '₹ 6,74,000', true],
                ] as const
              ).map(([label, value, strong]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between ${strong ? 'border-t border-slate-100 pt-4' : ''}`}
                >
                  <span className={`text-[11px] ${strong ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <span className={`text-[12px] tabular-nums ${strong ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
                <span className="text-[11px] font-semibold text-red-700">Reconciliation difference</span>
                <span className="text-[12px] font-bold tabular-nums text-red-700">− ₹ 12,500</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/cash?focus=CSH-104')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open cash session <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
      <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" /> All financial activity is immutable and audit logged
        </span>
        <span className="flex items-center gap-4">
          <span>WagerDesk v2.4.0</span>
          <span className="flex items-center gap-1">
            <Command size={11} /> Shortcuts
          </span>
          <span className="flex items-center gap-1">
            <LifeBuoy size={11} /> Support
          </span>
        </span>
      </footer>
    </>
  );
}
