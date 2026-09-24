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
  CircleHelp,
  ClipboardCheck,
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
  X,
} from 'lucide-react';
import { ClientAvatar } from './deskUi';
import { ROLE_LABEL } from '../lib/rbac';
import { useAppDispatch, useAppSelector } from '../store';
import { clearSession } from '../store/authSlice';
import {
  MOCK_BETS,
  MOCK_CLIENTS,
  MOCK_MARKETS,
  MOCK_SETTLEMENTS,
} from '../lib/mockDesk';

type NavItem = {
  label: string;
  icon: typeof Activity;
  badge?: string;
  to?: string;
};

const OPEN_BET_STATUSES = new Set(['OPEN', 'PENDING', 'ACCEPTED']);
const openBetCount = MOCK_BETS.filter((bet) => OPEN_BET_STATUSES.has(bet.status)).length;
const openMarketCount = MOCK_MARKETS.filter((market) => market.status === 'OPEN').length;
const pendingSettlementCount = MOCK_SETTLEMENTS.filter((s) => s.status === 'PENDING').length;

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: LayoutDashboard, to: '/' },
      { label: 'Clients', icon: Users, badge: String(MOCK_CLIENTS.length), to: '/clients' },
      { label: 'Bets', icon: ClipboardCheck, badge: String(openBetCount), to: '/bets' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Matches', icon: Activity, to: '/matches' },
      { label: 'Cricket', icon: Radio, to: '/cricket' },
      { label: 'Markets', icon: SlidersHorizontal, badge: String(openMarketCount), to: '/markets' },
      { label: 'Exposure', icon: BarChart3, to: '/exposure' },
      { label: 'Settlements', icon: ArrowDownLeft, badge: String(pendingSettlementCount), to: '/settlements' },
    ],
  },
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

const tabItems: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'Bets', icon: ClipboardCheck, badge: String(openBetCount), to: '/bets' },
  { label: 'Clients', icon: Users, to: '/clients' },
  { label: 'Cricket', icon: Radio, to: '/cricket' },
];

const HEADER_TITLES: Record<string, { crumb: string; heading: string }> = {
  '/': { crumb: 'Overview', heading: 'Operations overview' },
  '/clients': { crumb: 'Clients', heading: 'Clients' },
  '/bets': { crumb: 'Bets', heading: 'Bets' },
  '/matches': { crumb: 'Matches', heading: 'Matches' },
  '/cricket': { crumb: 'Cricket', heading: 'Cricket data' },
  '/markets': { crumb: 'Markets', heading: 'Markets' },
  '/exposure': { crumb: 'Exposure', heading: 'Exposure' },
  '/settlements': { crumb: 'Settlements', heading: 'Settlements' },
  '/ledger': { crumb: 'Ledger', heading: 'Ledger' },
  '/cash': { crumb: 'Cash', heading: 'Cash' },
  '/commissions': { crumb: 'Commissions', heading: 'Commissions' },
  '/reports': { crumb: 'Reports', heading: 'Reports' },
  '/audit': { crumb: 'Audit', heading: 'Audit' },
  '/users': { crumb: 'Users / Hierarchy', heading: 'Hierarchy' },
  '/settings': { crumb: 'Settings', heading: 'Settings' },
};

export type ShellContext = {
  setNotice: (message: string | null) => void;
};

function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-lg bg-[#172554] text-sm font-bold text-white ${className}`}>
      W
    </div>
  );
}

