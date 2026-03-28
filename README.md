<div align="center">

# superfinz

### The all-in-one Gen Z personal finance dashboard

*Built for Vashisht 3.0 · IIITDM Kancheepuram · March 2026*

---

**Next.js 16** &nbsp;·&nbsp; **React 19** &nbsp;·&nbsp; **Prisma 7** &nbsp;·&nbsp; **Supabase** &nbsp;·&nbsp; **OpenRouter AI** &nbsp;·&nbsp; **Tailwind CSS v4**

</div>

---

## What Is SuperFinz?

SuperFinz is a full-stack personal finance web application designed specifically for Indian students and young professionals. It combines real-time expense tracking, AI-powered spend analysis, retirement planning, investment calculators, and a financial education hub — all in a single, mobile-first dashboard.

Built entirely in **36 hours** for **Vashisht 3.0**, the national-level technical fest at **IIITDM Kancheepuram**.

---

## Core Features

### 1. Smart Onboarding

A 4-step adaptive onboarding wizard that tailors the entire app experience to the user's financial profile:

- **Step 1 — Identity**: Age and user type (School Student / College Student / Working Professional)
- **Step 2 — Financial Details**: Conditionally renders student fields (institution, monthly allowance, income sources: Parents / Scholarship / Part-time) or professional fields (company, salary, industry)
- **Step 3 — Spending Habit**: User selects their natural spending pattern — `FRONT_HEAVY` (month-start spender), `BALANCED`, or `CONSERVATIVE` (month-end spender). This directly drives the intelligent weekly budget allocation algorithm on the dashboard.
- **Step 4 — Set Limits**: Monthly budget + savings goal, with auto-budget fill (`budget = income − savingsGoal`) and a live **Monthly Money Plan** validation card that prevents impossible plans (budget + savings > income).

On completion, `onboarded: true` is set and the session is refreshed.

---

### 2. AI Spend Analysis (`/api/ai-check`)

Every transaction logged is immediately analysed by a two-tier system:

**Tier 1 — Rule Engine** (always runs first):
- Categories `Rent`, `Utilities`, `Health`, `Education`, `Transport` are always marked necessary
- If a budget exists: necessary when `usedPct ≤ 80%` AND fewer than 2 similar transactions in the past 7 days
- If no budget: necessary only on the first transaction in that category that week

**Tier 2 — LLM Roast** (fires when rule engine flags unnecessary):
- Calls **OpenRouter** → `google/gemma-3-27b-it:free` (max 80 tokens, temperature 0.8)
- System prompt includes category context, 7-day spend history, budget utilisation %, and Gen Z tone instructions
- If API call fails or key is absent: falls back to a rich pool of templated roasts per category (Food, Entertainment, Shopping, Transport), each with dynamic variables `{amount}`, `{prev}`, `{weekSpend}`, `{time}`

Result: each transaction gets `isNecessary: boolean` + `aiNote` — a one-liner roast or validation shown inline.

---

### 3. Finz — AI Financial Chat

A floating chat panel powered by **OpenRouter** with full financial context injected per message:

**Context injected:**
- User profile (name, type, age, budget, income, savings goal)
- Month spend stats (total, % of budget, remaining budget)
- FIRE target and retirement projection (corpus needed, projected corpus at 12% CAGR)
- Last 25 transactions with relative date labels ("today", "yesterday", "12 Mar")
- Up to 5 active savings goals

**Model cascade** (tries in order, 12s timeout each):
1. `google/gemma-3-27b-it:free`
2. `google/gemma-3-12b-it:free`
3. `google/gemma-3-4b-it:free`
4. `liquid/lfm-2.5-1.2b-instruct:free`

**Local fallback** (`smartFallback()`): keyword-matches the message (food / shopping / budget / savings / goals) and generates a context-aware reply from real transaction data — zero API calls.

---

### 4. Dashboard Overview

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

`fireDelayMonths = round(unnecessarySpend / monthlySip)` — how many retirement months are being lost to wasteful spending.

---

### 5. Retirement Planner

Interactive calculator with real-time projections and a live corpus growth chart:

```
inflatedExpenses = monthlyExpenses × 12 × (1 + inflation)^yearsLeft
fireCorpus       = inflatedExpenses × 25              // inflation-adjusted target
projCorpus       = FV_existing + FV_SIP
sipNeeded        = (corpus − FV_existing) × r / ((1+r)^n − 1)
monthlyPassive   = projCorpus × 0.04 / 12             // 4% safe withdrawal
```

All inputs adjustable via sliders: current age, target retirement age, monthly SIP, monthly expenses, existing savings, expected return (6–18% CAGR), inflation (3–10%).

Gap plan: when off-track, calculates exact SIP increase and converts it to concrete actions ("skip X food orders/month to cover it").

