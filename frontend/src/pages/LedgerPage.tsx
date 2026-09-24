import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { StackTable } from '../components/deskUi';
import {
  canPostLedger,
  formatAmount,
  formatDate,
  newIdempotencyKey,
  ROLE_LABEL,
} from '../lib/rbac';
import { useAppSelector } from '../store';
import type { LedgerSide } from '../types/api';

type DraftLine = {
  accountUserId: string;
  side: LedgerSide;
  amount: string;
};

const emptyLine = (): DraftLine => ({
  accountUserId: '',
  side: 'DEBIT',
  amount: '',
});

export function LedgerPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const queryClient = useQueryClient();
  const allowPost = canPostLedger(user.role);

  const [filterAccount, setFilterAccount] = useState('');
  const [balanceUserId, setBalanceUserId] = useState(user.id);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([
    { accountUserId: '', side: 'DEBIT', amount: '' },
    { accountUserId: '', side: 'CREDIT', amount: '' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastJournalId, setLastJournalId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api.listUsers(),
  });

  const entriesQuery = useQuery({
    queryKey: ['ledger-entries', filterAccount || null],
    queryFn: () => api.listEntries(filterAccount || undefined),
  });

  const balanceQuery = useQuery({
    queryKey: ['balance', balanceUserId],
    queryFn: () => api.getBalance(balanceUserId),
    enabled: Boolean(balanceUserId),
  });

  const usernameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of usersQuery.data ?? []) {
      map.set(row.id, row.username);
    }
    return map;
  }, [usersQuery.data]);

  const postMutation = useMutation({
    mutationFn: (payload: {
      description?: string;
      lines: { accountUserId: string; side: LedgerSide; amount: number }[];
    }) => api.postJournal(payload, newIdempotencyKey('journal')),
    onSuccess: async (journal) => {
      setFormError(null);
      setDescription('');
      setLines([emptyLine(), { ...emptyLine(), side: 'CREDIT' }]);
      setLastJournalId(journal.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ledger-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Could not post journal. Check the lines and try again.',
      );
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (journalId: string) =>
      api.reverseJournal(journalId, newIdempotencyKey('reverse')),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ledger-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
    },
  });

  function onPost(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = lines.map((line) => ({
      accountUserId: line.accountUserId.trim(),
      side: line.side,
      amount: Number(line.amount),
    }));
    if (
      parsed.some(
        (line) =>
          !line.accountUserId ||
          !Number.isInteger(line.amount) ||
          line.amount < 1,
      )
    ) {
      setFormError('Each line needs an account and a positive integer amount.');
      return;
    }
    postMutation.mutate({
      description: description.trim() || undefined,
      lines: parsed,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Ledger</h2>
        <p className="mt-1 max-w-prose text-[13px] text-slate-500">
          Double-entry journals are append-only. Balances are derived as credits minus
          debits. Corrections use reversals.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">Account balance</h2>
          <div className="mt-4">
            <select
              className="field"
              value={balanceUserId}
              onChange={(e) => setBalanceUserId(e.target.value)}
              aria-label="Account for balance"
            >
              {(usersQuery.data ?? []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.username} · {ROLE_LABEL[row.role]}
                </option>
              ))}
            </select>
          </div>
          {balanceQuery.data ? (
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-paper px-3 py-4">
                <dt className="text-sm font-semibold text-ink-soft">Debits</dt>
                <dd className="mt-1 font-display text-xl font-bold tabular-nums">
                  {formatAmount(balanceQuery.data.debitTotal)}
                </dd>
              </div>
              <div className="rounded-lg bg-paper px-3 py-4">
                <dt className="text-sm font-semibold text-ink-soft">Credits</dt>
                <dd className="mt-1 font-display text-xl font-bold tabular-nums">
                  {formatAmount(balanceQuery.data.creditTotal)}
                </dd>
              </div>
              <div className="rounded-lg bg-blue-soft px-3 py-4">
                <dt className="text-sm font-semibold text-blue">Balance</dt>
                <dd className="mt-1 font-display text-xl font-bold tabular-nums text-blue">
                  {formatAmount(balanceQuery.data.balance)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              {balanceQuery.isError
                ? (balanceQuery.error as Error).message
                : 'Select an in-scope account.'}
            </p>
          )}
        </article>

        {allowPost ? (
          <article className="surface rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold">Post journal</h2>
            <form className="mt-4 space-y-3" onSubmit={onPost}>
              <input
                className="field"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[1.4fr_0.7fr_0.6fr]"
                >
                  <select
                    className="field"
                    value={line.accountUserId}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = { ...line, accountUserId: e.target.value };
                      setLines(next);
                    }}
                    required
                    aria-label={`Line ${index + 1} account`}
                  >
                    <option value="">Account</option>
                    {(usersQuery.data ?? []).map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.username}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field"
                    value={line.side}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = {
                        ...line,
                        side: e.target.value as LedgerSide,
                      };
                      setLines(next);
                    }}
                    aria-label={`Line ${index + 1} side`}
                  >
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="field"
                    placeholder="Amount"
                    value={line.amount}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = { ...line, amount: e.target.value };
                      setLines(next);
                    }}
                    required
                    aria-label={`Line ${index + 1} amount`}
                  />
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setLines([...lines, emptyLine()])}
                >
                  Add line
                </button>
                <button
                  type="submit"
                  disabled={postMutation.isPending}
                  className="btn-primary"
                >
                  {postMutation.isPending ? 'Posting…' : 'Post balanced journal'}
                </button>
              </div>
              {formError ? (
                <p role="alert" className="text-sm text-danger">
                  {formError}
                </p>
              ) : null}
              {lastJournalId ? (
                <div className="rounded-lg border border-blue/20 bg-blue-soft px-3 py-2 text-sm text-blue">
                  Posted journal <code className="text-ink">{lastJournalId}</code>
                  <button
                    type="button"
                    className="ml-3 font-semibold underline"
                    disabled={reverseMutation.isPending}
                    onClick={() => reverseMutation.mutate(lastJournalId)}
                  >
                    {reverseMutation.isPending ? 'Reversing…' : 'Reverse'}
                  </button>
                </div>
              ) : null}
            </form>
          </article>
        ) : (
          <article className="surface rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold">Posting</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Client accounts are ledger read-only. Ask your Master to post cash or
              position journals.
            </p>
          </article>
        )}
      </section>

      <section className="surface overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">Entries in scope</h2>
          <select
            className="field sm:max-w-xs"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            aria-label="Filter entries by account"
          >
            <option value="">All accounts</option>
            {(usersQuery.data ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.username}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <StackTable className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Side</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Journal</th>
              </tr>
            </thead>
            <tbody>
              {entriesQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-ink-soft" colSpan={5}>
                    Loading entries…
                  </td>
                </tr>
              ) : null}
              {entriesQuery.isError ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={5} role="alert">
                    {(entriesQuery.error as Error).message}
                  </td>
                </tr>
              ) : null}
              {(entriesQuery.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {usernameById.get(row.accountUserId) ?? row.accountUserId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.side === 'CREDIT'
                          ? 'font-semibold text-blue'
                          : 'font-semibold text-ink'
                      }
                    >
                      {row.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatAmount(row.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                    {row.journalId}
                  </td>
                </tr>
              ))}
              {entriesQuery.data?.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-ink-soft" colSpan={5}>
                    No ledger entries yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </StackTable>
        </div>
      </section>
    </div>
  );
}
