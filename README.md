# Hierarchical Betting Platform

Wagering platform (Super Master → Super Admin → Master → Client). This repository currently contains **slice 1** (auth + hierarchy scope) and **slice 2** (double-entry ledger).

Later domains — matches, betting, cash, commission — are out of scope.

## Slice 1

Single `users` model (`role`, `parent_user_id`, `organization_id`). Identity comes from the server session/JWT (`sub` → user row). Request body fields such as `user_id`, `master_id`, `organization_id`, and `role` are never trusted for the actor. Authorization is permission plus hierarchy scope:

- Super Master: own organization
- Super Admin: own subtree
- Master: own clients
- Client: self only

### API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | public | `{ username, password }` → `{ accessToken, user }` |
| `GET` | `/auth/me` | bearer | Session user |
| `POST` | `/users` | bearer | Create next-level user; parent and org come from the session |
| `GET` | `/users` | bearer | List users in scope |
| `GET` | `/users/:id` | bearer | Read one user in scope (`403` if outside) |

Bootstrap Super Master (empty store): `root` / `changeme`.

## Slice 2 — double-entry ledger

Journals are the source of truth. Each journal has two or more legs; total debits must equal total credits. Posted journals and lines are immutable; corrections are new reversal journals. Account balances are **derived** as `sum(credits) - sum(debits)` and are never stored as a mutable field.

Hierarchy scope from S1 applies to every account on every line. `postedByUserId` and `organizationId` always come from the session actor — body actor ids are ignored/stripped.

### Ledger API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/ledger/journals` | bearer + `Idempotency-Key` | Post a balanced journal; retries with the same key return the same journal |
| `POST` | `/ledger/journals/:id/reverse` | bearer + `Idempotency-Key` | Post an opposite-leg reversal journal |
| `GET` | `/ledger/balances/:userId` | bearer | Derived balance for an in-scope account (`403` if outside) |
| `GET` | `/ledger/entries?accountUserId=` | bearer | List journal lines in scope (optional account filter) |

Example post body:

```json
{
  "description": "seed client wallet",
  "lines": [
    { "accountUserId": "<master-id>", "side": "DEBIT", "amount": 1000 },
    { "accountUserId": "<client-id>", "side": "CREDIT", "amount": 1000 }
  ]
}
```

Amounts are positive integers (minor units). Roles with `ledger:post`: Super Master, Super Admin, Master. All roles may `ledger:read` within hierarchy scope.

## Run locally

```bash
npm install
npm run start:dev
```

No database required for these slices. Persistence defaults to in-memory stores for users and the ledger.

PostgreSQL is the source of truth. To use it:

```bash
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

`DATABASE_URL` in `.env` switches the users and ledger repositories to Prisma/Postgres.

## Prove hierarchy isolation and ledger

```bash
npm test            # unit tests (scope, permissions, ledger math)
npm run prove:scope # HTTP e2e — hierarchy isolation
npm run prove:ledger
```

`prove:ledger` asserts:

1. Balanced journal post succeeds
2. Unbalanced journal is rejected
3. Idempotent retry with the same `Idempotency-Key` does not double-post
4. Out-of-scope account access → `403`
5. Balance equals the sum of that account's credit/debit lines
