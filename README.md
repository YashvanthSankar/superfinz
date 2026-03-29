<div align="center">

# SuperFinz

### The all-in-one Gen Z personal finance dashboard

*Built for Vashisht 3.0 · IIITDM Kancheepuram · March 2026*

---

**Next.js 16** &nbsp;·&nbsp; **React 19** &nbsp;·&nbsp; **Prisma 7** &nbsp;·&nbsp; **Supabase** &nbsp;·&nbsp; **Groq AI** &nbsp;·&nbsp; **Tailwind CSS v4**

</div>

---

## What Is SuperFinz?

SuperFinz is a full-stack personal finance web application designed specifically for Indian students and young professionals. It combines real-time expense tracking, AI-powered spend analysis, retirement planning, investment calculators, a GitHub-style spending heatmap, and a financial education hub — all in a single, mobile-first dashboard.

Built entirely in **36 hours** for **Vashisht 3.0**, the national-level technical fest at **IIITDM Kancheepuram**.

---

## Problem Statement

Gen Z Indians are entering the workforce or managing pocket money with zero financial literacy tooling built *for them*. Existing apps are either too complex (Zerodha, ET Money) or too generic (Splitwise). The result:

- Students spend 60–80% of their allowance on food delivery in the first 2 weeks of the month
- Most people aged 18–25 have no savings goal, no SIP, and no retirement projection
- Nobody knows what their ₹350 biryani habit actually costs over 25 years

**SuperFinz makes the invisible visible — in a language Gen Z actually speaks.**

---

## Core Features

### 1. Smart Onboarding

A 4-step adaptive onboarding wizard that tailors the entire app experience to the user's financial profile:

- **Step 1 — Identity:** Age and user type (School Student / College Student / Working Professional)
- **Step 2 — Financial Details:** Conditionally renders student fields (institution, monthly allowance, income sources: Parents / Scholarship / Part-time) or professional fields (company, salary, industry)
- **Step 3 — Spending Habit:** User selects their natural spending pattern — `FRONT_HEAVY` (month-start spender), `BALANCED`, or `CONSERVATIVE` (month-end spender). This directly drives the intelligent weekly budget allocation algorithm on the dashboard.
- **Step 4 — Set Limits:** Monthly budget + savings goal, with auto-budget fill (`budget = income − savingsGoal`) and a live **Monthly Money Plan** validation card that prevents impossible plans (budget + savings > income).

On completion, `onboarded: true` is set and the session is refreshed. Auth middleware redirects unauthenticated users to `/login` and unboarded users to `/onboarding` before they can access the dashboard.

---

### 2. Main Dashboard

A **server-rendered** overview page — all computations happen on the server, no client-side data fetching, no loading spinners.

**Financial Month Boundary:** Starts from the user's join date if they joined in the current calendar month. From the second month onward, it starts on day 1.

**Weekly Budget Pacing Algorithm:**
Months are split into 5 strict week slots (W1: days 1–7, W2: 8–14, W3: 15–21, W4: 22–28, W5: 29–end). Budget is distributed by spending-pattern weights:

| Pattern | W1 | W2 | W3 | W4 | W5 |
|---|---|---|---|---|---|
| FRONT_HEAVY | 1.5× | 1.2× | 1.0× | 0.8× | 0.5× |
| BALANCED | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× |
| CONSERVATIVE | 0.5× | 0.8× | 1.0× | 1.2× | 1.5× |

W5 weight is scaled by `(daysInMonth − 28) / 7` to correctly handle 28-day Februaries and 30-day months.

**Auto-Save Calculation:**
- `autoSaveMonth` = Σ `max(weekBudget_i − weekSpend_i, 0)` for all *completed* weeks only
- `autoSaveWeek` = `max(lastCompletedWeekBudget − lastCompletedWeekSpend, 0)`, zero until a full week is completed

**Retirement Readiness Score (0–100):**
```
fireCorpus    = monthlyBudget × 12 × 25            // 4% rule corpus
projCorpus    = monthlySip × ((1+r)^n − 1) / r     // SIP future value at 12% CAGR
corpusGapPct  = min(projCorpus / fireCorpus × 100, 100)
investPct     = min(monthlySip / income × 100, 100)

score = corpusGapPct × 0.50
      + min(investPct × 3, 100) × 0.30
      + min(investPct × 5, 100) × 0.20
```
- ≥ 70 → **On Track** (green) · 40–69 → **Needs Work** (amber) · < 40 → **At Risk** (red)

