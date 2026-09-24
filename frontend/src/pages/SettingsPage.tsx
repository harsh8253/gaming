import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Building2, Laptop, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';
import { Toggle } from '../components/deskUi';
import type { ShellContext } from '../components/WagerDeskShell';

type Session = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

const INITIAL_SESSIONS: Session[] = [
  { id: 'SESS-1', device: 'Chrome on Windows', location: 'Mumbai, IN', lastActive: 'Active now', current: true },
  { id: 'SESS-2', device: 'Safari on iPhone', location: 'Mumbai, IN', lastActive: '2 hours ago' },
  { id: 'SESS-3', device: 'Chrome on Android', location: 'Pune, IN', lastActive: 'Yesterday' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold text-slate-950">{title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { setNotice } = useOutletContext<ShellContext>();
  const [orgName, setOrgName] = useState('WagerDesk Operations');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST, UTC+5:30)');
  const [currency, setCurrency] = useState('INR — Indian Rupee');

  const [exposureAlerts, setExposureAlerts] = useState(true);
  const [settlementAlerts, setSettlementAlerts] = useState(true);
  const [cashSummary, setCashSummary] = useState(false);

  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);

  function saveField(label: string) {
    setNotice(`${label} updated.`);
  }

  function toggleWithNotice(
    label: string,
    setter: (v: boolean) => void,
    current: boolean,
  ) {
    setter(!current);
    setNotice(`${label} ${!current ? 'enabled' : 'disabled'}.`);
  }

  function revokeSession(session: Session) {
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    setNotice(`Session on ${session.device} was revoked.`);
  }

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
            Super Admin A
          </span>
          <span className="text-[11px] text-slate-400">/</span>
          <span className="text-[11px] font-medium text-slate-500">Master network</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Settings</h2>
        <p className="mt-1 text-[13px] text-slate-500">Organization, notification, and security preferences.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SettingsCard icon={Building2} title="Organization" description="Display details for your desk">
            <div className="space-y-4">
              <Field label="Organization name">
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onBlur={() => saveField('Organization name')}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </Field>
              <Field label="Timezone">
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    saveField('Timezone');
                  }}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Asia/Kolkata (IST, UTC+5:30)</option>
                  <option>Asia/Dubai (GST, UTC+4:00)</option>
                  <option>Europe/London (GMT, UTC+0:00)</option>
                </select>
              </Field>
              <Field label="Display currency">
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    saveField('Display currency');
                  }}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option>INR — Indian Rupee</option>
                  <option>USD — US Dollar</option>
                </select>
              </Field>
            </div>
          </SettingsCard>

          <SettingsCard icon={Bell} title="Notifications" description="Choose what your desk alerts you about">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Exposure threshold breaches</p>
                  <p className="text-[11px] text-slate-400">Email when a client crosses their limit</p>
                </div>
                <Toggle
                  label="Exposure threshold breaches"
                  checked={exposureAlerts}
                  onChange={() => toggleWithNotice('Exposure threshold alerts', setExposureAlerts, exposureAlerts)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Settlement approval requests</p>
                  <p className="text-[11px] text-slate-400">Email when a master requests a settlement</p>
                </div>
                <Toggle
                  label="Settlement approval requests"
                  checked={settlementAlerts}
                  onChange={() => toggleWithNotice('Settlement approval alerts', setSettlementAlerts, settlementAlerts)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Daily cash summary</p>
                  <p className="text-[11px] text-slate-400">A digest of every session's reconciliation</p>
                </div>
                <Toggle
                  label="Daily cash summary"
                  checked={cashSummary}
                  onChange={() => toggleWithNotice('Daily cash summary', setCashSummary, cashSummary)}
                />
              </div>
            </div>
          </SettingsCard>
        </div>

        <div className="space-y-6">
          <SettingsCard icon={ShieldCheck} title="Security" description="Protect access to your desk">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Two-factor authentication</p>
                  <p className="text-[11px] text-slate-400">Require a code at every sign-in</p>
                </div>
                <Toggle
                  label="Two-factor authentication"
                  checked={twoFactor}
                  onChange={() => toggleWithNotice('Two-factor authentication', setTwoFactor, twoFactor)}
                />
              </div>
              <Field label="Session timeout">
                <select
                  value={sessionTimeout}
                  onChange={(e) => {
                    setSessionTimeout(e.target.value);
                    saveField('Session timeout');
                  }}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </Field>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Active sessions
                </p>
                <ul className="space-y-2">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {session.device.includes('iPhone') || session.device.includes('Android') ? (
                          <Smartphone size={15} />
                        ) : (
                          <Laptop size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-slate-800">{session.device}</p>
                        <p className="text-[10px] text-slate-400">
                          {session.location} · {session.lastActive}
                        </p>
                      </div>
                      {session.current ? (
                        <span className="text-[10px] font-semibold text-emerald-600">This device</span>
                      ) : (
                        <button
                          onClick={() => revokeSession(session)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                        >
                          Revoke
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SettingsCard>

          <section className="rounded-xl border border-red-200 bg-red-50/40 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <div className="flex items-start gap-3 border-b border-red-100 px-5 py-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <TriangleAlert size={16} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-red-900">Danger zone</h3>
                <p className="mt-0.5 text-[11px] text-red-700/70">Demo-only actions for this preview build</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-[12px] font-semibold text-slate-800">Reset demo data</p>
                <p className="text-[11px] text-slate-500">Restores clients, bets, and matches to their defaults.</p>
              </div>
              <button
                onClick={() => setNotice('Demo data reset is not available in this preview build.')}
                className="rounded-lg border border-red-300 px-3.5 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
