import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownLeft,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { InstallBanner, useInstallApp } from './InstallApp';
import { ClientAvatar } from './deskUi';
import { MarketWatchPanel } from './MarketWatch';
import { ROLE_LABEL } from '../lib/rbac';
import { useAppDispatch, useAppSelector } from '../store';
import { clearSession } from '../store/authSlice';
import { formatINR, MOCK_BETS, MOCK_CLIENTS, MOCK_MARKETS, MOCK_MATCHES, MOCK_SETTLEMENTS } from '../lib/mockDesk';

type NavItem = {
  label: string;
  icon: typeof Activity;
  to: string;
  badge?: string;
};

const OPEN_BET_STATUSES = new Set(['OPEN', 'PENDING', 'ACCEPTED']);
const openBetCount = MOCK_BETS.filter((bet) => OPEN_BET_STATUSES.has(bet.status)).length;
const openMarketCount = MOCK_MARKETS.filter((market) => market.status === 'OPEN').length;
const pendingSettlementCount = MOCK_SETTLEMENTS.filter((s) => s.status === 'PENDING').length;

const PRIMARY_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'Bets', icon: ClipboardCheck, to: '/bets', badge: String(openBetCount) },
  { label: 'Clients', icon: Users, to: '/clients' },
  { label: 'Matches', icon: Activity, to: '/matches' },
  { label: 'Markets', icon: SlidersHorizontal, to: '/markets', badge: String(openMarketCount) },
  { label: 'Exposure', icon: BarChart3, to: '/exposure' },
  { label: 'Cricket', icon: Radio, to: '/cricket' },
];

const MORE_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: 'Operations', items: [{ label: 'Settlements', icon: ArrowDownLeft, to: '/settlements', badge: String(pendingSettlementCount) }] },
  {
    label: 'Finance',
    items: [
      { label: 'Ledger', icon: BookOpen, to: '/ledger' },
      { label: 'Cash', icon: WalletCards, to: '/cash' },
      { label: 'Commissions', icon: BriefcaseBusiness, to: '/commissions' },
      { label: 'Reports', icon: FileBarChart, to: '/reports' },
    ],
  },
  {
    label: 'Control',
    items: [
      { label: 'Audit', icon: ShieldCheck, to: '/audit' },
      { label: 'Users / Hierarchy', icon: Network, to: '/users' },
      { label: 'Settings', icon: Settings, to: '/settings' },
    ],
  },
];

const ALL_NAV = [...PRIMARY_NAV, ...MORE_GROUPS.flatMap((g) => g.items)];
const TAB_ITEMS: NavItem[] = [PRIMARY_NAV[0]!, PRIMARY_NAV[1]!, PRIMARY_NAV[2]!, PRIMARY_NAV[6]!];

export type ShellContext = {
  setNotice: (message: string | null) => void;
};

function notify(message: string | null) {
  if (message) toast(message);
}

function BrandMark({ className = 'size-7' }: { className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-md bg-blue-600 text-[13px] font-bold text-white', className)}>
      W
    </span>
  );
}

