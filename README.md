# Hierarchical Betting Platform

Wagering platform (Super Master → Super Admin → Master → Client). This repository currently contains **slice 1 only**: auth plus hierarchy scope isolation.

Later domains — matches, betting, ledger, cash, commission — are out of scope.

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

## Run locally

```bash
npm install
npm run start:dev
```

No database required for this slice. Persistence defaults to an in-memory user store.

PostgreSQL is the source of truth. To use it:

```bash
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

`DATABASE_URL` in `.env` switches the users repository to Prisma/Postgres.

## Prove hierarchy isolation

```bash
npm test          # unit tests (scope + permissions)
npm run prove:scope
```

`prove:scope` is an HTTP e2e suite against the real Nest API. It asserts:

1. Same client, wrong parent Master → `403`
2. Frontend-supplied `user_id` / `master_id` / `parent_user_id` / `organization_id` are ignored; parent and org come from the session
3. Login identity comes from username/password + token, not body ids
