# SuperFinz — CLAUDE.md

All-in-one Gen Z finance dashboard. Built for a 36-hour hackathon (Vashisht 3.0, IIITDM Kancheepuram).
Deadline: 29 March 2026, 9:00 PM.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (httpOnly cookies, bcryptjs) |
| Charts | Recharts |
| UI Primitives | Radix UI |
| Icons | Lucide React |
| Deployment | Single VPS, `localhost:3000` for dev |

No separate backend server. All API routes live under `src/app/api/`.

---

## Project Structure

```
src/
  app/
    page.tsx                  # Landing / redirect to dashboard or onboarding
    layout.tsx
    onboarding/
      page.tsx                # Multi-step onboarding flow
    dashboard/
      page.tsx                # Main dashboard
    api/
      auth/
        register/route.ts
        login/route.ts
        logout/route.ts
        me/route.ts
      transactions/
        route.ts              # GET list, POST create
        [id]/route.ts         # DELETE
      budgets/route.ts
      goals/route.ts
      ai-check/route.ts       # AI spend necessity check
      news/route.ts           # Finance news proxy
  components/
    ui/                       # Reusable primitives (Button, Card, Input, Modal)
    onboarding/               # Step components for onboarding flow
    dashboard/                # Dashboard layout, sidebar, header
    transactions/             # Transaction list, add form
    news/                     # News feed cards
    calculators/              # SIP, FD, EMI calculators with Recharts
    heatmap/                  # Spending heatmap (GitHub-style)
  lib/
    prisma.ts                 # Prisma singleton
    auth.ts                   # JWT sign/verify, password hash, getSession()
    utils.ts                  # cn(), formatCurrency(), SPENDING_CATEGORIES
  types/
    index.ts                  # Shared TypeScript types
prisma/
  schema.prisma               # DB schema
```

---

## Database Models

- **User** — email, passwordHash, name, age, userType (SCHOOL_STUDENT | COLLEGE_STUDENT | PROFESSIONAL)
- **Profile** — linked 1:1 to User. Students: institution, monthlyAllowance, incomeSources[]. Professionals: company, monthlySalary, industry. Common: monthlyBudget, savingsGoal, currency (INR default)
- **Transaction** — amount, category, description, isNecessary (bool, AI-set), aiNote (AI comment), date
- **Budget** — per category per month/year, tracks limit + spent
- **Goal** — savings goal with targetAmount, savedAmount, deadline, achieved

---

## Features to Build

### 1. Onboarding Flow (multi-step)
- Step 1: Basic info (name, email, password, age)
- Step 2: User type selection (School / College / Professional) — changes subsequent steps
- Step 3 (Student): Institution, monthly pocket money, income sources (parents/scholarship/part-time)
- Step 3 (Professional): Company, salary, industry
- Step 4: Monthly budget & savings goal setup
- After completion → redirect to `/dashboard`

### 2. AI Spend Check (`/api/ai-check`)
- User logs a transaction, hits this endpoint
- Looks at last 7 days of same category transactions
- Returns `{ isNecessary: bool, aiNote: string }` with a Gen Z friendly roast/advice
- Example: "bro you had biryani yesterday, skip today and stack 150 into your goal"
- Use rule-based logic first (frequency + budget % used), upgrade to LLM if time allows

### 3. Finance News Feed
- Proxy to a free news API (GNews or NewsData.io) filtered for finance/markets/investing
- Display as card feed with category tags
- Keep it Gen Z tone — short headlines, relevant to India

### 4. Investment Calculators
- SIP calculator: monthly investment, rate, years → maturity + chart
- FD calculator: principal, rate, tenure → maturity
- EMI calculator: loan, rate, tenure → monthly EMI + total interest
- All charts done with Recharts (line/bar)

### 5. Spending Heatmap
- GitHub contribution graph style
- Each cell = one day, color intensity = spend amount
- Last 3 months of data
- Tooltip: date + total spent + number of transactions

---

## Auth Flow

- Register → POST `/api/auth/register` → set httpOnly JWT cookie → redirect to onboarding
- Login → POST `/api/auth/login` → set httpOnly JWT cookie → redirect to dashboard
- `getSession()` reads cookie server-side for protected routes
- Middleware (`src/middleware.ts`) protects `/dashboard/*` and `/api/transactions/*` etc.

---

## UI/UX Principles (High Priority)

- **Dark mode first** — dark background (#0a0a0a or similar), neon accents (green #00ff88, purple, etc.)
- **Gen Z aesthetic** — bold typography, emoji usage in AI notes, card-based layout
- **Mobile responsive** — works on phone (students use phones more)
- **No page reloads** — use React state + fetch for all interactions
- **Fast feedback** — optimistic UI for adding transactions

---

## Dev Commands

```bash
# Install deps
npm install

# Setup DB (requires PostgreSQL running locally)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev

# Open Prisma Studio
npx prisma studio
```

---

## Environment Variables (.env)

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/superfinz?schema=public"
JWT_SECRET="superfinz-dev-secret-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"
NEWS_API_KEY="your_key_here"
```

---

## Hackathon Priorities

1. **UI quality** — judges notice this first, dark Gen Z aesthetic is the differentiator
2. **DB architecture** — clean Prisma schema, proper relations, indexes
3. **Working demo** — all 5 features must be functional end-to-end
4. **Deployment** — must be hosted and accessible via public link (VPS or Vercel)

Not priorities for hackathon: test coverage, complex error boundaries, i18n.

---

## Notes

- Currency is INR throughout, format with `formatCurrency()` from `lib/utils.ts`
- AI check is rule-based for hackathon speed — no external LLM calls needed unless time permits
- Do not use `any` types — keep TypeScript strict
- `getSession()` is async (uses `await cookies()` from next/headers)