export function WagerDeskShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ kind: 'nav' | 'search'; href: string } | null>(null);
  const href = location.pathname + location.search;
  const menu = menuState?.href === href ? menuState.kind : null;

  function setMenu(kind: 'nav' | 'search' | null) {
    setMenuState(kind ? { kind, href } : null);
  }

  const filteredClients = MOCK_CLIENTS.filter((client) =>
    `${client.name} ${client.id}`.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 6);

  const headerInfo =
    HEADER_TITLES[location.pathname] ??
    (location.pathname.startsWith('/cricket/')
      ? HEADER_TITLES['/cricket']
      : { crumb: 'WagerDesk', heading: 'WagerDesk' });

  useEffect(() => {
    if (!menu) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuState(null);
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menu]);

  function isActive(item: NavItem) {
    if (!item.to) return false;
    return item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
  }

  function onNavClick(item: NavItem) {
    setMenu(null);
    if (item.to) {
      navigate(item.to);
      return;
    }
    setNotice(`${item.label} is coming soon.`);
  }

  function signOut() {
    setMenu(null);
    dispatch(clearSession());
    navigate('/login', { replace: true });
  }

  function openClient(id: string) {
    navigate(`/clients?focus=${id}`);
    setShowSearch(false);
    setSearch('');
    setMenu(null);
  }

  const moreActive = !tabItems.some(isActive);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all lg:flex lg:flex-col ${collapsed ? 'w-[76px]' : 'w-[238px]'}`}
      >
        <div className="flex h-[72px] items-center border-b border-slate-100 px-5">
          {collapsed ? (
            <BrandMark className="mx-auto size-8" />
          ) : (
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-[17px] font-bold tracking-tight text-slate-950">
                Wager<span className="text-blue-600">Desk</span>
              </span>
            </div>
          )}
        </div>
        <div className="border-b border-slate-100 px-3 py-3">
          <button
            className={`flex w-full items-center rounded-lg bg-slate-50 p-2.5 text-left hover:bg-slate-100 ${collapsed ? 'justify-center' : 'gap-3'}`}
            onClick={() => setNotice('Organization context is locked to your role.')}
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-[10px] font-bold text-blue-700">
              SA
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-800">
                    Super Admin A
                  </p>
                  <p className="truncate text-[10px] text-slate-400">Operations</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </>
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={`mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 ${collapsed ? 'text-center' : ''}`}
              >
                {collapsed ? '•••' : group.label}
              </p>
              {group.items.map((item) => {
                const { label, icon: Icon, badge } = item;
                const active = isActive(item);
                return (
                  <button
                    key={label}
                    onClick={() => onNavClick(item)}
                    className={`group mb-0.5 flex w-full items-center rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'} ${collapsed ? 'justify-center' : 'gap-3'}`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        {badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                          >
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className={`flex gap-1 border-t border-slate-100 p-3 ${collapsed ? 'flex-col' : ''}`}>
          <button
            onClick={signOut}
            className={`flex items-center justify-center gap-2 rounded-lg p-2 text-[12px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 ${collapsed ? '' : 'flex-1 justify-start px-2.5'}`}
            aria-label="Sign out"
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!collapsed && 'Sign out'}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Toggle sidebar"
          >
            <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      <div className={`transition-all ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[238px]'}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 md:px-7 lg:h-[72px]">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 lg:hidden"
              aria-label="WagerDesk overview"
            >
              <BrandMark className="size-8" />
              <span className="text-[16px] font-bold tracking-tight text-slate-950">
                Wager<span className="text-blue-600">Desk</span>
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-[11px] text-slate-400 lg:flex">
                <span>Operations</span>
                <ChevronRight size={12} />
                <span className="font-medium text-slate-700">{headerInfo.crumb}</span>
              </div>
              <h1 className="mt-1 truncate text-[17px] font-semibold tracking-tight text-slate-950 max-lg:sr-only">
                {headerInfo.heading}
              </h1>
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setMenu('search')}
                className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Search WagerDesk"
              >
                <Search size={19} />
              </button>
              <button
                onClick={() => setNotice('Notifications are coming soon.')}
                className="relative flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-blue-600 ring-2 ring-white" />
              </button>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search WagerDesk"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                  placeholder="Search anything..."
                  className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {showSearch && search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setShowSearch(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
                {showSearch && search && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <ClientResults clients={filteredClients} onPick={openClient} />
                  </div>
                )}
              </div>
              <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
                <Bell size={17} />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
              </button>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Help">
                <CircleHelp size={17} />
              </button>
              <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  SA
                </div>
                <div className="hidden lg:block">
                  <p className="text-[11px] font-semibold text-slate-800">Admin A</p>
                  <p className="text-[10px] text-slate-400">Super Admin</p>
                </div>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 md:px-7 md:pt-7 lg:pb-7">
          {notice && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 py-1 pl-4 pr-1 text-xs text-blue-800">
              <span className="py-2">{notice}</span>
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss notice"
                className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-blue-100"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <Outlet context={{ setNotice } satisfies ShellContext} />
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {tabItems.map((item) => {
            const { label, icon: Icon, badge } = item;
            const active = isActive(item);
            return (
              <button
                key={label}
                onClick={() => onNavClick(item)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${active ? 'text-blue-700' : 'text-slate-500 active:text-slate-800'}`}
              >
                <span className={`absolute inset-x-5 top-0 h-0.5 rounded-full ${active ? 'bg-blue-600' : 'bg-transparent'}`} />
                <span className="relative">
                  <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
                  {badge && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </button>
            );
          })}
          <button
            onClick={() => setMenu('nav')}
            aria-haspopup="dialog"
            aria-expanded={menu !== null}
            className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${moreActive ? 'text-blue-700' : 'text-slate-500 active:text-slate-800'}`}
          >
            <span className={`absolute inset-x-5 top-0 h-0.5 rounded-full ${moreActive ? 'bg-blue-600' : 'bg-transparent'}`} />
            <Menu size={21} strokeWidth={moreActive ? 2.2 : 1.8} />
            More
          </button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            aria-label="Close menu"
            onClick={() => setMenu(null)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="WagerDesk menu"
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-2">
              <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
              <div className="mt-4 flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-bold uppercase text-blue-700">
                  {(user?.username ?? 'SA').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-slate-900">{user?.username ?? 'Super Admin A'}</p>
                  <p className="truncate text-[12px] text-slate-500">
                    {user ? ROLE_LABEL[user.role] : 'Operations'} · Master network
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenu(null)}
                aria-label="Close menu"
                className="mt-4 flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search clients"
                  value={search}
                  autoFocus={menu === 'search'}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients by name or ID"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-slate-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {search ? (
                <div className="mt-3">
                  <ClientResults clients={filteredClients} onPick={openClient} />
                </div>
              ) : (
                navGroups.map((group) => (
                  <section key={group.label} className="mt-5">
                    <h2 className="mb-2 px-1 text-[12px] font-semibold text-slate-500">{group.label}</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const { label, icon: Icon, badge } = item;
                        const active = isActive(item);
                        return (
                          <button
                            key={label}
                            onClick={() => onNavClick(item)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[14px] font-medium transition-colors ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 active:bg-slate-50'}`}
                          >
                            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                            <span className="min-w-0 flex-1 leading-tight">{label}</span>
                            {badge && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                              >
                                {badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}

              {!search && (
                <button
                  onClick={signOut}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-700 active:bg-slate-50"
                >
                  <LogOut size={17} /> Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientResults({
  clients,
  onPick,
}: {
  clients: typeof MOCK_CLIENTS;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Clients</p>
      {clients.length ? (
        clients.map((c) => (
          <button
            key={c.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(c.id)}
            className="flex min-h-12 w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50"
          >
            <ClientAvatar initials={c.initials} tone={c.tone} />
            <span>
              <span className="block text-[12px] font-semibold text-slate-800">{c.name}</span>
              <span className="block text-[10px] text-slate-400">{c.id} · Client</span>
            </span>
          </button>
        ))
      ) : (
        <p className="p-2 text-xs text-slate-500">No matching records</p>
      )}
    </>
  );
}
