# Admin Dashboard Roadmap

Source of truth for Ready Social admin management features in **MY-DASHBOARDS**, relative to **ready-back-end** capabilities.

## Current state (today)

| Area | Dashboard | Notes |
|------|-----------|--------|
| Users | Yes | List, details, notify, export |
| Listeners | Yes | Invite, manage, topics, availability |
| Sessions | Yes | Status, meeting links, topics CRUD |
| Notifications | Partial | Broadcast to users only; listener targets incomplete |
| App Version | Yes | Min iOS/Android version |
| Settings | Yes | Admin password change |
| Home Dashboard | Mock | Sample analytics charts, not live data |
| Sparks / Wallets | Yes | Wallets + ledger UI; more ops polish TBD |
| Analytics nav | Stubbed | Page exists; sidebar commented out; no real API |

### Home dashboard polish backlog (do later)

Visual chrome cleanup (duplicate header icon, fake Documentation / Download Report CTAs) is done. Remaining:

1. **Wire live data** — Replace hardcoded stats, chart series, user statistics, recent sessions, top listeners, and activity feed with admin APIs. Until then, avoid presenting mock trends as live. Year filter should drive real queries once wired.
2. **Analytics tabs** — Users / Listeners / Sessions tabs are empty placeholders. Ship one Overview chart until per-tab series exist; then fill tabs with real breakdowns (or remove them).
3. **Cut filler panels** — Prefer a short Recent Sessions table from the Sessions API (with View all) over demo rows + Recent Activities. Drop or replace Top Listeners / Activities until backed by real data.

Related: Phase 3 “Replace mock home dashboard with live metrics”.

### Backend ready, UI missing

- `GET /admin/dashboard/spark-stats`
- `GET /admin/dashboard/wallets`
- `GET /admin/dashboard/wallets/:userId`
- `POST /admin/dashboard/adjust-sparks`

---

## Suggested build order

| Phase | Focus |
|-------|--------|
| **1** | Sparks & wallets + transaction ledger (+ wallet suspend/close) |
| **2** | Payments oversight + session refunds |
| **3** | Live analytics + pricing/config (conversion rate, session cost) |
| **4** | Topics CRUD, user moderation, admin audit log, notification history / listener targets, support lookup |

---

## Phase 1 — Sparks & wallets + ledger

**Goal:** Support can find wallets, inspect balances, adjust sparks with a reason, change wallet status, and browse the global transaction ledger.

| Capability | Backend | Dashboard |
|------------|---------|-----------|
| Global spark stats | Exists | Wire UI |
| Wallet list + filters | Exists | Wire UI |
| Wallet detail + recent txs | Exists | Wire UI |
| Manual credit/debit | Exists | Wire UI + confirm |
| Global transaction ledger | **New** `GET /admin/dashboard/transactions` | Wire UI |
| Wallet suspend / close / reactivate | **New** `PATCH /admin/dashboard/wallets/:userId/status` | Wire UI |

**Out of scope:** payments reconciliation, refunds, pricing config, analytics home rewrite, topics, dedicated audit log.

---

## Phase 2 — Payments & refunds

- Failed / pending / abandoned top-ups (Paystack / RevenueCat)
- Reconcile spark credit mismatches
- Session refund / dispute actions (backend has `SESSION_REFUNDED` + refund endpoint)
- Payment reference lookup for support

---

## Phase 3 — Analytics & pricing

- Replace mock home dashboard with live metrics (sessions, active users, spark burn/top-up, listener utilization)
- Admin-editable spark conversion rate (currently hardcoded `NGN: 1500`)
- Admin-editable session cost (currently `SESSION_COST = 1`)
- Read-only spark bundle overview (RevenueCat offerings)

---

## Phase 4 — Product ops & hygiene

- Topics catalog CRUD (platform-wide)
- User account actions: verify, deactivate, flag abuse (export already exists)
- Listener performance (completion, cancellations, no-shows)
- Notification history + listener delivery targets
- Dedicated admin audit log (who adjusted sparks, refunded, changed version, etc.)
- Unified support lookup (Spark ID / anonymous name / payment reference)

---

## Highest-value feature list (reference)

1. Sparks & wallets (Phase 1)
2. Payments & top-ups (Phase 2)
3. Transaction ledger (Phase 1)
4. Session refunds / disputes (Phase 2)
5. Spark pricing controls (Phase 3)
6. Bundle overview (Phase 3)
7. Real analytics home (Phase 3)
8. Topics management (Phase 4)
9. User account actions (Phase 4)
10. Listener performance (Phase 4)
11. Notification history + listener targets (Phase 4)
12. Admin audit log (Phase 4)
13. Support tools / unified lookup (Phase 4)
