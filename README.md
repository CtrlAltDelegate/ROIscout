# ROI Scout

**Data-driven real estate investment analytics**

ROI Scout helps investors identify profitable rental markets by analyzing median purchase prices and rental rates by zip code. The platform provides an interactive map heatmap, ROI metric tables, smart filtering, and saved searches — all behind a subscription-gated SaaS model.

---

## Tech Stack

### Frontend
- React 18 with hooks and context
- Tailwind CSS for styling
- React Router v6 for navigation
- Axios for API calls
- Mapbox GL JS + react-map-gl for interactive maps
- Recharts for data visualization
- Stripe.js for subscription payments
- Google OAuth for social login
- Sentry for error tracking

### Backend
- Node.js with Express
- PostgreSQL with connection pooling (pg)
- Redis for caching (via `cacheService`)
- JWT + Passport for authentication
- Google OAuth 2.0 (passport-google-oauth20)
- Stripe for billing and usage metering
- Nodemailer for transactional email
- Multer for file uploads
- Helmet, rate limiting, Joi validation for security
- Sentry + Datadog for observability
- Morgan for HTTP logging

### Infrastructure
- Frontend: Netlify
- Backend + Database: Railway
- Cache: Redis (Railway add-on)

---

## Project Structure

```
roi-scout/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Auth/          # Login, Signup
│       │   ├── Dashboard/     # Dashboard, FilterPanel, ROIHeatmap, ROITable, SavedSearches
│       │   ├── Landing/       # SimpleLandingPage
│       │   ├── Layout/        # Header
│       │   └── Map/           # BasicROIMap, EnhancedROIHeatMap
│       ├── services/          # api.js, auth.js
│       ├── utils/             # constants.js, validation.js
│       └── config/            # sentry.js
├── backend/
│   ├── src/
│   │   ├── controllers/       # auth, data, search, stripe
│   │   ├── middleware/        # auth, rateLimiting, validation, queryOptimization
│   │   ├── routes/            # auth, data, search, stripe, properties, admin, health, usage
│   │   ├── services/          # dataService, cacheService, realEstateDataService,
│   │   │                      #   externalAPI, usageService, dbOptimizationService
│   │   ├── config/            # database, sentry, datadog
│   │   └── utils/             # logger
│   ├── server.js              # Full server (dev)
│   └── minimal-server.js      # Production entry point
└── scripts/
    ├── dev.js                 # Concurrent dev runner
    ├── migrate.js             # Run DB migrations
    ├── seed.js                # Seed sample data
    ├── ingest-data.js              # Property data ingestion pipeline
    ├── ingest-zip-data-free-sources.js  # zip_data from Zillow ZHVI/ZORI + Census (see data/README.md)
    ├── setup-database.js      # First-time DB setup
    └── test-api.js            # Manual API testing
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis
- Git

### 1. Clone and install

```bash
git clone https://github.com/yourusername/roiscout.git
cd roiscout
npm run setup
```

This installs dependencies for both backend and frontend.

### 2. Backend environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/roi_scout
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (Basic $19.99/mo, Pro $49.99/mo)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...   # Create in Stripe Dashboard for Basic plan
STRIPE_PRO_PRICE_ID=price_...    # Create in Stripe Dashboard for Pro plan

# Email
SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=your-password

# Optional: External data APIs
ZILLOW_API_KEY=
RENTOMETER_API_KEY=
GREATSCHOOLS_API_KEY=

# Optional: Mapbox (for tile proxy / usage tracking; same token as frontend is fine)
# MAPBOX_ACCESS_TOKEN=   # or backend reads REACT_APP_MAPBOX_TOKEN if set

# Optional: Observability
SENTRY_DSN=
DATADOG_API_KEY=
```

### 3. Database setup

```bash
cd backend
npm run migrate   # Run migrations
npm run seed      # Seed sample data
```

### 4. Frontend environment

```bash
cp frontend/.env.example frontend/.env
```

Fill in `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SENTRY_DSN=
```

