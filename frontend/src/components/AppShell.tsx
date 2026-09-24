import { useEffect, useId, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { ROLE_LABEL } from '../lib/rbac';

const LIVE_NAV = [
  { to: '/', label: 'Overview', short: 'Home', end: true },
  { to: '/users', label: 'Hierarchy', short: 'Users' },
  { to: '/ledger', label: 'Ledger', short: 'Ledger' },
] as const;

const SOON_NAV = [
  'Matches',
  'Betting',
  'Exposure',
  'Cash',
  'Commission',
  'Settlement',
  'Reports',
] as const;

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-xl';
  const gap = size === 'sm' ? 'gap-[3px] pb-1.5' : 'gap-1 pb-2';
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-end justify-center overflow-hidden bg-gradient-to-br from-[#2563eb] via-[#1d6fe9] to-[#0f2f64] shadow-md shadow-blue-600/25 ${box} ${gap}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
      <span className="relative h-2 w-1 rounded-full bg-white/85" />
      <span className="relative h-3.5 w-1 rounded-full bg-white" />
      <span className="relative h-5 w-1 rounded-full bg-white" />
    </div>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor';
  const common = {
    className: 'h-5 w-5',
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.85,
    viewBox: '0 0 24 24',
  };
  if (name === 'Overview') {
    return (
      <svg {...common}>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'Hierarchy') {
    return (
      <svg {...common}>
        <circle cx="12" cy="5" r="2.25" />
        <circle cx="6" cy="18" r="2.25" />
        <circle cx="18" cy="18" r="2.25" />
        <path d="M12 7.25V11M12 11H6.5A2.5 2.5 0 0 0 4 13.5V15.75M12 11h5.5A2.5 2.5 0 0 1 20 13.5V15.75" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M4 19V5M4 19h16M8 16V9M12 16v-4M16 16V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTitleId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function logout() {
    setMenuOpen(false);
    dispatch(clearSession());
    navigate('/login', { replace: true });
  }

  const sidebarNav = (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {LIVE_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-ink text-white'
                : 'text-ink-soft hover:bg-paper hover:text-ink',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const roadmap = (
    <div className="border-t border-line pt-5">
      <p className="mb-2 text-sm font-semibold text-ink">Coming later</p>
      <ul className="space-y-1">
        {SOON_NAV.map((label) => (
          <li
            key={label}
            className="flex min-h-10 items-center justify-between rounded-md px-3 py-2 text-sm text-ink-soft"
          >
            <span>{label}</span>
            <span className="text-xs font-medium text-blue">Soon</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const account = user ? (
    <div className="border-t border-line pt-5">
      <p className="font-display text-sm font-semibold">{user.username}</p>
      <p className="text-sm text-ink-soft">{ROLE_LABEL[user.role]}</p>
      <button
        type="button"
        onClick={logout}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue hover:text-blue-bright"
      >
        Sign out
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-panel px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-ink">
              WagerDesk
            </p>
            <p className="text-sm text-ink-soft">Operations desk</p>
          </div>
        </div>
        {sidebarNav}
        <div className="mt-8">{roadmap}</div>
        <div className="mt-auto pt-8">{account}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight text-ink">
              WagerDesk
            </p>
            <p className="truncate text-xs text-ink-soft">
              {user ? ROLE_LABEL[user.role] : 'Operations desk'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M4 7h16M4 12h16M4 17h16"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" id="mobile-menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={menuTitleId}
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-panel shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p id={menuTitleId} className="font-display text-lg font-bold">
                Menu
              </p>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white"
                onClick={() => setMenuOpen(false)}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              {sidebarNav}
              {roadmap}
              {account}
            </div>
          </div>
        </div>
      ) : null}

      <main className="px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:px-10 lg:py-8 lg:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Primary mobile"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {LIVE_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  [
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-semibold',
                    isActive ? 'text-blue' : 'text-ink-soft',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <NavIcon name={item.label} active={isActive} />
                    <span>{item.short}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
