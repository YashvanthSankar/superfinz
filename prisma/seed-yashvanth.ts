/**
 * Seed demo data for yashvanthsankar@gmail.com
 * Run: npx tsx prisma/seed-yashvanth.ts
 *
 * IMPORTANT: Does NOT delete the user (Google OAuth account must survive).
 * Clears and recreates: profile, transactions, budgets, goals.
 *
 * Demo story:
 *   Yashvanth, 21, college student at IIITDM Kancheepuram
 *   Monthly allowance: ₹10,000 | Budget: ₹7,500 | Savings: ₹2,500/month
 *   Spends heavily on food + entertainment, 3 active goals
 *   Charts, heatmap, and FIRE all look good for demo
 */

import { PrismaClient, UserType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const EMAIL = "yashvanthsankar@gmail.com";

function daysAgo(n: number, hourOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + hourOffset + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`❌ User ${EMAIL} not found in DB. Sign in with Google once first, then re-run.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email})`);

  // Clear old data (keep the user row intact for Google OAuth)
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.profile.deleteMany({ where: { userId: user.id } });
  console.log("Cleared old transactions, budgets, goals, profile");

  // Mark onboarded + update profile
  await prisma.user.update({
    where: { id: user.id },
    data: {
      age: 21,
      userType: UserType.COLLEGE_STUDENT,
      onboarded: true,
    },
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      institution: "IIITDM Kancheepuram",
      monthlyAllowance: 10000,
      incomeSources: ["PARENTS", "PART_TIME"],
      monthlyBudget: 7500,
      savingsGoal: 2500,
      spendingPattern: "MODERATE",
      currency: "INR",
    },
  });
  console.log("Created profile");

  // ── Transactions — 90 days of realistic student spending ──────
  const transactions = [
    // ── This week ──────────────────────────────────────────────
    { description: "Zomato — Biryani House", category: "Food", amount: 340, daysBack: 0, hour: 0 },
    { description: "Auto to college", category: "Transport", amount: 45, daysBack: 0, hour: 4 },
    { description: "Starbucks — Cold coffee", category: "Food", amount: 310, daysBack: 1, hour: 2 },
    { description: "Swiggy — Burger King", category: "Food", amount: 390, daysBack: 1, hour: 6 },
    { description: "Movie — PVR Cinemas", category: "Entertainment", amount: 580, daysBack: 2, hour: 0 },
    { description: "Ola cab — night out", category: "Transport", amount: 210, daysBack: 2, hour: 8 },
    { description: "Zomato — KFC bucket", category: "Food", amount: 520, daysBack: 3, hour: 1 },
    { description: "College canteen snacks", category: "Food", amount: 75, daysBack: 3, hour: 3 },
    { description: "BGMI UC top-up", category: "Entertainment", amount: 800, daysBack: 4, hour: 0 },
    { description: "Amazon — phone stand", category: "Shopping", amount: 449, daysBack: 4, hour: 5 },
    { description: "Swiggy Instamart — Maggi, chips", category: "Food", amount: 190, daysBack: 5, hour: 2 },
    { description: "Spotify Premium", category: "Entertainment", amount: 119, daysBack: 5, hour: 0 },

    // ── Last 2 weeks ───────────────────────────────────────────
    { description: "Zomato — Hyderabadi Biryani", category: "Food", amount: 420, daysBack: 7, hour: 1 },
    { description: "Rapido bike to metro", category: "Transport", amount: 55, daysBack: 7, hour: 3 },
    { description: "Zomato — Shawarma wrap", category: "Food", amount: 210, daysBack: 8, hour: 0 },
    { description: "Netflix subscription", category: "Entertainment", amount: 149, daysBack: 9, hour: 0 },
    { description: "Swiggy — Pizza Hut", category: "Food", amount: 460, daysBack: 10, hour: 2 },
    { description: "Auto fare to station", category: "Transport", amount: 80, daysBack: 10, hour: 4 },
    { description: "Cab — airport trip", category: "Transport", amount: 490, daysBack: 11, hour: 0 },
    { description: "Zomato — Chinese fried rice", category: "Food", amount: 320, daysBack: 12, hour: 1 },
    { description: "Steam — Hades game", category: "Entertainment", amount: 599, daysBack: 13, hour: 0 },
    { description: "Swiggy — Biryani Bowl", category: "Food", amount: 290, daysBack: 14, hour: 2 },

    // ── Weeks 3–4 ──────────────────────────────────────────────
    { description: "Flipkart — earphones", category: "Shopping", amount: 1299, daysBack: 16, hour: 0 },
    { description: "Zomato — North Indian thali", category: "Food", amount: 280, daysBack: 17, hour: 1 },
    { description: "College fest pass", category: "Entertainment", amount: 500, daysBack: 18, hour: 0 },
    { description: "Swiggy — Rolls corner", category: "Food", amount: 220, daysBack: 19, hour: 2 },
    { description: "Ola cab — late night", category: "Transport", amount: 330, daysBack: 20, hour: 7 },
    { description: "Zomato — Dosa & filter coffee", category: "Food", amount: 160, daysBack: 21, hour: 0 },
    { description: "Amazon Prime", category: "Entertainment", amount: 179, daysBack: 22, hour: 0 },
    { description: "Zomato — Burger + fries", category: "Food", amount: 370, daysBack: 23, hour: 3 },
    { description: "Rapido to college", category: "Transport", amount: 40, daysBack: 24, hour: 1 },
    { description: "Swiggy — Noodles", category: "Food", amount: 240, daysBack: 25, hour: 2 },

    // ── Month 2 (days 30–60) ───────────────────────────────────
    { description: "Hostel rent share", category: "Rent", amount: 3000, daysBack: 30, hour: 0 },
    { description: "Zomato — Biriyani Palace", category: "Food", amount: 380, daysBack: 31, hour: 1 },
    { description: "Swiggy — Dominos", category: "Food", amount: 420, daysBack: 33, hour: 2 },
    { description: "Auto fare", category: "Transport", amount: 60, daysBack: 34, hour: 3 },
    { description: "NPTEL course books", category: "Education", amount: 750, daysBack: 35, hour: 0 },
    { description: "Zomato — Mughlai platter", category: "Food", amount: 350, daysBack: 36, hour: 1 },
    { description: "Zepto — groceries", category: "Food", amount: 285, daysBack: 37, hour: 2 },
    { description: "Cab — hackathon travel", category: "Transport", amount: 540, daysBack: 38, hour: 0 },
    { description: "Swiggy — Pasta bowl", category: "Food", amount: 250, daysBack: 40, hour: 1 },
    { description: "Zomato — Tandoori platter", category: "Food", amount: 410, daysBack: 42, hour: 2 },
    { description: "Amazon — desk lamp", category: "Shopping", amount: 799, daysBack: 43, hour: 0 },
    { description: "Steam — game DLC", category: "Entertainment", amount: 399, daysBack: 45, hour: 0 },
    { description: "Swiggy — Biryani", category: "Food", amount: 310, daysBack: 47, hour: 1 },
    { description: "Rapido commute", category: "Transport", amount: 50, daysBack: 48, hour: 2 },
    { description: "Zomato — Cheese burst pizza", category: "Food", amount: 450, daysBack: 50, hour: 3 },
    { description: "Health checkup", category: "Health", amount: 600, daysBack: 52, hour: 0 },
    { description: "Swiggy — Dosa", category: "Food", amount: 140, daysBack: 54, hour: 1 },
    { description: "Ola cab", category: "Transport", amount: 160, daysBack: 55, hour: 2 },

    // ── Month 3 (days 60–90) ───────────────────────────────────
    { description: "Hostel rent share", category: "Rent", amount: 3000, daysBack: 60, hour: 0 },
    { description: "Zomato — Biryani combo", category: "Food", amount: 360, daysBack: 62, hour: 1 },
    { description: "Swiggy — Fried chicken", category: "Food", amount: 290, daysBack: 64, hour: 2 },
    { description: "SRM University fest trip", category: "Entertainment", amount: 700, daysBack: 65, hour: 0 },
    { description: "Zomato — Dal makhani", category: "Food", amount: 220, daysBack: 67, hour: 1 },
    { description: "Auto fare", category: "Transport", amount: 65, daysBack: 68, hour: 2 },
    { description: "Coursera subscription", category: "Education", amount: 400, daysBack: 70, hour: 0 },
    { description: "Swiggy — Rolls wrap", category: "Food", amount: 195, daysBack: 72, hour: 1 },
    { description: "Zepto — instant noodles, juice", category: "Food", amount: 220, daysBack: 74, hour: 2 },
    { description: "Zomato — Chicken burger", category: "Food", amount: 330, daysBack: 76, hour: 3 },
    { description: "Cab — weekend trip", category: "Transport", amount: 280, daysBack: 78, hour: 0 },
    { description: "Flipkart — t-shirt", category: "Shopping", amount: 499, daysBack: 80, hour: 0 },
    { description: "Swiggy — Pizza", category: "Food", amount: 380, daysBack: 82, hour: 1 },
    { description: "Amazon — stationery", category: "Shopping", amount: 350, daysBack: 84, hour: 0 },
    { description: "Zomato — Paneer tikka", category: "Food", amount: 270, daysBack: 86, hour: 1 },
    { description: "Rapido commute", category: "Transport", amount: 48, daysBack: 87, hour: 2 },
    { description: "Doctor visit — fever", category: "Health", amount: 400, daysBack: 89, hour: 0 },
    { description: "Swiggy — Comfort food combo", category: "Food", amount: 310, daysBack: 90, hour: 1 },
  ];

  let created = 0;
  for (const tx of transactions) {
    const isNecessary = ["Rent", "Education", "Health"].includes(tx.category)
      ? true
      : tx.amount < 100
      ? true
      : tx.category === "Food" && tx.amount > 300
      ? false
      : tx.category === "Entertainment"
      ? false
      : null;

    const aiNote =
      tx.category === "Food" && tx.amount > 300
        ? `₹${tx.amount} on food — in 25 yrs that's ₹${Math.round(tx.amount * Math.pow(1.12, 25)).toLocaleString("en-IN")} if invested in NIFTY 50 🌱`
        : tx.category === "Entertainment" && tx.amount > 400
        ? `entertainment spend alert! ₹${tx.amount} here adds up fast — your budget is watching 👀`
        : null;

    await prisma.transaction.create({
      data: {
        userId: user.id,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        date: daysAgo(tx.daysBack, tx.hour),
        isNecessary,
        aiNote,
      },
    });
    created++;
  }
  console.log(`Created ${created} transactions`);

  // ── Goals ─────────────────────────────────────────────────────
  const now = new Date();
  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        title: "MacBook Air M3",
        targetAmount: 120000,
        savedAmount: 7500,
        deadline: new Date(now.getFullYear() + 1, 5, 30), // June next year
      },
      {
        userId: user.id,
        title: "Euro Trip 2027",
        targetAmount: 80000,
        savedAmount: 5000,
        deadline: new Date(2027, 3, 15), // April 2027
      },
      {
        userId: user.id,
        title: "Emergency Fund",
        targetAmount: 30000,
        savedAmount: 12000,
      },
      {
        userId: user.id,
        title: "Freedom Fund (FIRE)",
        targetAmount: 30000000, // ₹3 Cr at ₹10k/month expenses
        savedAmount: 0,
      },
    ],
  });
  console.log("Created 4 goals");

  // ── Budgets (current month) ───────────────────────────────────
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: "Food",          limit: 3000, spent: 3765, month, year },
      { userId: user.id, category: "Entertainment", limit: 1000, spent: 2147, month, year },
      { userId: user.id, category: "Transport",     limit: 600,  spent: 745,  month, year },
      { userId: user.id, category: "Shopping",      limit: 1500, spent: 1748, month, year },
      { userId: user.id, category: "Health",        limit: 500,  spent: 600,  month, year },
    ],
  });
  console.log("Created budgets");

  console.log("\n✅ Seed complete for", EMAIL);
  console.log("\nDemo talking points:");
  console.log("- Spent ₹3,765 on food this month vs ₹3,000 budget (125% over)");
  console.log("- Entertainment ₹2,147 vs ₹1,000 limit — 2× over");
  console.log("- Zomato/Swiggy orders: 30+ times in 90 days");
  console.log("- FIRE calc: at ₹2,500/month savings, freedom corpus gap is massive");
  console.log("- Heatmap shows dense activity every week with clear food-heavy days");
  console.log("- 3 goals with progress: MacBook (6%), Euro Trip (6%), Emergency Fund (40%)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
