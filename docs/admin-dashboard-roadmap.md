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
| Payments | Yes | Top-up list/detail/verify; session refunds in Sessions |
| Analytics nav | Stubbed | Page exists; sidebar commented out; no real API |

### Home dashboard polish backlog (do later)

Visual chrome cleanup (duplicate header icon, fake Documentation / Download Report CTAs) is done. Remaining:

1. **Wire live data** — Replace hardcoded stats, chart series, user statistics, recent sessions, top listeners, and activity feed with admin APIs. Until then, avoid presenting mock trends as live. Year filter should drive real queries once wired.
2. **Analytics tabs** — Users / Listeners / Sessions tabs are empty placeholders. Ship one Overview chart until per-tab series exist; then fill tabs with real breakdowns (or remove them).
3. **Cut filler panels** — Prefer a short Recent Sessions table from the Sessions API (with View all) over demo rows + Recent Activities. Drop or replace Top Listeners / Activities until backed by real data.

Related: Phase 3 “Replace mock home dashboard with live metrics”.

### Architecture backlog (do later)

**Note:** Defer a proper shell/auth restructure to a later **pages-router migration** (persistent admin layout via `_app` + `getLayout`, or equivalent). Don’t keep patching remount symptoms (e.g. sidebar `localStorage`) indefinitely. Listener portal can adopt the same pattern afterward.

| # | Todo | Severity | Notes |
|---|------|----------|--------|
| 1 | **Persistent admin layout** | High | Today every page wraps its own `<Layout>`, so Sidebar/Navbar remount on each nav. Own the shell once in `_app` / `getLayout`. |
| 2 | **Single auth gate** | High | Auth is split across `Layout`, home-only checks, and per-page `validateToken()`. One gate; no flash of protected UI. |
| 3 | **Fix admin session detail route** | High | `/sessions/[sessionId]/details` uses `ListenerLayout` + listener auth. Should use admin shell (listener twin is under `/listener/...`). |
| 4 | **Unify admin token keys** | Medium | Login writes both `accessToken` and `adminToken`; readers disagree. One key; clear it everywhere on logout/401. |
| 5 | **Collapse `/` vs `/dashboard`** | Medium | Two homes with different gates; sidebar points at `/`. Pick one canonical route. |
| 6 | **Shared admin API client** | Medium | Sparks uses modules; most screens inline `fetch`. Align headers, base URL, and 401 handling. |
| 7 | **Consistent auth redirects** | Medium | Mix of `router.push` and `window.location` on expired token. Prefer one client navigation path. |
| 8 | **Untangle admin vs listener components** | Low | Admin session widgets live under `components/listener/`, which encourages wrong imports. |
| 9 | **Stub / orphan pages** | Low | `/analytics` has no real API; `FansPage` / `test` lack admin wiring. Remove, hide, or wire. |
| 10 | **`_app` blank-until-ready** | Low | Returns `null` until client ready → hard-refresh blank flash. Render shell/skeleton instead. |

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

## Phase 2 — Payments oversight + session refunds

| Capability | Backend | Dashboard |
|------------|---------|-----------|
| List/filter top-ups globally | `GET /admin/dashboard/payments` | Payments page |
| Payment detail + spark credit link | `GET /admin/dashboard/payments/:id` | Detail modal (`sparkCredited`) |
| Reconcile stuck pending | `POST /admin/dashboard/payments/:reference/verify` | Verify action |
| Session refund trigger | `POST /sessions/:sessionId/refund` + `issueRefund` on status update | Sessions UI |
| Refund reason / clear errors | Reason on body; 4xx when unpaid/already refunded | Confirm + error surfacing |
| Payment reference lookup | Filter `reference` / `providerReference` | Search on Payments page |

**Out of scope:** RevenueCat provider factory fix, partial refunds, auto-refund on user cancel, mismatch job queue, pricing config (Phase 3).

---

## Phase 3 — Live analytics + pricing

| Capability | Backend | Dashboard |
|------------|---------|-----------|
| Home Dashboard metrics | `GET /admin/dashboard/analytics` + existing spark-stats | Live KPIs + recent sessions |
| Overview chart | Monthly series (sessions, purchased, redeemed) | Recharts last 6 months |
| Spark conversion rate | Mongo `PlatformConfig` + `GET/PATCH /admin/pricing-config` | Pricing page |
| Session cost | Same PlatformConfig | Pricing page |

**Out of scope:** Spark bundles / RevenueCat offerings (not in use), per-tab Users/Listeners/Sessions charts, Top Listeners, Recent Activities, Premium/Returning stats, `/analytics` stub, Redis pricing, Phase 4 audit log.

Home polish backlog (mock charts / filler panels) is addressed by the live Dashboard rewrite.

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
6. Real analytics home (Phase 3)
7. Topics management (Phase 4)
8. User account actions (Phase 4)
9. Listener performance (Phase 4)
10. Notification history + listener targets (Phase 4)
11. Admin audit log (Phase 4)
12. Support tools / unified lookup (Phase 4)
