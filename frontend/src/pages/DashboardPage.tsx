import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ChevronDown,
  Command,
  FileText,
  Filter,
  LifeBuoy,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { ClientAvatar, MetricCard, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import { betStatusTone, formatINR, MOCK_BETS, MOCK_CLIENTS } from '../lib/mockDesk';

const attentionItems = [
  {
    icon: AlertTriangle,
    title: 'Exposure threshold reached',
    text: 'Arjun Mehta · India vs Australia',
    tone: 'amber' as const,
  },
  {
    icon: ClipboardCheck,
    title: 'Settlement pending approval',
    text: 'SETTLEMENT-019 · 14 bets',
    tone: 'blue' as const,
  },
  {
    icon: WalletCards,
    title: 'Cash difference detected',
    text: '₹ 12,500 · Session #104',
    tone: 'red' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Limit approaching',
    text: 'Rahul Verma · 82% utilized',
    tone: 'violet' as const,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { setNotice } = useOutletContext<ShellContext>();
  const previewClients = MOCK_CLIENTS.slice(0, 4);
  const activeCount = MOCK_CLIENTS.filter((c) => c.status === 'ACTIVE').length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
              Super Admin A
            </span>
            <span className="text-[11px] text-slate-400">/</span>
            <span className="text-[11px] font-medium text-slate-500">Master network</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Good morning, Admin
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotice('Date range selector opened.')}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Clock3 size={14} /> Today <ChevronDown size={13} />
          </button>
          <button
            onClick={() => setNotice('Create Bet workflow is ready to configure.')}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-900"
          >
            <span className="text-base leading-none">+</span> Create bet
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <MetricCard
          label="Active clients"
          value={String(activeCount)}
          change="+2"
          icon={Users}
          accent="blue"
          sub={`Across ${new Set(MOCK_CLIENTS.map((c) => c.master)).size} masters`}
        />
        <MetricCard label="Open bets" value="86" change="+12" icon={ClipboardCheck} accent="violet" sub="₹ 4,82,500 staked" />
        <MetricCard label="Account position" value="₹ 17.4L" icon={ArrowUpRight} accent="green" sub="Ledger balance" />
        <MetricCard label="Current exposure" value="₹ 4.2L" icon={BarChart3} accent="amber" sub="24.1% of position" />
        <MetricCard label="Physical cash" value="₹ 6.8L" icon={WalletCards} accent="teal" sub="Counted today" />
        <MetricCard label="Expected cash" value="₹ 6.9L" icon={FileText} accent="slate" sub="Difference ₹ 12,500" />
        <MetricCard label="Settlements" value="3" icon={ArrowDownLeft} accent="amber" sub="Awaiting approval" />
        <MetricCard label="Commission" value="₹ 82,450" change="+8.4%" icon={BriefcaseBusiness} accent="blue" sub="This month" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-950">Active clients</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Clients under your operational hierarchy
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/clients')}
                className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
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
                          <p className="text-[10px] text-slate-400">{client.id}</p>
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
                    <td className="px-5 py-3.5 text-right text-[11px] text-slate-400">{client.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-[11px] text-slate-400">
              Showing {previewClients.length} of {MOCK_CLIENTS.length} clients
            </span>
            <button onClick={() => navigate('/clients')} className="text-[11px] font-semibold text-blue-600">
              Manage clients <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-950">Attention required</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">Items needing a review</p>
            </div>
            <span className="flex size-6 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-700">
              {attentionItems.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {attentionItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setNotice(`${item.title}: ${item.text}`)}
                className="flex w-full gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${item.tone === 'amber' ? 'bg-amber-50 text-amber-600' : item.tone === 'red' ? 'bg-red-50 text-red-600' : item.tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}
                >
                  <item.icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-slate-800">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">{item.text}</span>
                </span>
                <ChevronRight size={14} className="mt-1 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setNotice('Audit is coming soon.')}
            className="w-full border-t border-slate-100 px-5 py-3 text-left text-[11px] font-semibold text-blue-600 hover:bg-slate-50"
          >
            View audit activity <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-950">Recent betting activity</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">Latest activity across your clients</p>
            </div>
            <button onClick={() => navigate('/bets')} className="text-[11px] font-semibold text-blue-600">
              View all bets <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
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
                    onClick={() => navigate('/bets')}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[11px] font-semibold text-blue-600">{bet.id}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{bet.client}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-[12px] font-medium text-slate-800">{bet.match}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{bet.market}</p>
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
                    <td className="px-5 py-3.5 text-right text-[11px] text-slate-400">{bet.placedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-[14px] font-semibold text-slate-950">Cash reconciliation</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Session #104 · Today</p>
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
              onClick={() => setNotice('Cash session #104 opened for review.')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open cash session <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
      <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[10px] text-slate-400">
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
