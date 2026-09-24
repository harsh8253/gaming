import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  Phone,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
  UserPlus,
  WalletCards,
  X,
} from 'lucide-react';
import { ClientAvatar, MetricCard, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  betStatusTone,
  formatINR,
  MASTERS,
  MOCK_BETS,
  MOCK_CLIENTS,
  TONES,
  type ClientStatus,
  type MockClient,
} from '../lib/mockDesk';

type StatusFilter = 'ALL' | ClientStatus;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export function ClientsPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<MockClient[]>(MOCK_CLIENTS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [masterFilter, setMasterFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) setSelectedId(focus);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId && !addOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDrawer();
        setAddOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, addOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        !needle || `${client.name} ${client.id}`.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
      const matchesMaster = masterFilter === 'ALL' || client.master === masterFilter;
      return matchesQuery && matchesStatus && matchesMaster;
    });
  }, [clients, query, statusFilter, masterFilter]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const activeCount = clients.filter((c) => c.status === 'ACTIVE').length;
  const totalPosition = clients.reduce((sum, c) => sum + c.position, 0);
  const totalExposure = clients.reduce((sum, c) => sum + c.exposure, 0);
  const clientBets = selected ? MOCK_BETS.filter((bet) => bet.client === selected.name) : [];

  function closeDrawer() {
    setSelectedId(null);
    if (searchParams.get('focus')) {
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }
  }

  function toggleStatus(client: MockClient) {
    const next: ClientStatus = client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, status: next } : c)));
    setNotice(
      next === 'SUSPENDED' ? `${client.name} has been suspended.` : `${client.name} is active again.`,
    );
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('ALL');
    setMasterFilter('ALL');
  }

  function handleAddClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const master = String(form.get('master') ?? MASTERS[0]);
    const cash = Number(form.get('cash') ?? 0);
    const limit = Number(form.get('limit') ?? 0);
    if (!name) return;

    const client: MockClient = {
      id: `CLI-${1042 + clients.length}`,
      name,
      initials: initialsOf(name),
      tone: TONES[clients.length % TONES.length]!,
      master,
      status: 'ACTIVE',
      position: cash,
      available: cash,
      exposure: 0,
      limit: limit || Math.round(cash * 2),
      bets: 0,
      cash,
      phone: String(form.get('phone') ?? '—'),
      joined: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      activity: 'Just now',
    };
    setClients((prev) => [client, ...prev]);
    setAddOpen(false);
    setNotice(`${name} was added as a new client.`);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 hidden items-center gap-2 sm:flex">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
              Super Admin A
            </span>
            <span className="text-[11px] text-slate-400">/</span>
            <span className="text-[11px] font-medium text-slate-500">Master network</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Clients</h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Every client account under your operational hierarchy.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-900"
        >
          <UserPlus size={14} /> Add client
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total clients" value={String(clients.length)} icon={Users} accent="blue" sub="In your hierarchy" />
        <MetricCard label="Active" value={String(activeCount)} icon={ShieldCheck} accent="green" sub={`${clients.length - activeCount} suspended`} />
        <MetricCard label="Account position" value={formatINR(totalPosition)} icon={ArrowUpRight} accent="teal" sub="Combined ledger balance" />
        <MetricCard label="Current exposure" value={formatINR(totalExposure)} icon={WalletCards} accent="amber" sub={`${((totalExposure / totalPosition) * 100).toFixed(1)}% of position`} />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or client ID..."
              aria-label="Search clients"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${statusFilter === status ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}
              </button>
            ))}
          </div>
          <select
            value={masterFilter}
            onChange={(e) => setMasterFilter(e.target.value)}
            aria-label="Filter by master"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All masters</option>
            {MASTERS.map((master) => (
              <option key={master} value={master}>
                {master}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">No clients match these filters</p>
              <p className="mt-1 text-[12px] text-slate-500">
                Try a different name, ID, status, or master.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <StackTable className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-3 py-3 font-semibold">Master</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 text-right font-semibold">Account position</th>
                    <th className="px-3 py-3 text-right font-semibold">Exposure</th>
                    <th className="px-3 py-3 text-right font-semibold">Open bets</th>
                    <th className="px-3 py-3 text-right font-semibold">Cash</th>
                    <th className="px-5 py-3 text-right font-semibold">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedId(client.id)}
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
                      <td className="px-3 py-3.5 text-[12px] text-slate-600">{client.master}</td>
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
              </StackTable>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] text-slate-400">
                Showing {filtered.length} of {clients.length} clients
              </span>
            </div>
          </>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-40" role="presentation">
          <button
            aria-label="Close client details"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} details`}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:pb-0"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <ClientAvatar initials={selected.initials} tone={selected.tone} size={12} />
                <div>
                  <p className="text-[15px] font-semibold text-slate-950">{selected.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {selected.id} · Master: {selected.master}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <StatusBadge tone={selected.status === 'SUSPENDED' ? 'red' : 'green'}>
                {selected.status}
              </StatusBadge>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Account position', formatINR(selected.position)],
                  ['Available', formatINR(selected.available)],
                  ['Current exposure', selected.exposure ? formatINR(selected.exposure) : '—'],
                  ['Credit limit', formatINR(selected.limit)],
                  ['Physical cash', formatINR(selected.cash)],
                  ['Open bets', String(selected.bets)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 space-y-2 text-[12px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" /> +91 {selected.phone}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-slate-400" /> Client since {selected.joined}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-[12px] font-semibold text-slate-800">Recent bets</h4>
                {clientBets.length ? (
                  <ul className="mt-2 space-y-2">
                    {clientBets.map((bet) => (
                      <li
                        key={bet.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-[11px] font-semibold text-slate-800">{bet.match}</p>
                          <p className="text-[10px] text-slate-400">{bet.market} · {bet.placedAt}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                            {formatINR(bet.stake)}
                          </span>
                          <StatusBadge tone={betStatusTone(bet.status)}>{bet.status.replace('_', ' ')}</StatusBadge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-slate-400">No recent bets for this client.</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => toggleStatus(selected)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-semibold ${
                  selected.status === 'ACTIVE'
                    ? 'border border-red-200 text-red-700 hover:bg-red-50'
                    : 'bg-[#172554] text-white hover:bg-blue-900'
                }`}
              >
                {selected.status === 'ACTIVE' ? (
                  <>
                    <ShieldOff size={14} /> Suspend client
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Reactivate client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4" role="presentation">
          <button
            aria-label="Close add client form"
            onClick={() => setAddOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add client"
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-950">Add client</h3>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleAddClient}>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Full name</span>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. Nikhil Sharma"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Phone</span>
                <input
                  name="phone"
                  placeholder="98XXX XXXXX"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">Master</span>
                <select
                  name="master"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {MASTERS.map((master) => (
                    <option key={master} value={master}>
                      {master}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Starting cash</span>
                  <input
                    name="cash"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={0}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Credit limit</span>
                  <input
                    name="limit"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={0}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#172554] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-blue-900"
                >
                  Create client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