`fireDelayMonths = round(unnecessarySpend / monthlySip)` — how many retirement months are being lost to wasteful spending this month.

**Dashboard sections:**
1. Greeting + On Budget Pace badge
2. Retirement Readiness Score ring with 3 drivers (Invest %, Corpus Gap, FIRE Delay)
3. Smart Split Modal — auto-suggest distributing unspent budget to active goals
4. Money Spent / Money Saved widgets (weekly/monthly toggle with mini area charts)
5. 4 Stat Cards — Spent, Remaining, Savings Rate, Transaction Count
6. Insight Strip — Daily average, month projection, top category
7. Spending Trend chart (cumulative vs budget pace) + Category pie chart
8. Spending Heatmap — inline 3-month calendar with "View full →" link
9. Recent Spends — last 5 transactions with AI necessity flags
10. Savings Goals — top 3 active goals with progress bars

---

### 3. AI Spend Analysis (`/api/ai-check`)

Every transaction logged is immediately analysed by a two-tier system:

**Tier 1 — Rule Engine** (always runs first):
- Categories `Rent`, `Utilities`, `Health`, `Education`, `Transport` are always marked necessary
- If a budget exists: necessary when `usedPct ≤ 80%` AND fewer than 2 similar transactions in the past 7 days
- If no budget: necessary only on the first transaction in that category that week

**Tier 2 — Groq LLM** (fires when rule engine flags unnecessary):
- Calls **Groq API** → `llama-3.3-70b-versatile` (max 80 tokens, temperature 0.8)
- Prompt includes: category context, 7-day spend history, budget utilisation %, Gen Z tone instructions
- If API call fails or key is absent: falls back to a rich pool of templated roasts per category (Food, Entertainment, Shopping, Transport), each with dynamic variables `{amount}`, `{prev}`, `{weekSpend}`, `{time}`

Result: each transaction gets `isNecessary: boolean` + `aiNote` — a one-liner roast or validation shown inline next to every transaction.

---

### 4. Finz — AI Financial Chat (`/api/chat`)

A floating chat panel powered by **Groq API** with full financial context injected into every conversation:

**Context injected in system prompt:**
- User profile (name, age, user type, income, monthly budget, savings goal, spending pattern)
- This month's spending by category vs limits (with over-limit flags)
- Last 30 transactions with relative date labels and necessity flags
- Active savings goals with progress percentages
- FIRE corpus calculation (target vs projected at current SIP rate)
- Today's date (so AI can give time-aware advice)

**Model cascade** (tries in order, 10s timeout each):
1. `llama-3.3-70b-versatile`
2. `llama-3.1-8b-instant`
3. `gemma2-9b-it`
4. Smart local fallback (`smartFallback()`)

**Local fallback** is keyword-aware (food / shopping / budget / savings / goals) and generates context-aware replies from real transaction data — zero API calls, never fails silently.

**Quick starters:** "Should I buy biryani today?", "How is my spending this month?", "Where am I overspending?", "How much can I realistically save?"

Conversation history (last 10 messages) is sent with every request for multi-turn context.

---

### 5. Spending Heatmap

GitHub contribution graph–style calendar for 3 months of spending:

- 7-column Sunday-to-Saturday grid with month labels and day-of-week labels
- 5 amber intensity levels: surface → `amber-100` → `amber-200` → `amber-400` → `amber-600`
- Intensity = `ceil((dayAmount / maxDayAmount) × 4)`
- Hover tooltip: date, total spent that day, transaction count
- Stats bar: 3-month total spend, active spend days, average per active day
- Inline version embedded on main dashboard with "View full →" link
- Full-page dedicated view at `/dashboard/heatmap`
- Empty state with CTA when no transactions exist

---

### 6. Retirement Planner (`/dashboard/retirement`)

Interactive calculator with real-time projections and a live corpus growth chart:

```
inflatedExpenses = monthlyExpenses × 12 × (1 + inflation)^yearsLeft
fireCorpus       = inflatedExpenses × 25              // inflation-adjusted 4% rule target
projCorpus       = FV_existing + FV_SIP
sipNeeded        = (corpus − FV_existing) × r / ((1+r)^n − 1)
monthlyPassive   = projCorpus × 0.04 / 12             // 4% safe withdrawal rate
```

All inputs adjustable via sliders: current age, target retirement age, monthly SIP, monthly expenses, existing savings, expected return (6–18% CAGR), inflation (3–10%).

Gap plan: when off-track, shows exact SIP increase needed and converts it to concrete actions ("skip X food orders/month to cover it").

