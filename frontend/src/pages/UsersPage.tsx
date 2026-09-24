import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import {
  canCreateUsers,
  CREATABLE_ROLE,
  formatDate,
  ROLE_LABEL,
} from '../lib/rbac';
import { useAppSelector } from '../store';

export function UsersPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const queryClient = useQueryClient();
  const creatable = CREATABLE_ROLE[user.role];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api.listUsers(),
  });

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: async () => {
      setUsername('');
      setPassword('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Could not create user. Try again.',
      );
    },
  });

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!creatable) return;
    setFormError(null);
    createMutation.mutate({
      username: username.trim(),
      password,
      role: creatable,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Hierarchy</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Users visible inside your authorization scope. Parent and organization come
          from the session — never from the browser.
        </p>
      </header>

      {canCreateUsers(user.role) && creatable ? (
        <section className="surface rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">
            Create {ROLE_LABEL[creatable]}
          </h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
            onSubmit={onCreate}
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Username</span>
              <input
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Password</span>
              <input
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
          {formError ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {formError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Parent</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Id</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-ink-soft" colSpan={5}>
                    Loading users…
                  </td>
                </tr>
              ) : null}
              {usersQuery.isError ? (
                <tr>
                  <td className="px-4 py-6 text-danger" colSpan={5} role="alert">
                    {(usersQuery.error as Error).message}
                  </td>
                </tr>
              ) : null}
              {(usersQuery.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{row.username}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[row.role]}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                    {row.parentUserId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                    {row.id}
                  </td>
                </tr>
              ))}
              {usersQuery.data?.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-ink-soft" colSpan={5}>
                    No users in scope.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