---

### 6. Investment Calculators

Three calculators with live **Recharts** area chart visualisations:

**SIP (Systematic Investment Plan)**
```
maturity = monthly × ((1+r)^n − 1) / r × (1+r)    // annuity due
r = annualRate / 1200,  n = years × 12
```

**Fixed Deposit** — quarterly compounding:
```
maturity = principal × (1 + rate/400)^(4 × years)
```

**EMI (Equated Monthly Instalment)**:
```
EMI = P × r × (1+r)^n / ((1+r)^n − 1)
r = annualRate / 1200,  n = years × 12
```

---

### 7. Spending Heatmap

GitHub contribution graph–style calendar for 3 months of spending:

- 7-column Sunday-to-Saturday grid with month labels
- 5 amber intensity levels: `#fef9c3` → `amber-100` → `amber-200` → `amber-400` → `amber-600`
- Intensity = `ceil((dayAmount / maxDayAmount) × 4)`
- Hover tooltip: date, total spent, transaction count
- Stats bar: 3-month total, active spend days, average per active day

---

### 8. Financial Education Hub

**12 hand-written articles** across 4 categories — fully searchable and filterable:

| Category | Articles |
|---|---|
| Basics | Budgeting 101 (50/30/20 rule), Why Your Money Loses Value, The Magic of Compounding + Rule of 72, Emergency Fund First |
| Investing | What is a SIP?, What is NIFTY 50?, What is CAGR?, FD vs Stocks vs Mutual Funds |
| Retirement | What is FIRE?, The 4% Rule, Why Start Investing at 21 |
| Advanced | Asset Allocation |

Article pages are **server-rendered** (static, no client JS). Each ends with an "Apply in SuperFinz" action box.

**FinTip Tooltips:** 10 financial terms (SIP, CAGR, FIRE, NIFTY 50, corpus, 4% rule, inflation, compounding, index fund, 25x rule) have inline `?` buttons throughout the app — hover for a definition + link to the full article. Financial education embedded directly into the UX, not hidden in a separate section.

---

### 9. Goals Tracker

- Create goals with title, target, optional deadline
- Quick-add: +₹500 / +₹1,000 / +₹5,000 per goal
- Progress bar with %, saved amount, remaining
- **Embedded FIRE Calculator**: auto-fills from profile, computes corpus = `expenses × 12 × 25`, estimates retirement age by iterating SIP future value monthly (up to 50 years, 12% CAGR)
- "Add as savings goal" creates a Freedom Fund pre-filled with your FIRE corpus

---

### 10. Finance News Feed

- Proxies **newsdata.io** filtered for `finance+investing+money` in India, English, business category
- 30-minute Next.js cache revalidation (`next: { revalidate: 1800 }`)
- 6 colour-coded category tags: Banking, Markets, Fintech, Personal Finance, Gen Z Finance, Tax
- Full mock fallback (6 curated articles) when API key is absent

---

## Technical Architecture

### Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.1 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | ^7.6.0 |
| DB Driver | `@prisma/adapter-pg` | ^7.6.0 |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.30 |
| Charts | Recharts | ^3.8.1 |
| Icons | Lucide React | ^1.7.0 |
| UI Primitives | Radix UI (Dialog, Dropdown, Progress, Tabs) | various |
| Validation | Zod | ^4.3.6 |
| Date Utils | date-fns | ^4.1.0 |
| AI | OpenRouter (Gemma 3 27B) | — |
| Deployment | Vercel + Supabase | — |

### Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing (animated stats, feature grid, AI demo)
│   ├── login/page.tsx                # Google OAuth sign-in
│   ├── onboarding/page.tsx           # 4-step adaptive wizard
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar + Finz Chat + Breadcrumbs
│   │   ├── page.tsx                  # Overview — Server Component, all math server-side
│   │   ├── transactions/page.tsx     # Expense log + AI check + compound interest callout
│   │   ├── retirement/page.tsx       # Full retirement planner with corpus chart
│   │   ├── goals/page.tsx            # Goals + embedded FIRE calculator
│   │   ├── heatmap/page.tsx          # GitHub-style spending calendar
│   │   ├── calculators/page.tsx      # SIP / FD / EMI calculators
│   │   ├── news/page.tsx             # Finance news feed
│   │   ├── profile/page.tsx          # Profile management
│   │   └── learn/
│   │       ├── page.tsx              # Hub — search + filter by category
│   │       └── [articleId]/page.tsx  # Article detail — Server Component
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth handler
│       ├── transactions/             # GET list, POST create, DELETE [id]
│       ├── goals/                    # GET, POST, PATCH
│       ├── budgets/                  # GET, POST (upsert)
│       ├── ai-check/                 # Necessity analysis + LLM roast
│       ├── chat/                     # Finz AI with full context injection
│       ├── news/                     # newsdata.io proxy with mock fallback
│       ├── heatmap/                  # 90-day grouped spend data
│       └── profile/                  # GET, PATCH, POST /complete
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx               # Responsive nav (desktop sidebar + mobile top+bottom bar)
│   │   ├── chat.tsx                  # Finz floating chat panel
│   │   ├── charts.tsx                # SpendTrendChart + CategoryChart (Recharts)
│   │   ├── grid-widgets.tsx          # Money Spent + Money Saved widgets (week/month toggle)
│   │   ├── breadcrumbs.tsx           # Route-aware breadcrumbs with article title resolution
│   │   └── heatmap-inline.tsx        # Compact column-per-week heatmap
│   └── ui/
│       ├── button.tsx                # 5 variants, loading state, forwardRef
│       ├── card.tsx                  # Standard card shell
│       ├── fin-tip.tsx               # 10-term inline financial tooltip system
│       ├── input.tsx                 # Labelled input with error state
│       ├── select.tsx                # Labelled select
│       └── logo.tsx                  # SuperFinz logo (3 sizes)
├── lib/
│   ├── auth.ts                       # getSession() with DB email fallback
│   ├── prisma.ts                     # Singleton PrismaClient with PrismaPg adapter
│   ├── utils.ts                      # cn(), formatCurrency(), SPENDING_CATEGORIES
│   ├── finance.ts                    # summarizeFinancePlan(), financePlanError()
│   └── learn-content.ts              # 12 full-text financial education articles
├── types/
│   ├── index.ts                      # Shared TypeScript types
│   └── next-auth.d.ts                # Session type augmentation (id, onboarded)
├── auth.ts                           # NextAuth v5 config (Google, JWT, DB upsert callbacks)
└── proxy.ts                          # Route protection middleware
prisma/
├── schema.prisma                     # 5 models, 2 enums, 1 composite index
├── migrations/                       # 3 tracked migrations
└── seed-demo.ts                      # 47 transactions, 3 goals, 3 budgets
prisma.config.ts                      # Prisma 7 config (DIRECT_URL for migrations)
```

### Database Schema

```prisma
enum UserType     { SCHOOL_STUDENT | COLLEGE_STUDENT | PROFESSIONAL }
enum IncomeSource { PARENTS | SCHOLARSHIP | PART_TIME | SALARY | FREELANCE | OTHER }

model User {
  id, email (unique), googleId (unique), avatar, name, age, userType, onboarded
  → profile, transactions[], budgets[], goals[]
}

model Profile {
  // Students:      institution, monthlyAllowance, incomeSources[]
  // Professionals: company, monthlySalary, industry
  // Common:        monthlyBudget, savingsGoal, currency, spendingPattern, cycleStartDate
}

model Transaction {
  amount, category, description, date
  isNecessary Boolean?    // set by AI check rule engine or LLM
  aiNote      String?     // AI-generated comment or roast
  @@index([userId, date])
}

