# Production Hardening

This document covers verification steps for production-critical paths: Redis tile caching, Postgres `zip_data` performance, filter+map load testing, and Stripe subscription lifecycle.

---

## 1. Redis tile caching (map performance)

Map tiles are proxied through the backend and cached in Redis to reduce Mapbox requests and improve latency.

### How it works

- **GET /api/map/tiles/:z/:x/:y** — Fetches tile from Mapbox, stores in Redis (key `mapbox:tile:{z}:{x}:{y}`) with TTL 7 days, returns the image. Subsequent requests for the same tile are served from Redis.
- Response headers include **X-Cache: HIT** or **X-Cache: MISS** so you can verify caching.

### Verification

1. **Health check**  
   **GET /health/detailed** includes a `tileCache` check: it runs a test `setString`/`getString` (same code path as tile storage). Ensure `checks.tileCache.status === 'healthy'`.

2. **Manual cache hit**  
   - Request the same tile twice:  
     `GET /api/map/tiles/10/512/512`  
   - First response: **X-Cache: MISS**.  
   - Second response: **X-Cache: HIT**.

3. **Load test**  
   Run the filter+map load test (see below). The script reports tile **HIT rate**; after warm-up, repeat requests for the same tile should be mostly HITs.

### Requirements

- **REDIS_URL** (or default `redis://localhost:6379`) must be set and Redis running.
- **MAPBOX_ACCESS_TOKEN** or **REACT_APP_MAPBOX_TOKEN** required for the tile proxy to fetch from Mapbox.

---

## 2. Postgres `zip_data` query performance

The main user flow is filter-by-state (and optional county, zip, price, rent) with **ORDER BY gross_rental_yield DESC LIMIT 500**.

### Indexes (minimum)

| Index | Purpose |
|-------|--------|
| **state** | `idx_zip_data_state` (002) |
| **zip_code** | `idx_zip_data_zip_code` (008) — filter by single zip |
| **rent_to_price_ratio** | `idx_zip_data_rent_to_price_ratio` (007) — filter/sort by 1% rule |
| **state + yield** | `idx_zip_data_state_yield` (008) — state filter + order by yield |

### Apply migrations

From repo root (with `DATABASE_URL` set):

```bash
cd backend && npm run migrate
```

Or run the migration file directly:

```bash
psql $DATABASE_URL -f database/migrations/008_zip_data_production_indexes.sql
```

### Verify at scale

1. **Row count**  
   `SELECT COUNT(*) FROM zip_data;` — ensure you have enough rows (e.g. 500+ for beta).

2. **Explain**  
   Run the same query as the app with filters:

   ```sql
   EXPLAIN (ANALYZE, BUFFERS)
   SELECT zip_code, state, county, median_price, median_rent,
          rent_to_price_ratio, gross_rental_yield, grm, last_updated
   FROM zip_data
   WHERE state = 'TX' AND median_price > 0 AND median_rent > 0
   ORDER BY gross_rental_yield DESC NULLS LAST
   LIMIT 500;
   ```

   Check that an index is used (e.g. `idx_zip_data_state_yield`) and execution time is acceptable (e.g. &lt; 50 ms for tens of thousands of rows).

---

## 3. Load test: filter + map flow

The most common user flow is: open dashboard → apply filters (state, etc.) → load map and tiles.

### Script

```bash
node scripts/load-test-filter-map.js [API_BASE]
```

Example:

```bash
node scripts/load-test-filter-map.js http://localhost:5000
```

**API_BASE** can be omitted (default `http://localhost:5000`) or set via env: `API_BASE=https://your-api.railway.app node scripts/load-test-filter-map.js`.

### What it does

- **Concurrent users:** 10  
- **Iterations per user:** 5  
- **Endpoints:**  
  - GET /api/data/pricing-data?state=TX  
  - POST /api/map/loaded  
  - GET /api/map/tiles/10/512/512  

Output includes:

- Latency stats (avg, p50, p95) for pricing, map/loaded, and tiles.
- **Tile cache HIT rate** — after warm-up, the same tile should be mostly HITs (confirms Redis tile caching).

### Interpreting results

- **pricing-data** p95 &lt; ~500 ms is healthy for a cached or well-indexed query.
- **tile** first requests are MISS; subsequent requests for the same tile should be HIT; high HIT rate confirms tile cache is working.
- If tile endpoint returns 503, ensure Mapbox token is set; tile stats will be partial but pricing and map/loaded still validate the flow.

---

## 4. Stripe subscription lifecycle

End-to-end validation for **upgrade, downgrade, cancellation, and failed payment**.

### Webhook events handled

| Event | Handling |
|-------|----------|
| **checkout.session.completed** | Create/update `subscriptions` row, set Stripe customer on user, sync plan (Basic/Pro). |
| **customer.subscription.updated** | Update `subscriptions` (status, period), sync user plan. Covers **upgrade**, **downgrade**, and **cancel_at_period_end**. |
| **customer.subscription.deleted** | Update `subscriptions`, sync user to free. |
| **invoice.payment_succeeded** | Logged (subscription already updated via subscription events). |
| **invoice.payment_failed** | Log + sync subscription and user plan from Stripe (so `past_due` / cancellation is reflected). |

### How to validate

1. **Webhook endpoint**  
   - Must receive **raw body** (see `app.js`: route uses `express.raw({ type: 'application/json' })` before `express.json()`).  
   - **STRIPE_WEBHOOK_SECRET** must be set and match the Stripe Dashboard webhook signing secret.

2. **Upgrade (e.g. Basic → Pro)**  
   - In Stripe Dashboard or via Customer portal, change plan.  
   - Stripe sends **customer.subscription.updated** with new `items.data[0].price.id`.  
   - Backend updates `subscriptions` and calls `syncUserSubscriptionPlan` → user’s `subscription_plan` becomes `pro`.

3. **Downgrade (Pro → Basic)**  
   - Same as upgrade: **customer.subscription.updated** with new price id → plan synced to `basic`.

4. **Cancellation**  
   - User cancels (e.g. via Billing Portal) → subscription set to `cancel_at_period_end`.  
   - Stripe sends **customer.subscription.updated** (and later **customer.subscription.deleted** at period end).  
   - Backend updates `subscriptions.status` and syncs user; when status is no longer `active`, user is set to `free`.

5. **Failed payment**  
   - Use Stripe test card that fails (e.g. `4000000000000341`) or trigger a failed invoice in Dashboard.  
   - Stripe sends **invoice.payment_failed** (and may send **customer.subscription.updated** with status `past_due`).  
   - Backend: **invoice.payment_failed** handler retrieves the subscription, updates `subscriptions` row and syncs user plan so DB reflects `past_due` or canceled state.

### Testing with Stripe CLI

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Then trigger test events:

```bash
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Confirm in your DB that `subscriptions` and `users.subscription_plan` / `users.subscription_status` match Stripe.

---

## Checklist

- [ ] **Redis:** `/health/detailed` shows `tileCache` healthy; tile endpoint returns X-Cache: HIT on second request for same tile.
- [ ] **Postgres:** Migration 008 applied; `EXPLAIN` on main zip_data query uses index; execution time acceptable at scale.
- [ ] **Load test:** `node scripts/load-test-filter-map.js` run against staging/production; pricing and tile latencies and tile HIT rate acceptable.
- [ ] **Stripe:** Webhook receives raw body; upgrade, downgrade, cancel, and failed payment tested end-to-end; DB stays in sync with Stripe.
