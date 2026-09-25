import { useMemo, useState, type FormEvent } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TeamMark } from './cricketUi';
import { formatINR, MOCK_CLIENTS, MOCK_MATCHES, type CricketFormat } from '../lib/mockDesk';

export type BetDraft = {
  clientId: string;
  format: CricketFormat;
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
};

const MARKETS = ['Match Winner', 'Toss Winner', 'Top Batter', 'Total Runs Over/Under'];
const TEAM_MARKETS = new Set(['Match Winner', 'Toss Winner']);
const STAKE_STEPS = [1000, 5000, 10000];
const OPEN_FIXTURES = MOCK_MATCHES.filter((m) => m.status !== 'FINISHED');
const ACTIVE_CLIENTS = MOCK_CLIENTS.filter((c) => c.status === 'ACTIVE');

const fieldClass =
  'h-11 w-full rounded-md border border-input bg-card px-3 text-[14px] outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/20';

function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  decimals,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step: number;
  min: number;
  decimals: number;
}) {
  const set = (next: number) => onChange(Math.max(min, Number(next.toFixed(decimals))));
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
        <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => set(value - step)} className="flex w-10 items-center justify-center text-muted-foreground hover:bg-muted active:bg-accent">
          <Minus size={15} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step="any"
          value={value}
          onChange={(e) => set(Number(e.target.value) || min)}
          className="min-w-0 flex-1 border-x border-input bg-transparent text-center text-[15px] font-semibold tabular-nums outline-none"
        />
        <button type="button" aria-label={`Increase ${label.toLowerCase()}`} onClick={() => set(value + step)} className="flex w-10 items-center justify-center text-muted-foreground hover:bg-muted active:bg-accent">
          <Plus size={15} />
        </button>
      </span>
    </label>
  );
}

/** The order ticket: fixture, market, selection, odds and stake, with the payout always in view. */
export function OrderTicket({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (draft: BetDraft) => void }) {
  const [clientId, setClientId] = useState(ACTIVE_CLIENTS[0]?.id ?? '');
  const [matchId, setMatchId] = useState(OPEN_FIXTURES[0]?.id ?? '');
  const [market, setMarket] = useState(MARKETS[0]!);
  const [selection, setSelection] = useState('');
  const [odds, setOdds] = useState(1.85);
  const [stake, setStake] = useState(5000);

  const fixture = OPEN_FIXTURES.find((m) => m.id === matchId) ?? OPEN_FIXTURES[0];
  const teamMarket = TEAM_MARKETS.has(market);
  const payout = useMemo(() => Math.round(stake * odds), [stake, odds]);
  const ready = Boolean(fixture && clientId && selection.trim() && stake > 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fixture || !ready) return;
    onSubmit({
      clientId,
      format: fixture.format,
      match: `${fixture.home} vs ${fixture.away}`,
      market,
      selection: selection.trim(),
      odds,
      stake,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Place bet</h3>
        <button type="button" onClick={onCancel} aria-label="Close" className="-mr-2 flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Fixture</span>
          <select value={matchId} onChange={(e) => { setMatchId(e.target.value); setSelection(''); }} className={fieldClass}>
            {OPEN_FIXTURES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.home} vs {m.away} · {m.format}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Market</span>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {MARKETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMarket(m); setSelection(''); }}
                aria-pressed={market === m}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
                  market === m ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground hover:bg-muted',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Selection</span>
          {teamMarket && fixture ? (
            <div className="grid grid-cols-2 gap-2">
              {[fixture.home, fixture.away].map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelection(team)}
                  aria-pressed={selection === team}
                  className={cn(
                    'flex min-h-14 items-center gap-2.5 rounded-md border px-3 text-left text-[14px] font-medium transition-colors',
                    selection === team ? 'border-blue-600 bg-accent text-primary ring-1 ring-blue-600' : 'border-input bg-card hover:bg-muted',
                  )}
                >
                  <TeamMark team={{ id: team, name: team }} size="sm" />
                  <span className="min-w-0 leading-tight">{team}</span>
                </button>
              ))}
            </div>
          ) : (
            <input
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              placeholder={market === 'Top Batter' ? 'Player name' : 'e.g. Over 185.5'}
              className={fieldClass}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Odds" value={odds} onChange={setOdds} step={0.05} min={1.01} decimals={2} />
          <Stepper label="Stake" value={stake} onChange={setStake} step={500} min={0} decimals={0} />
        </div>
        <div className="flex gap-1.5">
          {STAKE_STEPS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setStake((s) => s + amount)}
              className="h-8 flex-1 rounded-md bg-muted text-[12px] font-medium tabular-nums text-foreground hover:bg-secondary active:bg-accent"
            >
              +{amount / 1000}K
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldClass}>
            {ACTIVE_CLIENTS.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} · {client.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-border bg-card px-5 pt-3 sm:-mx-6 sm:px-6">
        <dl className="flex items-baseline justify-between text-[13px]">
          <dt className="text-muted-foreground">Potential payout</dt>
          <dd className="text-[18px] font-semibold tabular-nums">{formatINR(payout)}</dd>
        </dl>
        <dl className="mt-0.5 flex items-baseline justify-between text-[12px] text-muted-foreground">
          <dt>Adds exposure</dt>
          <dd className="tabular-nums">{formatINR(stake)}</dd>
        </dl>
        <Button type="submit" disabled={!ready} className="mt-3 h-12 w-full bg-blue-600 text-[15px] hover:bg-blue-700">
          Place bet {formatINR(stake)}
        </Button>
      </div>
    </form>
  );
}
