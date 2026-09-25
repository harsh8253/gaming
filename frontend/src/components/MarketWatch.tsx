import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TeamMark } from './cricketUi';
import { FlashValue } from './deskUi';
import { formatINR, MOCK_MATCHES } from '../lib/mockDesk';

type View = 'live' | 'upcoming';

const liveCount = MOCK_MATCHES.filter((m) => m.status === 'LIVE').length;
const upcomingCount = MOCK_MATCHES.filter((m) => m.status === 'UPCOMING').length;

function useFixtures(view: View) {
  return useMemo(() => MOCK_MATCHES.filter((m) => (view === 'live' ? m.status === 'LIVE' : m.status === 'UPCOMING')), [view]);
}

/** The desk fixtures are sample data; say so wherever they pulse as "live". */
function SampleTag() {
  return (
    <span className="rounded-[4px] bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
      Sample
    </span>
  );
}

function WatchHeader({ view, onView, total }: { view: View; onView: (v: View) => void; total: number }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold whitespace-nowrap">
          Market watch <SampleTag />
        </h2>
        <span className="text-[12px] whitespace-nowrap text-muted-foreground">
          Exposure <FlashValue value={formatINR(total)} className="font-semibold text-foreground" />
        </span>
      </div>
      <Tabs value={view} onValueChange={(v) => onView(v as View)} className="mt-3">
        <TabsList className="w-full">
          <TabsTrigger value="live" className="flex-1">
            Live <span className="tabular-nums text-muted-foreground">{liveCount}</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">
            Upcoming <span className="tabular-nums text-muted-foreground">{upcomingCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}

function WatchRows({ view, onOpen, dense = false }: { view: View; onOpen: (id: string) => void; dense?: boolean }) {
  const fixtures = useFixtures(view);
  return (
    <ul className="divide-y divide-border">
      {fixtures.map((match) => (
        <li key={match.id}>
          <button
            onClick={() => onOpen(match.id)}
            className={cn('flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent/60 active:bg-accent', dense ? 'py-2.5' : 'py-3')}
          >
            <span className="flex shrink-0 flex-col gap-1">
              <TeamMark team={{ id: match.home, name: match.home }} size="xs" />
              <TeamMark team={{ id: match.away, name: match.away }} size="xs" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] leading-5 font-medium">{match.home}</span>
              <span className="block truncate text-[13px] leading-5 font-medium">{match.away}</span>
              <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                {match.status === 'LIVE' && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-loss motion-reduce:animate-none" />}
                {match.startTime.replace('Live · ', '')}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <FlashValue value={formatINR(match.exposure)} className="block text-[14px] font-semibold" />
              <span className="block text-[12px] text-muted-foreground">
                {dense ? match.format : `${match.format} · ${match.competition}`}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Wide screens: the terminal's always-visible market watch column. */
export function MarketWatchPanel({ onOpen, onLive }: { onOpen: (id: string) => void; onLive: () => void }) {
  const [view, setView] = useState<View>('live');
  const total = useFixtures(view).reduce((sum, m) => sum + m.exposure, 0);
  return (
    <aside aria-label="Market watch" className="fixed top-14 bottom-0 left-0 z-20 hidden w-[300px] flex-col border-r border-border bg-card xl:flex">
      <div className="border-b border-border px-4 pt-4 pb-3">
        <WatchHeader view={view} onView={setView} total={total} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <WatchRows view={view} onOpen={onOpen} dense />
      </div>
      <button onClick={onLive} className="flex items-center justify-between border-t border-border px-4 py-3 text-[13px] font-medium text-blue-700 hover:bg-accent/60">
        Live cricket feed <ChevronRight size={15} />
      </button>
    </aside>
  );
}

/** Below xl the column folds into the Overview, straight under the positions band. */
export function MarketWatchSection({ onOpen }: { onOpen: (id: string) => void }) {
  const [view, setView] = useState<View>('live');
  const total = useFixtures(view).reduce((sum, m) => sum + m.exposure, 0);
  return (
    <section aria-label="Market watch" className="desk-panel mt-4 rounded-lg border border-border bg-card xl:hidden">
      <div className="border-b border-border px-4 pt-3.5 pb-3">
        <WatchHeader view={view} onView={setView} total={total} />
      </div>
      <WatchRows view={view} onOpen={onOpen} />
    </section>
  );
}