---

### 7. Investment Calculators (`/dashboard/calculators`)

Three calculators with live **Recharts** area/bar chart visualisations:

**SIP (Systematic Investment Plan)**
```
maturity = monthly × ((1+r)^n − 1) / r × (1+r)    // annuity due
r = annualRate / 1200,  n = years × 12
```

**Fixed Deposit** — quarterly compounding:
```
maturity = principal × (1 + rate/400)^(4 × years)
```

**EMI (Equated Monthly Instalment):**
```
EMI = P × r × (1+r)^n / ((1+r)^n − 1)
r = annualRate / 1200,  n = years × 12
```

---

### 8. Financial Education Hub (`/dashboard/learn`)

**12 hand-written articles** across 4 categories — fully searchable and filterable:

| Category | Articles |
|---|---|
| Basics | Budgeting 101 (50/30/20 rule), Why Your Money Loses Value, The Magic of Compounding + Rule of 72, Emergency Fund First |
| Investing | What is a SIP?, What is NIFTY 50?, What is CAGR?, FD vs Stocks vs Mutual Funds |
| Retirement | What is FIRE?, The 4% Rule, Why Start Investing at 21 |
| Advanced | Asset Allocation |

Article pages are **server-rendered** (static, no client JS). Each ends with an "Apply in SuperFinz" action box.

**FinTip Tooltips:** 10 financial terms (SIP, CAGR, FIRE, NIFTY 50, corpus, 4% rule, inflation, compounding, index fund, 25x rule) have inline `?` buttons throughout the app — hover for a definition + link to the full article. Financial education embedded directly into the UX.

---

### 9. Goals Tracker + FIRE Calculator (`/dashboard/goals`)

- Create goals with title, target amount, optional deadline
- Quick-add: +₹500 / +₹1,000 / +₹5,000 per goal
- Mark as achieved
- **Smart Split Modal:** When budget is under-spent, auto-suggests distributing unallocated funds across active goals with a slider per goal
- **Embedded FIRE Calculator:** auto-fills from profile, computes corpus = `expenses × 12 × 25`, estimates retirement age at 12% CAGR
- "Add as savings goal" creates a Freedom Fund pre-filled with your FIRE corpus
- Quick-start suggestions for fresh accounts (Emergency Fund, New Laptop, Trip to Goa, Investment Corpus)

---

### 10. Finance News Feed (`/dashboard/news`)

- Proxies **newsdata.io** filtered for `finance+investing+money` in India, English, business category
- 30-minute Next.js cache revalidation (`next: { revalidate: 1800 }`)
- 6 colour-coded category tags: Banking, Markets, Fintech, Personal Finance, Gen Z Finance, Tax
- Full mock fallback (6 curated articles) when API key is absent — demo badge shown in mock mode

---

### 11. Transactions (`/dashboard/transactions`)

- Log a spend → immediately see AI verdict + Gen Z roast
- **Compound interest callout:** ₹350 today → ₹8.4L in 25 years at 12% CAGR (shown while typing the amount)
- Delete transactions
- AI notes shown inline per transaction (necessity flag + roast text)
- Empty state with "Log your first spend" CTA

---

## Technical Architecture

### Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.1 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | ^7.6.0 |
| DB Driver | `@prisma/adapter-pg` | ^7.6.0 |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.30 |
| Charts | Recharts | ^3.8.1 |
| Animations | Motion (Framer Motion) | ^12.38.0 |
| Icons | Lucide React | ^1.7.0 |
| UI Primitives | Radix UI (Dialog, Dropdown, Progress, Tabs) | various |
| Validation | Zod | ^4.3.6 |
| AI | Groq API (llama-3.3-70b-versatile) | — |
| News | NewsData.io | — |
| Deployment | Vercel + Supabase | — |

---

### Project Structure