export function WagerDeskShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const installApp = useInstallApp();
  const user = useAppSelector((state) => state.auth.user);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const initials = (user?.username ?? 'SA').slice(0, 2).toUpperCase();
  const roleLabel = user ? ROLE_LABEL[user.role] : 'Super Admin';

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function isActive(item: NavItem) {
    return item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
  }

  function go(to: string) {
    setPaletteOpen(false);
    setMoreOpen(false);
    navigate(to);
  }

  function signOut() {
    setMoreOpen(false);
    dispatch(clearSession());
    navigate('/login', { replace: true });
  }

  const moreActive = MORE_GROUPS.some((g) => g.items.some(isActive));
  const tabMoreActive = !TAB_ITEMS.some(isActive);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground">
        <div className="flex h-14 items-center gap-2 px-4 lg:gap-6 lg:px-5">
          <button onClick={() => go('/')} className="flex items-center gap-2" aria-label="WagerDesk overview">
            <BrandMark />
            <span className="text-[16px] font-semibold tracking-[-0.02em]">WagerDesk</span>
          </button>

          <nav aria-label="Sections" className="hidden h-full items-stretch lg:flex">
            {PRIMARY_NAV.map((item) => (
              <button
                key={item.to}
                onClick={() => go(item.to)}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 text-[13px] font-medium transition-colors',
                  isActive(item) ? 'text-white' : 'text-blue-100/70 hover:text-white',
                )}
              >
                {item.label}
                {item.badge && (
                  <span className="rounded-full bg-white/12 px-1.5 text-[11px] leading-5 tabular-nums">{item.badge}</span>
                )}
                <span className={cn('absolute inset-x-3 bottom-0 h-[3px] rounded-t-full', isActive(item) ? 'bg-blue-400' : 'bg-transparent')} />
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'relative flex items-center gap-1 px-3 text-[13px] font-medium outline-none transition-colors',
                  moreActive ? 'text-white' : 'text-blue-100/70 hover:text-white data-[state=open]:text-white',
                )}
              >
                More <ChevronDown size={14} />
                <span className={cn('absolute inset-x-3 bottom-0 h-[3px] rounded-t-full', moreActive ? 'bg-blue-400' : 'bg-transparent')} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {MORE_GROUPS.map((group, index) => (
                  <DropdownMenuGroup key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground">{group.label}</DropdownMenuLabel>
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.to} onSelect={() => go(item.to)} className={cn(isActive(item) && 'bg-accent')}>
                        <item.icon /> {item.label}
                        {item.badge && <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{item.badge}</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 w-56 items-center gap-2 rounded-md bg-white/10 px-3 text-[13px] text-blue-100/70 transition-colors hover:bg-white/15 md:flex"
            >
              <Search size={15} /> Search desk
              <kbd className="ml-auto rounded bg-white/10 px-1.5 font-mono text-[11px] text-blue-100/80">Ctrl K</kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Search desk"
              className="flex size-11 items-center justify-center rounded-md text-blue-100 active:bg-white/10 md:hidden"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => notify('Notifications are coming soon.')}
              aria-label="Notifications"
              className="relative flex size-11 items-center justify-center rounded-md text-blue-100 hover:bg-white/10 lg:size-9"
            >
              <Bell size={19} />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-amber-400 ring-2 ring-primary lg:top-1.5 lg:right-1.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden items-center gap-2 rounded-md py-1 pr-1 pl-1.5 outline-none hover:bg-white/10 lg:flex">
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">{initials}</span>
                <ChevronDown size={14} className="text-blue-100/70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block text-[13px] font-semibold text-foreground">{user?.username ?? 'Super Admin A'}</span>
                  <span className="block text-[12px] font-normal text-muted-foreground">{roleLabel} · Master network</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => go('/settings')}>
                  <Settings /> Settings
                </DropdownMenuItem>
                {installApp.available && (
                  <DropdownMenuItem onSelect={() => void installApp.install()}>
                    <Download /> Install app
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={signOut} variant="destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <MarketWatchPanel onOpen={(id) => go(`/matches?focus=${id}`)} onLive={() => go('/cricket')} />

      <div className="xl:pl-[300px]">
        <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 lg:pb-8">
          {location.pathname === '/' && <InstallBanner available={installApp.available} onInstall={() => void installApp.install()} />}
          <Outlet context={{ setNotice: notify } satisfies ShellContext} />
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TAB_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.to}
                onClick={() => go(item.to)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                )}
              >
                <span className={cn('absolute inset-x-6 top-0 h-[3px] rounded-b-full', active ? 'bg-blue-600' : 'bg-transparent')} />
                <span className="relative">
                  <item.icon size={21} strokeWidth={active ? 2.3 : 1.8} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] rounded-full bg-blue-600 px-1 text-center text-[10px] leading-[18px] font-semibold text-white ring-2 ring-card">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              tabMoreActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <span className={cn('absolute inset-x-6 top-0 h-[3px] rounded-b-full', tabMoreActive ? 'bg-blue-600' : 'bg-transparent')} />
            <Menu size={21} strokeWidth={tabMoreActive ? 2.3 : 1.8} />
            More
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerTitle className="sr-only">WagerDesk menu</DrawerTitle>
          <div className="overflow-y-auto px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 px-1 pb-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{user?.username ?? 'Super Admin A'}</p>
                <p className="truncate text-[13px] text-muted-foreground">{roleLabel} · Master network</p>
              </div>
            </div>
            {[{ label: 'Desk', items: PRIMARY_NAV.filter((i) => !TAB_ITEMS.includes(i)) }, ...MORE_GROUPS].map((group) => (
              <section key={group.label} className="mt-3">
                <h2 className="px-1 pb-1.5 text-[12px] font-medium text-muted-foreground">{group.label}</h2>
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {group.items.map((item) => (
                    <button
                      key={item.to}
                      onClick={() => go(item.to)}
                      aria-current={isActive(item) ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 w-full items-center gap-3 px-3.5 text-left text-[15px] transition-colors active:bg-accent',
                        isActive(item) && 'bg-accent font-medium text-primary',
                      )}
                    >
                      <item.icon size={18} strokeWidth={1.9} className="shrink-0 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && <span className="text-[13px] tabular-nums text-muted-foreground">{item.badge}</span>}
                      <ChevronRight size={16} className="text-muted-foreground/60" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
            {installApp.available && (
              <Button
                onClick={() => {
                  setMoreOpen(false);
                  void installApp.install();
                }}
                className="mt-5 h-12 w-full text-[15px]"
              >
                <Download /> Install app on this phone
              </Button>
            )}
            <Button variant="outline" onClick={signOut} className={cn('h-12 w-full text-[15px]', installApp.available ? 'mt-2' : 'mt-5')}>
              <LogOut /> Sign out
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <CommandDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title="Search desk"
        description="Jump to a page, client, bet or match"
        className="max-sm:top-4 sm:max-w-lg"
      >
        <Command filter={(value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}>
        <CommandInput placeholder="Search pages, clients, bets, matches…" />
        <CommandList>
          <CommandEmpty>No matching records.</CommandEmpty>
          <CommandGroup heading="Pages">
            {ALL_NAV.map((item) => (
              <CommandItem key={item.to} value={`page ${item.label}`} onSelect={() => go(item.to)}>
                <item.icon /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Clients">
            {MOCK_CLIENTS.map((client) => (
              <CommandItem key={client.id} value={`client ${client.name} ${client.id}`} onSelect={() => go(`/clients?focus=${client.id}`)}>
                <ClientAvatar initials={client.initials} tone={client.tone} />
                {client.name}
                <CommandShortcut className="tabular-nums">{formatINR(client.position)}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Matches">
            {MOCK_MATCHES.map((match) => (
              <CommandItem key={match.id} value={`match ${match.home} ${match.away} ${match.competition}`} onSelect={() => go(`/matches?focus=${match.id}`)}>
                <Activity /> {match.home} vs {match.away}
                <CommandShortcut>{match.status}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Bets">
            {MOCK_BETS.map((bet) => (
              <CommandItem key={bet.id} value={`bet ${bet.id} ${bet.client} ${bet.match}`} onSelect={() => go(`/bets?focus=${bet.id}`)}>
                <ClipboardCheck /> <span className="font-mono text-[12px]">{bet.id}</span> {bet.client}
                <CommandShortcut className="tabular-nums">{formatINR(bet.stake)}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>

      {installApp.sheet}
    </div>
  );
}
