# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary day-to-day users:** Masters managing Clients — client accounts, day-to-day betting/account operations, exposure, cash records, and statements.

**Secondary control users:** Super Admins and Super Master for higher-level hierarchy, platform, and operational control.

**Clients:** Self-scoped account position, betting history, and statements (not the primary desk operator).

**Open:** No single role is declared as the exclusive primary desk user beyond this primary/secondary framing.

## Product Purpose

WagerDesk is a hierarchical wagering management and financial operations system. It exists so operators can run Super Master → Super Admin → Master → Client organizations with controlled betting operations, account positions, physical-cash recording, and an auditable financial trail.

**Near-term success (transactional MVP):** end-to-end authentication and hierarchy, client management, immutable ledger, physical cash and reconciliation, matches/markets, betting, exposure/limits, settlement, commission versioning, and an audit trail.

## Positioning

A controlled financial operations system with a betting front — not a basic CRUD app. Hierarchy determines who can see and act; the ledger records account position; physical cash is recorded separately from ledger balance; commission and settlement follow versioned, auditable rules.

## Operating Context

Operators work in a role-scoped web desk. Authorization is permission plus hierarchy scope; the server session is the source of actor identity. Parent, organization, and role for ownership are never trusted from the client. Current shipped slices: authentication/JWT, hierarchy-scoped users, and double-entry ledger (balances derived, journals immutable, corrections via reversal). Later domains from the product blueprint: matches/markets, betting, exposure/limits, cash, commission, settlement, reports, audit.

## Capabilities and Constraints

**Confirmed / in scope for the product direction:**

- Hierarchy roles: Super Master, Super Admin, Master, Client
- Permission + hierarchy scope on every sensitive read/write
- Immutable double-entry ledger; no mutable authoritative `balance` field
- Idempotent financial requests; settlements and financial posts must not double-apply
- Physical cash recording and reconciliation as a distinct domain from ledger/account position
- Roadmap domains: matches, markets, betting, exposure, limits, settlement, commission (versioned), audit, reporting

**Non-negotiable engineering/product rules:**

- Never mutate historical financial transactions
- Never directly edit a balance
- Never trust hierarchy identifiers from the frontend
- Never settle a bet twice / accept the same financial request twice
- Never change financial state outside a database transaction
- Never recalculate historical commission using current rules
- Never permit cross-organization access
- Never mix physical cash with account/ledger balance
- Never delete financial or audit history

**Technical stack already in repo (not a greenfield choice):** NestJS + TypeScript API; React + TypeScript + Vite frontend; PostgreSQL as intended financial source of truth (in-memory optional for early slices); Prisma when `DATABASE_URL` is set.

**Open / not yet productized in UI:** matches, betting, exposure, cash, commission, settlement, and full reporting — present as roadmap, not shipped desk surfaces.

## Brand Commitments

- **Working product name:** WagerDesk (provisional; keep for now)
- UI must **not invent or imply** licensing, KYC/AML compliance, tax compliance, payment-gateway activity, or other regulatory claims that have not been specified and verified
- Position copy as a **wagering management + financial operations** system that records **physical cash** events; do not claim to be a payment service or that money moved through a gateway

## Evidence on Hand

- Product blueprint supplied by the product owner (hierarchical betting management architecture)
- Repository README describing slices 1–2 (auth/hierarchy, ledger)
- Runnable API and React desk for auth, hierarchy users, and ledger
- No licensed brand system, logo pack, testimonials, customer case studies, or regulatory certifications on hand — future work must not fabricate them

## Product Principles

1. **Scope before action** — every view and mutation is bounded by the authenticated actor’s hierarchy.
2. **Ledger is truth for account position** — balances are derived; history is append-only; corrections reverse and replace.
3. **Cash is not balance** — physical cash events and reconciliation stay distinct from ledger position.
4. **Operations over spectacle** — the desk optimizes for Masters’ daily client/account work and higher-role control, not marketing theater.
5. **No invented compliance** — never claim licensing, KYC/AML, tax, or payment-rail status the product has not verified.

## Accessibility & Inclusion

No product-specific accessibility standard was established beyond ordinary web usability. Treat WCAG-oriented clarity as a default engineering practice until a formal target is set.
