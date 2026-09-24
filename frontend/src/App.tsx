import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { WagerDeskShell } from './components/WagerDeskShell';
import { AuditPage } from './pages/AuditPage';
import { BetsPage } from './pages/BetsPage';
import { CashPage } from './pages/CashPage';
import { ClientsPage } from './pages/ClientsPage';
import { CommissionsPage } from './pages/CommissionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExposurePage } from './pages/ExposurePage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';
import { MarketsPage } from './pages/MarketsPage';
import { MatchesPage } from './pages/MatchesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { UsersPage } from './pages/UsersPage';
import { store } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<WagerDeskShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="bets" element={<BetsPage />} />
                <Route path="matches" element={<MatchesPage />} />
                <Route path="markets" element={<MarketsPage />} />
                <Route path="exposure" element={<ExposurePage />} />
                <Route path="settlements" element={<SettlementsPage />} />
                <Route path="cash" element={<CashPage />} />
                <Route path="commissions" element={<CommissionsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route element={<AppShell />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="ledger" element={<LedgerPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
