/**
 * Demo seed — creates Rohan's account for hackathon demo
 * Run: npx tsx prisma/seed-demo.ts
 *
 * Demo story:
 *   Rohan, 21, college student at NIT Trichy
 *   Monthly allowance: ₹8,000 | Budget: ₹6,000 | Savings goal: ₹2,000/month
 *   Problem: spends ₹600/day on food, orders Zomato 4x/week
 *   The app shows: this habit costs him ₹1.2 crore by age 45
 */

import { PrismaClient, UserType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const EMAIL = "rohan.demo@superfinz.app";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12 + Math.floor(Math.random() * 8), 0, 0, 0);
  return d;
}

async function main() {
  // Clean up existing demo user
  await prisma.user.deleteMany({ where: { email: EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: "Rohan Kumar",
      age: 21,
      userType: UserType.COLLEGE_STUDENT,
      onboarded: true,
      profile: {
        create: {
          institution: "NIT Trichy",
          monthlyAllowance: 8000,
          incomeSources: ["PARENTS"],
          monthlyBudget: 6000,
          savingsGoal: 2000,
          currency: "INR",
        },
      },
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Transactions — last 60 days, heavy food + entertainment
  const transactions = [
    // This week — food heavy
    { description: "Biryani at Murugan Idli Shop", category: "Food", amount: 180, date: daysAgo(0) },
    { description: "Swiggy order — Dominos", category: "Food", amount: 420, date: daysAgo(0) },
    { description: "Zomato — Biryani House", category: "Food", amount: 350, date: daysAgo(1) },
    { description: "Auto to college", category: "Transport", amount: 60, date: daysAgo(1) },
    { description: "Starbucks coffee", category: "Food", amount: 280, date: daysAgo(2) },
    { description: "Zomato — Burger King", category: "Food", amount: 380, date: daysAgo(2) },
    { description: "Movie tickets — PVR", category: "Entertainment", amount: 600, date: daysAgo(3) },
    { description: "Cab — late night", category: "Transport", amount: 220, date: daysAgo(3) },
    { description: "Zomato — KFC bucket", category: "Food", amount: 520, date: daysAgo(4) },
    { description: "Chips and cola — canteen", category: "Food", amount: 80, date: daysAgo(4) },
    { description: "Spotify Premium", category: "Entertainment", amount: 119, date: daysAgo(5) },
    { description: "Amazon — phone case", category: "Shopping", amount: 299, date: daysAgo(5) },

    // Last 2 weeks
    { description: "Zomato — Biryani", category: "Food", amount: 320, date: daysAgo(7) },
    { description: "Ola cab to station", category: "Transport", amount: 180, date: daysAgo(7) },
    { description: "Zomato — Pizza Hut", category: "Food", amount: 460, date: daysAgo(8) },
    { description: "Netflix subscription", category: "Entertainment", amount: 149, date: daysAgo(9) },
    { description: "Swiggy Instamart — snacks", category: "Food", amount: 240, date: daysAgo(10) },
    { description: "College canteen", category: "Food", amount: 95, date: daysAgo(10) },
    { description: "Cab home from party", category: "Transport", amount: 340, date: daysAgo(11) },
    { description: "Zomato — Chinese", category: "Food", amount: 380, date: daysAgo(12) },
    { description: "BGMI UC purchase", category: "Entertainment", amount: 800, date: daysAgo(13) },
    { description: "Swiggy — Biryani Bowl", category: "Food", amount: 290, date: daysAgo(14) },

    // Week 3-4
    { description: "Zomato — Burger", category: "Food", amount: 340, date: daysAgo(16) },
    { description: "Auto fare", category: "Transport", amount: 70, date: daysAgo(16) },
    { description: "Zomato — Hyderabadi Biryani", category: "Food", amount: 410, date: daysAgo(17) },
    { description: "Flipkart — earphones", category: "Shopping", amount: 1299, date: daysAgo(18) },
    { description: "Swiggy — Rolls", category: "Food", amount: 220, date: daysAgo(19) },
    { description: "Cab — airport drop friend", category: "Transport", amount: 480, date: daysAgo(20) },
    { description: "Zomato — Thali", category: "Food", amount: 260, date: daysAgo(21) },
    { description: "Steam game purchase", category: "Entertainment", amount: 599, date: daysAgo(22) },
    { description: "Zomato — Shawarma", category: "Food", amount: 180, date: daysAgo(23) },
    { description: "College fest pass", category: "Entertainment", amount: 500, date: daysAgo(24) },

    // Older transactions
    { description: "Zomato — Pizza", category: "Food", amount: 400, date: daysAgo(28) },
    { description: "Swiggy — Biryani", category: "Food", amount: 350, date: daysAgo(30) },
    { description: "Rent share", category: "Rent", amount: 2500, date: daysAgo(30) },
    { description: "Zomato — Chinese food", category: "Food", amount: 320, date: daysAgo(32) },
    { description: "Books — Amazon", category: "Education", amount: 650, date: daysAgo(33) },
    { description: "Swiggy — Fried rice", category: "Food", amount: 280, date: daysAgo(35) },
    { description: "Cab — night out", category: "Transport", amount: 260, date: daysAgo(36) },
    { description: "Zomato — Biryani", category: "Food", amount: 340, date: daysAgo(38) },
    { description: "Rent share", category: "Rent", amount: 2500, date: daysAgo(60) },
    { description: "Zomato — Burger", category: "Food", amount: 300, date: daysAgo(42) },
    { description: "Swiggy — Dosa", category: "Food", amount: 160, date: daysAgo(44) },
    { description: "Ola cab", category: "Transport", amount: 150, date: daysAgo(45) },
    { description: "Zomato — North Indian", category: "Food", amount: 390, date: daysAgo(47) },
    { description: "Amazon Prime", category: "Entertainment", amount: 179, date: daysAgo(50) },
    { description: "Swiggy — Pasta", category: "Food", amount: 240, date: daysAgo(52) },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        isNecessary: ["Rent", "Education"].includes(tx.category) ? true : tx.amount < 100 ? true : false,
        aiNote: tx.category === "Food" && tx.amount > 300
          ? `₹${tx.amount} on food — in 25 yrs that's ₹${Math.round(tx.amount * Math.pow(1.12, 25)).toLocaleString("en-IN")} if invested`
          : null,
      },
    });
  }

  console.log(`Created ${transactions.length} transactions`);

  // Goals
  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        title: "MacBook Air M3",
        targetAmount: 120000,
        savedAmount: 4500,
        deadline: new Date("2026-12-31"),
      },
      {
        userId: user.id,
        title: "Trip to Manali",
        targetAmount: 15000,
        savedAmount: 2000,
        deadline: new Date("2026-06-30"),
      },
      {
        userId: user.id,
        title: "Freedom Fund (FIRE)",
        targetAmount: 45000000, // ₹4.5 Cr at ₹15k/month expenses
        savedAmount: 0,
      },
    ],
  });

  console.log("Created 3 goals");

  // Budget for current month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: "Food", limit: 3000, spent: 4120, month, year },
      { userId: user.id, category: "Entertainment", limit: 800, spent: 2167, month, year },
      { userId: user.id, category: "Transport", limit: 500, spent: 620, month, year },
      { userId: user.id, category: "Shopping", limit: 1000, spent: 1598, month, year },
    ],
  });

  console.log("Created budgets");
  console.log("\n✅ Demo seed complete!");
  console.log(`\nLogin: ${EMAIL}`);
  console.log("(No password — use Google OAuth or add a googleId to this account)");
  console.log("\nDemo talking points:");
  console.log("- Rohan spent ₹4,120 on food alone this month (budget: ₹3,000)");
  console.log("- He's ordered Zomato/Swiggy 20+ times in 60 days");
  console.log("- His ₹400 biryani habit = ₹8.2L by age 46 if invested");
  console.log("- FIRE calc: at ₹2k/month savings, he retires at 67 (not 45)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