model Budget { category, limit, month, year, spent | @@unique([userId, category, month, year]) }
model Goal   { title, targetAmount, savedAmount, deadline, achieved }
```

**3 tracked migrations:**
1. `20260328124403_init` — full schema
2. `20260328151108_add_spending_pattern` — `spendingPattern` on Profile
3. `20260328165638_add_cycle_start_date` — `cycleStartDate` on Profile

### Auth Flow

```
User → "Continue with Google"
  → NextAuth signIn callback: prisma.user.upsert by googleId (create or update)
  → NextAuth jwt callback: DB lookup by email → stores userId + onboarded in JWT
  → NextAuth session callback: attaches id + onboarded to session.user
  → Server components: getSession() = auth() + fresh DB lookup with email fallback
  → Middleware (proxy.ts): protects /dashboard/** and /onboarding
```

### Prisma 7 + Supabase Connection Strategy

Prisma 7 removed URL config from `schema.prisma`. Two separate connections:

- **`prisma.config.ts`** → `DIRECT_URL` (port 5432, no pooler) — used for `prisma db push` and migrations
- **`src/lib/prisma.ts`** → `DATABASE_URL` (port 6543, pgBouncer, `?pgbouncer=true`) via `PrismaPg` adapter — used for all runtime queries, compatible with Vercel's serverless concurrency model

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List transactions (paginated, optional month/year filter) |
| `POST` | `/api/transactions` | Create transaction + auto-increment Budget `spent` |
| `DELETE` | `/api/transactions/[id]` | Delete + reverse Budget `spent` decrement |
| `POST` | `/api/ai-check` | Necessity analysis + LLM roast generation |
| `POST` | `/api/chat` | Finz AI chat with full financial context |
| `GET` | `/api/goals` | List all goals |
| `POST` | `/api/goals` | Create goal |
| `PATCH` | `/api/goals` | Update savedAmount or mark achieved |
| `GET` | `/api/budgets` | List budgets for month/year |
| `POST` | `/api/budgets` | Upsert budget by category/month/year |
| `GET` | `/api/news` | Finance news (live newsdata.io or mock fallback) |
| `GET` | `/api/heatmap` | 90-day spend data grouped by date |
| `GET` | `/api/profile` | Get user + profile |
| `PATCH` | `/api/profile` | Update profile fields (validates financial plan) |
| `POST` | `/api/profile/complete` | Finalise onboarding, set `onboarded: true` |

---

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (local) or Supabase project

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/db"
AUTH_SECRET="your-secret-min-32-chars"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEWS_API_KEY="your-newsdata-io-key"       # optional — falls back to mock articles
OPENROUTER_API_KEY="your-openrouter-key"  # optional — falls back to rule-based logic
```

### Run Locally

```bash
npm install
npx prisma db push
npx prisma generate
npm run dev
```

### Deploy to Vercel

1. Push repo to GitHub and import into Vercel
2. Add all environment variables in Vercel project settings
3. Change `AUTH_URL` to your Vercel deployment URL
4. Add `https://your-app.vercel.app/api/auth/callback/google` to Google OAuth authorised redirect URIs

---

## Design System

A single warm amber/cream palette — chosen to feel calm and premium, countering the anxiety typically associated with personal finance:

| Token | Hex | Usage |
|---|---|---|
| Page + card background | `#fefce8` | All card bg, page bg |
| Primary text / headings | `#713f12` | All headings, primary labels |
| Secondary text | `#b45309` | Subheadings, captions |
| Micro text | `#92400e` | Icon containers, smallest labels |
| Card border | `amber-400` | All card and input borders |
| Inner tracks | `amber-100` | Progress bars, icon bg, inner rings |
| Hover state | `#fef9c3` | Hover bg, input fills |
| Success state | `emerald-*` | Under budget, on track, necessary |
| Warning state | `red-*` | Over budget, at risk, unnecessary |

Typography: **Geist Sans** (variable font) throughout, **Geist Mono** for numeric contexts. Both loaded via `next/font/google` — zero layout shift.

---

## Demo Seed Data

`prisma/seed-demo.ts` creates a complete demo user to show off every feature:

- **Rohan Kumar**, 21, College Student, NIT Trichy
- Monthly allowance ₹8,000 | Budget ₹5,000 | Savings goal ₹3,000
- **47 transactions** over 60 days: Zomato, Swiggy, PVR, Amazon, metro, textbooks
- Food budget: ₹3,000 limit / ₹4,120 spent — demonstrates overspend detection and AI roasts
- **3 goals**: MacBook Pro (₹1.2L), Manali Trip (₹15K), Freedom Fund (₹4.5Cr FIRE target)
- Talking point embedded in seed comments: Rohan's ₹1,200/month food delivery habit = **₹1.2 crore by age 46** if invested in NIFTY 50 at 12% CAGR

---

## Key Design Decisions

**Server-first overview:** The main dashboard is a React Server Component. All financial calculations — retirement score, budget pacing, auto-save, trend data, category aggregation — run on the server. The page renders complete with no `useEffect`, no loading spinners, no hydration flicker.

**Spending pattern as a first-class concept:** Rather than a fixed monthly budget divided evenly, SuperFinz models how people actually spend. The pattern selected at onboarding drives the weekly budget distribution and auto-save calculation throughout the entire month, making the numbers feel personal.

**Auto-save, not manual saving:** The "Money Saved" widget calculates savings automatically from under-budget completed weeks. The number feels earned, not entered.

**Education in context:** FinTip `?` tooltips appear inline next to unfamiliar terms like "corpus" and "FIRE delay" — not buried in a help section. Users learn the terminology in the exact moment they encounter it.

**Full offline-capable fallbacks:** Every external API (OpenRouter, newsdata.io) has a complete local fallback. The app is fully functional with zero API keys — critical for hackathon demos and for resilience in production.

**Prisma 7 + pgBouncer split:** Runtime queries use the pooled URL (compatible with Vercel serverless). Migrations use the direct URL. This is a non-obvious Prisma 7 requirement that most tutorials don't cover — getting it right means zero connection pool exhaustion under concurrent load.

---

## Hackathon

- **Event**: Vashisht 3.0 — National Technical Festival
- **Host**: IIITDM Kancheepuram
- **Duration**: 36 hours
- **Track**: FinTech / Product Development
- **Deadline**: 29 March 2026, 9:00 PM IST

---

<div align="center">

Built with intent by the SuperFinz team &nbsp;·&nbsp; Vashisht 3.0 &nbsp;·&nbsp; 2026

</div>