```
vh3/
├── prisma/
│   ├── schema.prisma           5 models, 2 enums, composite index
│   ├── prisma.config.ts        Prisma 7 config (DIRECT_URL for migrations)
│   ├── seed-demo.ts            Demo account — Rohan Kumar (47 tx, 3 goals)
│   └── seed-yashvanth.ts       Judge account seed — 68 tx, 4 goals, 5 budgets
├── src/
│   ├── app/
│   │   ├── page.tsx                  Landing page (animated, motion/react)
│   │   ├── layout.tsx                Root layout (Geist fonts, Providers)
│   │   ├── globals.css               Tailwind v4 + CSS custom properties
│   │   ├── login/page.tsx            Google OAuth sign-in
│   │   ├── onboarding/page.tsx       4-step adaptive wizard
│   │   └── dashboard/
│   │       ├── layout.tsx            Sidebar + Finz Chat + Breadcrumbs wrapper
│   │       ├── page.tsx              Overview (Server Component, all math server-side)
│   │       ├── transactions/         Expense log + AI check + compound interest callout
│   │       ├── goals/                Goal tracker + embedded FIRE calculator
│   │       ├── heatmap/              Full-page GitHub-style spending calendar
│   │       ├── calculators/          SIP / FD / EMI with live Recharts
│   │       ├── news/                 Finance news feed
│   │       ├── retirement/           Full retirement planner + corpus chart
│   │       ├── learn/                Article hub + [articleId] detail pages
│   │       └── profile/              User settings
│   ├── app/api/
│   │   ├── auth/[...nextauth]/   NextAuth Google OAuth handler
│   │   ├── transactions/         GET list, POST create (+ budget sync), DELETE [id]
│   │   ├── ai-check/             Rule engine + Groq LLM roast
│   │   ├── chat/                 Finz AI with full context injection
│   │   ├── goals/                GET, POST, PATCH
│   │   ├── budgets/              GET, POST (upsert by category/month/year)
│   │   ├── news/                 newsdata.io proxy with mock fallback
│   │   ├── heatmap/              90-day spend data grouped by date
│   │   └── profile/              GET, PATCH, POST /complete
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx           Desktop sidebar + mobile top bar + bottom nav (4 items + More drawer)
│   │   │   ├── chat.tsx              Finz floating chat panel with typing animation
│   │   │   ├── charts.tsx            SpendTrendChart (area) + CategoryChart (pie)
│   │   │   ├── grid-widgets.tsx      Money Spent + Money Saved (week/month toggle)
│   │   │   ├── smart-split-modal.tsx Auto-allocate unspent budget to goals
│   │   │   ├── heatmap-inline.tsx    Compact column-per-week heatmap widget
│   │   │   └── breadcrumbs.tsx       Route-aware breadcrumbs
│   │   └── ui/
│   │       ├── logo.tsx              SuperFinz image logo (sm/md/lg/xl sizes)
│   │       ├── button.tsx            Button with variants + loading state
│   │       ├── input.tsx             Labelled input with error state
│   │       ├── select.tsx            Labelled select
│   │       ├── card.tsx              Card shell
│   │       └── fin-tip.tsx           10-term inline financial tooltip system
│   ├── lib/
│   │   ├── auth.ts               getSession() — JWT read with DB email fallback
│   │   ├── prisma.ts             Singleton PrismaClient (PrismaPg adapter)
│   │   ├── utils.ts              cn(), formatCurrency(), SPENDING_CATEGORIES
│   │   ├── finance.ts            summarizeFinancePlan(), financePlanError()
│   │   └── learn-content.ts      12 full-text financial education articles
│   ├── types/
│   │   ├── index.ts              Shared TypeScript types
│   │   └── next-auth.d.ts        Session type augmentation (id, onboarded)
│   ├── auth.ts                   NextAuth v5 config (Google, JWT strategy, DB upsert)
│   └── proxy.ts                  Route protection middleware (Next.js 16)
└── package.json
```

---

### Database Schema

```prisma
enum UserType     { SCHOOL_STUDENT | COLLEGE_STUDENT | PROFESSIONAL }
enum IncomeSource { PARENTS | SCHOLARSHIP | PART_TIME | SALARY | FREELANCE | OTHER }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  googleId  String?  @unique
  avatar    String?
  name      String
  age       Int      @default(18)
  userType  UserType @default(COLLEGE_STUDENT)
  onboarded Boolean  @default(false)

  profile      Profile?
  transactions Transaction[]
  budgets      Budget[]
  goals        Goal[]
}

model Profile {
  userId           String  @unique
  // Students
  institution      String?
  monthlyAllowance Float?
  incomeSources    IncomeSource[]
  // Professionals
  company          String?
  monthlySalary    Float?
  industry         String?
  // Common
  monthlyBudget    Float   @default(0)
  savingsGoal      Float   @default(0)
  currency         String  @default("INR")
  spendingPattern  String  @default("BALANCED")
  cycleStartDate   Int     @default(1)
}

model Transaction {
  id          String    @id @default(cuid())
  userId      String
  amount      Float
  category    String    // Food | Transport | Entertainment | Shopping | Health | Education | Utilities | Rent | Subscriptions | Other
  description String
  isNecessary Boolean?  // null = unchecked | true = AI approved | false = AI flagged
  aiNote      String?   // AI-generated roast or validation message
  date        DateTime  @default(now())

  @@index([userId, date])
}

model Budget {
  userId   String
  category String
  limit    Float
  spent    Float  @default(0)
  month    Int
  year     Int

  @@unique([userId, category, month, year])
}

model Goal {
  id           String    @id @default(cuid())
  userId       String
  title        String
  targetAmount Float
  savedAmount  Float     @default(0)
  deadline     DateTime?
  achieved     Boolean   @default(false)
  isEssential  Boolean   @default(false)
}
```

