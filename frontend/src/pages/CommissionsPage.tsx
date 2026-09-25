import { useEffect, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BriefcaseBusiness, PlusCircle, TrendingUp, Users, X } from 'lucide-react';
import { DeskSheet } from '../components/DeskSheet';
import { ListRow, MetricCard, MetricStrip, MobileList, PageHeader, StackTable, StatusBadge } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';
import {
  formatINR,
  MASTERS,
  MOCK_COMMISSION_PAYOUTS,
  MOCK_COMMISSION_RULES,
  type CommissionPayout,
  type CommissionRule,
} from '../lib/mockDesk';

export function CommissionsPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [rules, setRules] = useState<CommissionRule[]>(MOCK_COMMISSION_RULES);
  const [payouts, setPayouts] = useState<CommissionPayout[]>(MOCK_COMMISSION_PAYOUTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const selected = rules.find((r) => r.id === selectedId) ?? null;
  const activeRules = rules.filter((r) => r.status === 'ACTIVE');
  const avgRate = activeRules.length
    ? activeRules.reduce((sum, r) => sum + r.rate, 0) / activeRules.length
    : 0;
  const currentPeriod = payouts.filter((p) => p.period === 'March 2026');
  const totalThisMonth = currentPeriod.reduce((sum, p) => sum + p.commissionEarned, 0);
  const pendingPayout = payouts.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.commissionEarned, 0);

  useEffect(() => {
    if (!selectedId && !addOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedId(null);
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
  }, [selectedId, addOpen]);

  function closeDrawer() {
    setSelectedId(null);
  }

  function markPaid(payout: CommissionPayout) {
    setPayouts((prev) => prev.map((p) => (p.id === payout.id ? { ...p, status: 'PAID' } : p)));
    setNotice(`Commission for ${payout.master} (${payout.period}) marked as paid.`);
  }

  function deactivateRule(rule: CommissionRule) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, status: 'INACTIVE' } : r)));
    setNotice(`Commission rule for ${rule.master} was deactivated.`);
    closeDrawer();
  }

  function handleAddRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const master = String(form.get('master') ?? MASTERS[0]);
    const rate = Number(form.get('rate') ?? 0);
    const effectiveFrom = String(form.get('effectiveFrom') ?? '').trim();
    if (!effectiveFrom || rate <= 0) return;

    const rule: CommissionRule = {
      id: `RULE-${String(rules.length + 1).padStart(2, '0')}`,
      master,
      role: 'Master',
      rate,
      effectiveFrom,
      status: 'ACTIVE',
    };
    setRules((prev) => [rule, ...prev]);
    setAddOpen(false);
    setNotice(`New commission rule added for ${master}.`);
  }

  return (
    <>
      <PageHeader
        title="Commissions"
        description="Commission rules and payouts across your masters."
        action={{ label: 'Add rule', icon: PlusCircle, onClick: () => setAddOpen(true) }}
      />

      <MetricStrip>
        <MetricCard label="This month" value={formatINR(totalThisMonth)} icon={TrendingUp} accent="blue" sub="March 2026 to date" />
        <MetricCard label="Active rules" value={String(activeRules.length)} icon={Users} accent="teal" sub={`${rules.length} total`} />
        <MetricCard label="Average rate" value={`${avgRate.toFixed(2)}%`} icon={BriefcaseBusiness} accent="violet" sub="Across active rules" />
        <MetricCard label="Pending payout" value={formatINR(pendingPayout)} icon={BriefcaseBusiness} accent="amber" sub="Not yet paid" />
      </MetricStrip>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-[14px] font-semibold text-foreground">Commission rules</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Rate applied to each master's gross volume</p>
        </div>
        <MobileList label="Commission rules">
          {rules.map((rule) => (
            <ListRow
              key={rule.id}
              onClick={() => setSelectedId(rule.id)}
              title={rule.master}
              subtitle={`${rule.role} · from ${rule.effectiveFrom}`}
              trailing={`${rule.rate.toFixed(2)}%`}
              trailingSub={<StatusBadge tone={rule.status === 'ACTIVE' ? 'green' : 'slate'}>{rule.status}</StatusBadge>}
            />
          ))}
        </MobileList>
        <div className="hidden overflow-x-auto md:block">
          <StackTable className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Master</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 text-right font-semibold">Rate</th>
                <th className="px-3 py-3 font-semibold">Effective from</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  onClick={() => setSelectedId(rule.id)}
                  className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">{rule.master}</td>
                  <td className="px-3 py-3.5 text-[12px] text-slate-600">{rule.role}</td>
                  <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                    {rule.rate.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3.5 text-[11px] text-slate-500">{rule.effectiveFrom}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={rule.status === 'ACTIVE' ? 'green' : 'slate'}>{rule.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </StackTable>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-[14px] font-semibold text-foreground">Recent payouts</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Commission earned per master and period</p>
        </div>
        <MobileList label="Payouts">
          {payouts.map((payout) => (
            <ListRow
              key={payout.id}
              title={payout.master}
              subtitle={`${payout.period} · ${formatINR(payout.grossVolume)} volume`}
              trailing={formatINR(payout.commissionEarned)}
              trailingSub={
                payout.status === 'PENDING' ? (
                  <button
                    onClick={() => markPaid(payout)}
                    className="rounded-md border border-blue-200 px-2.5 py-1 text-[12px] font-semibold text-blue-700 active:bg-blue-50"
                  >
                    Mark paid
                  </button>
                ) : (
                  <StatusBadge tone="green">{payout.status}</StatusBadge>
                )
              }
            />
          ))}
        </MobileList>
        <div className="hidden overflow-x-auto md:block">
          <StackTable className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Master</th>
                <th className="px-3 py-3 font-semibold">Period</th>
                <th className="px-3 py-3 text-right font-semibold">Gross volume</th>
                <th className="px-3 py-3 text-right font-semibold">Commission</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-800">{payout.master}</td>
                  <td className="px-3 py-3.5 text-[12px] text-slate-600">{payout.period}</td>
                  <td className="px-3 py-3.5 text-right text-[12px] font-medium tabular-nums text-slate-700">
                    {formatINR(payout.grossVolume)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-[12px] font-semibold tabular-nums text-slate-900">
                    {formatINR(payout.commissionEarned)}
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge tone={payout.status === 'PAID' ? 'green' : 'amber'}>{payout.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {payout.status === 'PENDING' && (
                      <button
                        onClick={() => markPaid(payout)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </StackTable>
        </div>
      </section>

      {selected && (
        <DeskSheet label={`${selected.master} commission rule`} onClose={closeDrawer} variant="dialog">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-950">{selected.master}</h3>
            <button
              onClick={closeDrawer}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Rate</dt>
              <dd className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">{selected.rate.toFixed(2)}%</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Effective from</dt>
              <dd className="mt-1 text-[13px] font-semibold text-slate-900">{selected.effectiveFrom}</dd>
            </div>
          </dl>
          {selected.status === 'ACTIVE' && (
            <button
              onClick={() => deactivateRule(selected)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-[12px] font-semibold text-red-700 hover:bg-red-50"
            >
              Deactivate rule
            </button>
          )}
        </DeskSheet>
      )}

      {addOpen && (
        <DeskSheet label="Add commission rule" onClose={() => setAddOpen(false)} variant="dialog">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-950">Add commission rule</h3>
            <button
              onClick={() => setAddOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <form className="space-y-3" onSubmit={handleAddRule}>
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
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Rate (%)</span>
              <input
                name="rate"
                type="number"
                min={0.1}
                step={0.05}
                defaultValue={4}
                required
                autoFocus
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Effective from</span>
              <input
                name="effectiveFrom"
                required
                placeholder="e.g. 1 April 2026"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
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
                Add rule
              </button>
            </div>
          </form>
        </DeskSheet>
      )}
    </>
  );
}