**Mapbox:** Set usage alerts in the [Mapbox dashboard](https://account.mapbox.com/) (e.g. at 40k map loads/month; free tier is 50k). See **docs/MONITORING.md** for details. If costs grow, [MapLibre GL JS](https://maplibre.org/) is a free drop-in replacement.

### 5. Run development servers

```bash
npm run dev
```

Starts both backend (port 5000) and frontend (port 3000) concurrently.

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## API Routes

### Auth
```
POST   /api/auth/signup           # Email/password registration
POST   /api/auth/login            # Email/password login
GET    /api/auth/google           # Google OAuth initiation
GET    /api/auth/google/callback  # Google OAuth callback
GET    /api/auth/profile          # Current user (protected)
```

### Data
```
GET /api/data/pricing-data        # ROI data with filters
GET /api/data/states              # Available states
GET /api/data/counties/:state     # Counties for a state
GET /api/data/zipcodes/:county    # Zip codes for a county
```

### Search
```
GET    /api/searches              # User's saved searches (protected)
POST   /api/searches              # Save a search (protected)
DELETE /api/searches/:id          # Delete a saved search (protected)
```

### Billing (Stripe – Basic $19.99 / Pro $49.99)
```
GET  /api/stripe/plans              # Pricing plans (protected)
POST /api/stripe/checkout-session   # Create Checkout Session, redirect to Stripe (protected)
GET  /api/stripe/subscription       # Current subscription status (protected)
DELETE /api/stripe/subscription     # Cancel at period end (protected)
POST /api/stripe/billing-portal     # Stripe Customer Portal URL (protected)
POST /api/stripe/webhook            # Stripe webhooks (raw body; no auth)
GET  /api/export/csv                # CSV export (Pro only; same query params as pricing-data)
```
Before beta: create two Products in Stripe (Basic, Pro) with recurring prices, set `STRIPE_BASIC_PRICE_ID` and `STRIPE_PRO_PRICE_ID`, and configure the webhook endpoint (e.g. `https://your-api/api/stripe/webhook`) for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

### Other
```
GET /api/health                   # Health check
GET /api/usage                    # API usage stats (protected)
```

---

## Database Schema

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### zip_data
```sql
CREATE TABLE zip_data (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  median_price INTEGER,
  median_rent INTEGER,
  rent_to_price_ratio DECIMAL(5,4),
  gross_rental_yield DECIMAL(5,2),
  grm DECIMAL(8,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zip_code, state)
);
```

### saved_searches
```sql
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ROI Metrics

**Rent-to-Price Ratio**
```
(Monthly Rent × 12) ÷ Purchase Price
Target: > 1% (the "1% rule")
```

**Gross Rental Yield**
```
(Annual Rent ÷ Purchase Price) × 100
Excellent: 10%+ | Good: 8–10% | Fair: 6–8%
```

**Gross Rent Multiplier (GRM)**
```
Purchase Price ÷ Annual Rent
Lower is better — under 12 is generally favorable
```

---

## Available Scripts

**Root**
```bash
npm run dev        # Start both servers concurrently
npm run setup      # Install all dependencies
npm run build      # Build frontend for production
npm test           # Run all tests
```

**Backend**
```bash
npm start          # Start production server (minimal-server.js)
npm run dev        # Start dev server with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed sample data
npm run ingest     # Run property-level data ingestion pipeline
npm run ingest:zip # Run zip_data pipeline from Zillow ZHVI/ZORI (+ optional Census). Place CSVs in data/ (see data/README.md). From backend: node ../scripts/ingest-zip-data-free-sources.js --dry-run to test; use --min-zips 500 before beta.
npm run cleanup    # Clean up stale data
npm test           # Run Jest tests
```

**Frontend**
```bash
npm start          # Start dev server
npm run build      # Production build
npm test           # Run tests
```

---

## Deployment

### Railway (Backend + Database + Redis)
1. Connect GitHub repo to Railway
2. Add a PostgreSQL add-on and Redis add-on
3. Set environment variables (see Backend environment section above)
4. Railway auto-deploys on push to `main`

### Netlify (Frontend)
1. Connect GitHub repo to Netlify
2. Build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`
3. Set environment variables (see Frontend environment section above)

---

## License

MIT