---

### Auth Flow

```
User → "Continue with Google"
  ↓
NextAuth signIn callback
  → prisma.user.upsert by email (create or update googleId, avatar, name)
  ↓
NextAuth jwt callback (runs on every token refresh)
  → DB lookup by email → stores userId + onboarded in JWT payload
  ↓
NextAuth session callback
  → attaches userId + onboarded to session.user
  ↓
Server Components: getSession()
  → auth() from NextAuth + fresh DB lookup (email fallback for OAuth sub mismatch)
  ↓
proxy.ts (Next.js 16 Proxy Middleware — runs at edge, no DB call)
  → /dashboard/** : unauthenticated → /login?callbackUrl=...
  → /dashboard/** : not onboarded → /onboarding
  → /onboarding   : already onboarded → /dashboard
  → /api/**       : unauthenticated → 401 JSON
  → /login        : authenticated → /dashboard
```

---

### Prisma 7 + Supabase Connection Strategy

Prisma 7 moved config out of `schema.prisma` into `prisma.config.ts`. Two separate connection strings are required:

| Usage | URL | Port | Notes |
|---|---|---|---|
| Runtime queries | `DATABASE_URL` | 6543 | pgBouncer pooler, `?pgbouncer=true`, used in `src/lib/prisma.ts` |
| Migrations / db push | `DIRECT_URL` | 5432 | Direct connection, used in `prisma.config.ts` |

This prevents connection pool exhaustion under serverless concurrency (Vercel) while keeping migration tooling functional.

---

### Mobile Navigation

The sidebar adapts across breakpoints:

- **Desktop (lg+):** Fixed left sidebar (208px), logo at top, full nav list, profile + sign-out at bottom
- **Mobile:** Fixed top bar (logo + avatar), fixed bottom bar showing 4 primary nav items (Overview, Transactions, Retirement, Goals) + **More** button
- **More drawer:** Slide-up sheet with remaining items (Learn, Calculators, News, Heatmap, Profile, Sign out) + backdrop dismiss
- All nav links close the drawer on navigation

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | Required | List transactions (paginated) |
| `POST` | `/api/transactions` | Required | Create transaction + sync budget `spent` |
| `DELETE` | `/api/transactions/[id]` | Required | Delete + reverse budget sync |
| `POST` | `/api/ai-check` | Required | Rule engine + Groq LLM necessity analysis |
| `POST` | `/api/chat` | Required | Finz AI with full 30-day context |
| `GET` | `/api/goals` | Required | List all goals |
| `POST` | `/api/goals` | Required | Create goal |
| `PATCH` | `/api/goals` | Required | Update savedAmount or mark achieved |
| `GET` | `/api/budgets` | Required | Budgets for current month |
| `POST` | `/api/budgets` | Required | Upsert budget (category + month + year) |
| `GET` | `/api/news` | Required | Finance news (live or mock) |
| `GET` | `/api/heatmap` | Required | 90-day spend data grouped by date |
| `GET` | `/api/profile` | Required | User + profile |
| `PATCH` | `/api/profile` | Required | Update any profile fields |
| `POST` | `/api/profile/complete` | Required | Finalise onboarding, set `onboarded: true` |

---

