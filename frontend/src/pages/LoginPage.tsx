import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { setSession } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = 'WagerDesk - Sign In';
    return () => {
      document.title = 'WagerDesk';
    };
  }, []);

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await api.login(username.trim(), password);
      dispatch(setSession({ token: result.accessToken, user: result.user }));
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not sign in. Check your connection and try again.',
      );
    } finally {
      setPending(false);
    }
  }

  const passwordToggle = (
    <button
      aria-label="Toggle password visibility"
      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground transition-colors hover:text-slate-600 focus:outline-none"
      type="button"
      onClick={() => setShowPassword((v) => !v)}
    >
      {showPassword ? (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m1 1 22 22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  return (
    <>
      {/* —— Mobile / tablet phone frame —— */}
      <div className="login-font flex min-h-screen items-center justify-center bg-[#f2f6fa] p-0 text-slate-800 antialiased sm:p-4 lg:hidden [-webkit-tap-highlight-color:transparent]">
        <main
          className="relative flex min-h-screen w-full max-w-[420px] flex-col justify-between overflow-hidden bg-white shadow-2xl sm:max-h-[900px] sm:min-h-[850px] sm:rounded-[44px] sm:border-[8px] sm:border-slate-900/90"
          data-purpose="mobile-device-viewport"
        >
          <div
            className="relative w-full min-h-[42%] flex-shrink-0 bg-gradient-to-b from-[#eaf2fb] via-[#e2edfa] to-[#d6e5f7] px-6 pb-16 pt-16 sm:min-h-[380px] sm:pb-20 sm:pt-20"
            data-purpose="upper-branding-banner"
          >
            <div
              className="flex flex-col items-center"
              data-purpose="brand-logo-container"
            >
              <div className="flex items-center space-x-2">
                <div
                  aria-hidden="true"
                  className="flex h-8 items-end space-x-[3.5px] pb-0.5"
                >
                  <div className="h-4 w-[7px] rounded-sm bg-[#1462cb]" />
                  <div className="h-6 w-[7px] rounded-sm bg-[#1462cb]" />
                  <div className="h-8 w-[7px] rounded-sm bg-[#1462cb]" />
                </div>
                <h1 className="flex items-baseline text-[32px] font-extrabold tracking-tight text-[#0a2540]">
                  Wager
                  <span className="font-extrabold text-[#1462cb]">Desk</span>
                </h1>
              </div>
              <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.26em] text-slate-500">
                OPERATE • MANAGE • STAY AHEAD
              </p>
            </div>

            <div className="relative mb-2 mt-10 flex h-16 items-end justify-between px-2">
              <div className="relative z-10">
                <p className="text-[13px] font-medium leading-[1.35] text-slate-700">
                  Control today.
                  <br />
                  A stronger tomorrow.
                </p>
                <div className="mt-2 h-[2px] w-14 rounded-full bg-[#1462cb]" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-2 z-0 flex items-end space-x-1.5 opacity-20"
              >
                <div className="h-6 w-3.5 rounded-t-sm bg-[#1462cb]" />
                <div className="h-10 w-3.5 rounded-t-sm bg-[#1462cb]" />
                <div className="h-14 w-3.5 rounded-t-sm bg-[#1462cb]" />
                <div className="h-[4.5rem] w-3.5 rounded-t-sm bg-[#1462cb]" />
              </div>
            </div>
          </div>

          <div
            className="login-sheet relative z-20 -mt-10 flex min-h-0 flex-[0.85] flex-col rounded-t-[40px] bg-white px-7 pb-4 pt-8"
            data-purpose="auth-form-card"
          >
            <div className="flex flex-1 flex-col justify-center">
              <form
                className="w-full space-y-4"
                onSubmit={onSubmit}
                method="post"
              >
                <div className="space-y-1.5">
                  <label
                    className="block text-[13px] font-bold tracking-tight text-[#0f2439]"
                    htmlFor="username-mobile"
                  >
                    Email or Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        viewBox="0 0 24 24"
                      >
                        <rect
                          height="16"
                          rx="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width="20"
                          x="2"
                          y="4"
                        />
                        <path
                          d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-[14px] text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1462cb]"
                      id="username-mobile"
                      name="username"
                      placeholder="Enter your email or username"
                      required
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="block text-[13px] font-bold tracking-tight text-[#0f2439]"
                    htmlFor="password-mobile"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        viewBox="0 0 24 24"
                      >
                        <rect
                          height="11"
                          rx="2"
                          ry="2"
                          width="18"
                          x="3"
                          y="11"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-[14px] text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1462cb]"
                      id="password-mobile"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordToggle}
                  </div>
                </div>

                <div className="flex justify-end pt-0.5">
                  <a
                    className="text-[13px] font-semibold text-[#1462cb] transition-colors hover:text-[#0f52ab]"
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="pt-2">
                  <button
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#1462cb] px-4 py-3.5 font-semibold text-white shadow-md shadow-[#1462cb]/20 transition duration-150 hover:bg-[#0f52ab] active:scale-[0.99] disabled:opacity-60"
                    type="submit"
                    disabled={pending}
                  >
                    <span className="text-[15px] tracking-tight">
                      {pending ? 'Signing In…' : 'Sign In'}
                    </span>
                    {!pending ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                </div>
              </form>
            </div>

            <footer className="mt-6 flex flex-col items-center space-y-3 pb-1 pt-2 text-center">
              <p className="text-[12px] font-medium text-slate-500">
                Need an account?{' '}
                <a
                  className="font-semibold text-slate-700 hover:underline"
                  href="#support"
                  onClick={(e) => e.preventDefault()}
                >
                  Contact your administrator.
                </a>
              </p>
              <span className="text-[11px] font-normal tracking-wider text-muted-foreground">
                v1.0.0
              </span>
            </footer>
          </div>
        </main>
      </div>

      {/* —— Desktop floating card —— */}
      <div className="login-font login-ambient relative hidden min-h-screen flex-col justify-between overflow-x-hidden text-slate-800 antialiased selection:bg-[#1d6fe9] selection:text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <svg
            className="absolute left-0 top-0 h-[600px] w-full -translate-y-24 scale-110 text-blue-300/25 opacity-70"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1440 560"
          >
            <path
              d="M0,192L60,197.3C120,203,240,213,360,186.7C480,160,600,96,720,90.7C840,85,960,139,1080,165.3C1200,192,1320,192,1380,192L1440,192L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
              fill="currentColor"
            />
          </svg>
          <svg
            className="absolute bottom-0 right-0 h-[550px] w-full translate-y-20 text-blue-400/20 opacity-60"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1440 500"
          >
            <path
              d="M0,128L80,149.3C160,171,320,213,480,208C640,203,800,149,960,128C1120,107,1280,117,1360,122.7L1440,128L1440,500L1360,500C1280,500,1120,500,960,500C800,500,640,500,480,500C320,500,160,500,80,500L0,500Z"
              fill="currentColor"
            />
          </svg>
          <div className="absolute right-12 top-1/4 hidden items-end gap-2.5 opacity-20 xl:flex">
            <span className="h-16 w-3.5 rounded-t-sm bg-blue-500" />
            <span className="h-28 w-3.5 rounded-t-sm bg-blue-500" />
            <span className="h-44 w-3.5 rounded-t-sm bg-blue-600" />
            <span className="h-36 w-3.5 rounded-t-sm bg-blue-500" />
            <span className="h-56 w-3.5 rounded-t-sm bg-[#1d6fe9]" />
          </div>
          <div className="absolute bottom-20 left-16 hidden items-end gap-2 opacity-15 xl:flex">
            <span className="h-14 w-3 rounded-t-sm bg-blue-500" />
            <span className="h-24 w-3 rounded-t-sm bg-blue-500" />
            <span className="h-20 w-3 rounded-t-sm bg-blue-500" />
            <span className="h-32 w-3 rounded-t-sm bg-[#1d6fe9]" />
          </div>
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="relative flex h-8 w-8 items-end justify-center gap-[3px] overflow-hidden rounded-xl bg-gradient-to-br from-[#1d6fe9] to-[#0f2f64] pb-1.5 shadow-md shadow-blue-600/25"
            >
              <span className="h-2 w-[3px] rounded-full bg-white/90" />
              <span className="h-3.5 w-[3px] rounded-full bg-white" />
              <span className="h-5 w-[3px] rounded-full bg-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[#0b1938]">
              Wager<span className="text-[#1d6fe9]">Desk</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Operations desk online</span>
          </div>
        </header>

        <main
          className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6"
          data-purpose="auth-centered-wrapper"
        >
          <div className="w-full max-w-[480px]">
            <section
              className="login-desktop-card rounded-3xl border border-slate-100/90 bg-white/95 p-8 backdrop-blur-xl transition-all sm:p-11"
              data-purpose="auth-card"
            >
              <header
                className="mb-6 flex flex-col items-center text-center"
                data-purpose="brand-header"
              >
                <div
                  aria-hidden="true"
                  className="relative mb-4 flex h-14 w-14 items-end justify-center gap-1.5 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#2563eb] via-[#1d6fe9] to-[#0f2f64] pb-2.5 shadow-[0_10px_24px_-8px_rgba(29,111,233,0.55)] ring-1 ring-white/25"
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
                  <span className="relative h-4 w-1.5 rounded-full bg-white/85" />
                  <span className="relative h-7 w-1.5 rounded-full bg-white" />
                  <span className="relative h-9 w-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0b1938] sm:text-[26px]">
                  Wager<span className="text-[#1d6fe9]">Desk</span>
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  OPERATE • MANAGE • STAY AHEAD
                </p>
              </header>

              <div className="relative mb-7 overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 px-4 py-3">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold leading-tight text-[#0b1938]">
                      Control today.{' '}
                      <span className="text-[#1d6fe9]">A stronger tomorrow.</span>
                    </p>
                    <div className="mt-1 h-0.5 w-12 rounded-full bg-[#1d6fe9]" />
                  </div>
                  <div className="flex h-5 items-end gap-1 text-[#1d6fe9] opacity-40">
                    <span className="h-2 w-1 rounded-sm bg-[#2563eb]" />
                    <span className="h-3.5 w-1 rounded-sm bg-[#1d6fe9]" />
                    <span className="h-5 w-1 rounded-sm bg-[#1558c0]" />
                  </div>
                </div>
              </div>

              <form
                className="space-y-4"
                data-purpose="login-form"
                method="post"
                onSubmit={onSubmit}
              >
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700"
                    htmlFor="username-desktop"
                  >
                    Email or Username
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                        />
                      </svg>
                    </div>
                    <input
                      className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-[#1d6fe9] focus:outline-none focus:ring-2 focus:ring-[#1d6fe9]"
                      id="username-desktop"
                      name="username"
                      placeholder="Enter your email or username"
                      required
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700"
                    htmlFor="password-desktop"
                  >
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                        />
                      </svg>
                    </div>
                    <input
                      className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-[#1d6fe9] focus:outline-none focus:ring-2 focus:ring-[#1d6fe9]"
                      id="password-desktop"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordToggle}
                  </div>
                </div>

                <div className="flex items-center justify-end pb-1 pt-1 text-xs sm:text-sm">
                  <a
                    className="text-xs font-semibold text-[#1d6fe9] transition-colors hover:text-[#1558c0] hover:underline sm:text-sm"
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="pt-1.5">
                  <button
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1d6fe9] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#1d6fe9]/25 transition-all duration-150 hover:bg-[#1558c0] hover:shadow-lg hover:shadow-[#1d6fe9]/35 focus:outline-none focus:ring-2 focus:ring-[#1d6fe9] focus:ring-offset-2 active:bg-[#13479b] disabled:opacity-60 sm:text-base"
                    type="submit"
                    disabled={pending}
                  >
                    <span>{pending ? 'Signing In…' : 'Sign In'}</span>
                    {!pending ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.2}
                        />
                      </svg>
                    ) : null}
                  </button>
                </div>
              </form>

              <footer
                className="mt-2 border-t border-slate-100 pt-6 text-center text-xs text-slate-500"
                data-purpose="auth-footer"
              >
                <p>
                  Need an account?{' '}
                  <a
                    className="font-semibold text-slate-800 transition-colors hover:text-[#1d6fe9]"
                    href="#support"
                    onClick={(e) => e.preventDefault()}
                  >
                    Contact your administrator.
                  </a>
                </p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  v1.0.0
                </p>
              </footer>
            </section>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <svg
                  className="h-3.5 w-3.5 text-[#1d6fe9]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
                Immutable ledger
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">
                Hierarchy-scoped access
              </span>
            </div>
          </div>
        </main>

        <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground">
          <p>© 2026 WagerDesk. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