## Setup & Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local) or a [Supabase](https://supabase.com) project
- Google OAuth credentials (Google Cloud Console)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- NewsData.io API key — free at [newsdata.io](https://newsdata.io) (200 req/day)

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# AI (optional — graceful fallback when absent)
GROQ_API_KEY="gsk_..."

# News (optional — mock articles shown when absent)
NEWS_API_KEY="your-newsdata-io-key"
```

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Push schema to DB (no migration history needed)
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

### Seed Demo Data

```bash
# Creates demo account (Rohan Kumar) — email: rohan.demo@superfinz.app
npm run seed:demo

# Seeds your own Google account (must sign in with Google first)
npm run seed:yashvanth
```

### Deploy to Vercel

```bash
# 1. Push repo to GitHub
# 2. Import project at vercel.com/new
# 3. Add all environment variables in Vercel project settings
# 4. Set NEXTAUTH_URL to your production URL (e.g. https://superfinz.vercel.app)
# 5. Add https://your-app.vercel.app/api/auth/callback/google
#    to Authorised redirect URIs in Google Cloud Console
```

---

## Design System

A single warm amber/cream palette — chosen to feel calm and premium, countering the anxiety typically associated with personal finance apps:

| Token | Hex | Usage |
|---|---|---|
| Page background | `#fefce8` | All card bg, page bg |
| Primary text | `#713f12` | Headings, primary labels |
| Accent / secondary | `#b45309` | Subtext, captions, icons |
| Muted text | `#78350f` | Smallest labels, metadata |
| Card / input border | `amber-400` | All card and input borders |
| Inner backgrounds | `#fef9c3` | Hover states, input fills |
| Inner tracks | `amber-100` | Progress bars, icon backgrounds |
| Success | `emerald-*` | Under budget, on track, necessary |
| Warning / danger | `red-*` | Over budget, at risk, unnecessary |

Typography: **Geist Sans** (variable font) throughout, **Geist Mono** for numeric displays. Both loaded via `next/font/google` — zero layout shift, no external requests.

---

## Key Design Decisions

**Server-first overview:** The main dashboard is a React Server Component. All financial calculations — retirement score, budget pacing, auto-save, heatmap aggregation, trend data, category breakdown — run on the server. Zero `useEffect`, no loading spinners, no hydration flicker.

**Spending pattern as a first-class concept:** Rather than dividing a monthly budget evenly by day, SuperFinz models how people actually spend. The pattern selected during onboarding drives weekly budget distribution throughout the month, making the numbers feel personal and accurate.

**Auto-save, not manual saving:** The "Money Saved" widget calculates savings automatically from under-budget completed weeks. The number feels earned, not entered.

**Education in context:** FinTip `?` tooltips appear inline next to unfamiliar terms like "corpus" and "FIRE delay" — not buried in a help section. Users learn financial vocabulary in the exact moment they encounter it.

**Full offline-capable fallbacks:** Every external API (Groq, newsdata.io) has a complete local fallback. The app is fully functional with zero API keys — critical for hackathon demos and resilience in production.

**Prisma 7 + pgBouncer split:** Runtime queries use the pooled URL (compatible with Vercel serverless concurrency). Migrations use the direct URL. This prevents connection pool exhaustion and is a non-obvious Prisma 7 requirement most tutorials don't cover.

**No dark mode:** The amber/yellow light theme was deliberately chosen to stand out in a sea of dark-mode fintech apps. Judges notice distinctive UI first. The palette is calm, warm, and readable — not clinical or aggressive.

**Mobile-first navigation:** The bottom nav exposes only the 4 most-used destinations. The "More" drawer prevents a cramped 8-item bottom bar while keeping every feature one tap away.

---

## Demo Talking Points

With the seeded account:

1. **Food overspend** — ₹3,765 spent vs ₹3,000 budget. AI chat: "should I buy biryani today?" → Finz sees the history and roasts accordingly
2. **Entertainment 2× over limit** — ₹2,147 vs ₹1,000 — shown in red on dashboard
3. **Compound interest reality check** — ₹350 biryani → ₹8.4L in 25 years at 12% CAGR (visible when logging a transaction)
4. **FIRE calculator** — at ₹2,500/month savings, retirement age is 67, not 45. FIRE delay shown in the retirement readiness banner
5. **Heatmap density** — 68 transactions over 90 days shows a visually rich heatmap with clear food-heavy weeks
6. **Goals progress** — MacBook 6%, Euro Trip 6%, Emergency Fund 40% — realistic in-progress state

---

## Team

**Vashisht 3.0 — IIITDM Kancheepuram — March 2026**

| Name | Contribution |
|---|---|
| Yashvanth S | Full-stack: Next.js architecture, database design, all API routes, AI integration, landing page, dashboard, mobile nav, auth |
| Jeeva P N | Frontend: Smart Split Modal, theme system foundations |

---

<div align="center">

Built in 36 hours by the SuperFinz team &nbsp;·&nbsp; Vashisht 3.0 &nbsp;·&nbsp; IIITDM Kancheepuram &nbsp;·&nbsp; 2026

*Because your biryani habit has a ₹8 lakh price tag.*

</div>
