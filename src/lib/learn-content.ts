export type Category = "Basics" | "Investing" | "Retirement" | "Advanced";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Section = {
  heading?: string;
  body: string;
};

export type Article = {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  readMins: number;
  level: Level;
  content: Section[];
  applyText: string;
};

export const LEARN_CATEGORIES = ["All", "Basics", "Investing", "Retirement", "Advanced"] as const;

export const LEARN_ARTICLES: Article[] = [
  {
    id: "budgeting-101",
    title: "Budgeting 101",
    subtitle: "The 50/30/20 rule - the simplest money system ever",
    category: "Basics",
    readMins: 3,
    level: "Beginner",
    applyText: "Set your monthly budget in Profile and update it to match the 50/30/20 rule.",
    content: [
      {
        body: "Most people think budgeting means writing every rupee in a notebook. It doesn't. Budgeting is just deciding where your money goes before it disappears.",
      },
      {
        heading: "The 50/30/20 rule",
        body: "Split every rupee you earn into 3 buckets:\n\n50% Needs - rent, food, transport, phone\n30% Wants - eating out, Netflix, clothes, travel\n20% Savings/Investments - SIP, FD, emergency fund\n\nIf you earn INR 10,000 a month: INR 5,000 on needs, INR 3,000 on wants, INR 2,000 saved.",
      },
      {
        heading: "Why most people fail at this",
        body: "They flip it. They spend first, save what's left. There's never anything left. The fix: the moment money comes in, move 20% to savings immediately. Spend from whatever remains.",
      },
      {
        heading: "In SuperFinz",
        body: "Set your monthly budget in your profile. The dashboard tracks which bucket you're overspending. If food is eating into your savings - you'll see it immediately.",
      },
    ],
  },
  {
    id: "inflation",
    title: "Why Your Money Loses Value",
    subtitle: "Inflation - the silent tax on your savings",
    category: "Basics",
    readMins: 3,
    level: "Beginner",
    applyText: "Track your spending in Transactions to see where you can cut and invest the difference.",
    content: [
      {
        body: "Imagine you put INR 1,00,000 in a locker today. In 10 years, you open it - still INR 1,00,000. Feels safe. But that amount will only buy what roughly INR 57,000 buys today. You lost purchasing power by doing nothing.",
      },
      {
        heading: "What is inflation?",
        body: "Inflation is the rise in prices over time. India's average inflation is around 6% per year. Something that costs INR 100 today costs INR 106 next year, INR 179 in 10 years, INR 321 in 20 years.",
      },
      {
        heading: "The savings account trap",
        body: "Most savings accounts give 3-4% interest. Inflation is often around 6%. You're losing real value each year. Keeping money in a savings account long-term is slow financial erosion.",
      },
      {
        heading: "The solution",
        body: "Your money needs to grow faster than inflation. NIFTY 50 index funds have historically returned around 12% CAGR, which is materially above inflation over long periods.",
      },
    ],
  },
  {
    id: "compound-interest",
    title: "The Magic of Compounding",
    subtitle: "Why starting early beats starting big",
    category: "Basics",
    readMins: 4,
    level: "Beginner",
    applyText: "Open the Retirement Planner to see compounding work on your own numbers in real time.",
    content: [
      { body: "Compounding is when your money makes money, and then that money makes more money. The numbers seem impossible until you run them." },
      {
        heading: "Simple vs compound",
        body: "Simple interest: INR 10,000 at 10% = INR 1,000/year, every year.\nCompound interest: INR 10,000 at 10% = INR 1,000 in year 1, INR 1,100 in year 2, INR 1,210 in year 3, because the interest earns interest.",
      },
      {
        heading: "Start at 21, not 31",
        body: "Even if someone invests less total money, starting earlier can still create a bigger corpus because time amplifies compounding.",
      },
      {
        heading: "The rule of 72",
        body: "Divide 72 by your return rate to estimate doubling time.\n72 / 12 = 6 years at 12% CAGR.\n72 / 4 = 18 years at 4%.",
      },
    ],
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund First",
    subtitle: "Before you invest a single rupee, do this",
    category: "Basics",
    readMins: 2,
    level: "Beginner",
    applyText: "Reduce discretionary spending this month and park the savings in a liquid fund.",
    content: [
      {
        body: "Before SIPs and stocks, build an emergency fund. This protects your plan when life gets expensive unexpectedly.",
      },
      {
        heading: "What is it?",
        body: "3-6 months of living expenses in a liquid, safe place.\nIf you spend INR 10,000/month, an emergency fund is INR 30,000-INR 60,000.",
      },
      {
        heading: "Why this comes first",
        body: "Without an emergency fund, emergencies force you to sell investments at the worst time.",
      },
      {
        heading: "Where to keep it",
        body: "Use a high-yield savings account or a liquid mutual fund. Keep it separate from your daily spending account.",
      },
    ],
  },
  {
    id: "what-is-sip",
    title: "What is a SIP?",
    subtitle: "Systematic Investment Plan - the habit that builds wealth",
    category: "Investing",
    readMins: 3,
    level: "Beginner",
    applyText: "Set up a small index SIP today and then create a matching savings goal in SuperFinz.",
    content: [
      { body: "SIP means you invest a fixed amount into a mutual fund every month, automatically." },
      {
        heading: "Why SIP beats timing",
        body: "No one times markets consistently. Monthly investing smooths entry price over time through rupee cost averaging.",
      },
      {
        heading: "Simple example",
        body: "Set a monthly SIP amount and automate it. Consistency matters more than perfect timing.",
      },
      {
        heading: "Where to start",
        body: "Pick a low-cost index fund and start small. Increase the SIP amount as your income grows.",
      },
    ],
  },
  {
    id: "nifty-50",
    title: "What is NIFTY 50?",
    subtitle: "India's top listed companies in one benchmark",
    category: "Investing",
    readMins: 3,
    level: "Beginner",
    applyText: "Start a NIFTY 50 index SIP and use the SIP Calculator to project outcomes.",
    content: [
      {
        body: "NIFTY 50 is an index of 50 large companies on NSE. It represents a broad slice of the Indian equity market.",
      },
      {
        heading: "Why investors use it",
        body: "One index fund gives diversification across sectors and companies at a low cost.",
      },
      {
        heading: "Index vs active",
        body: "Index funds track the benchmark and usually charge lower fees than active funds.",
      },
      {
        heading: "NIFTY 50 vs SENSEX",
        body: "Both are broad Indian equity benchmarks. The key is to choose a low-cost, diversified approach and stay consistent.",
      },
    ],
  },
  {
    id: "what-is-cagr",
    title: "What is CAGR?",
    subtitle: "The return metric that normalizes performance",
    category: "Investing",
    readMins: 2,
    level: "Beginner",
    applyText: "Use calculator outputs to compare options with CAGR, not just total return.",
    content: [
      {
        body: "CAGR is the annualized growth rate that factors compounding. It lets you compare investments across different time periods.",
      },
      {
        heading: "Why total return can mislead",
        body: "A large total return over a very long period may still be a low annual growth rate. CAGR shows the true pace.",
      },
      {
        heading: "Quick formula",
        body: "CAGR = (Final Value / Initial Value)^(1/years) - 1",
      },
    ],
  },
  {
    id: "fd-vs-stocks",
    title: "FD vs Stocks vs Mutual Funds",
    subtitle: "Choosing the right tool for each financial goal",
    category: "Investing",
    readMins: 4,
    level: "Intermediate",
    applyText: "Use FD and SIP calculators side-by-side to compare outcomes before choosing.",
    content: [
      {
        body: "Every instrument has trade-offs between return, risk, and liquidity. Match the instrument to the timeline.",
      },
      {
        heading: "Fixed deposits",
        body: "Lower risk and predictable returns, best for short-term needs and safety buckets.",
      },
      {
        heading: "Direct stocks",
        body: "Higher variance and research requirement. Suitable only if you can evaluate businesses deeply.",
      },
      {
        heading: "Index mutual funds",
        body: "Diversified, low-cost, and generally suitable for long-term wealth creation for most users.",
      },
    ],
  },
  {
    id: "what-is-fire",
    title: "What is FIRE?",
    subtitle: "Financial Independence, Retire Early explained simply",
    category: "Retirement",
    readMins: 4,
    level: "Intermediate",
    applyText: "Use the Retirement Planner to estimate your own FIRE number.",
    content: [
      {
        body: "FIRE means building enough invested assets so that withdrawals can fund your lifestyle without mandatory work.",
      },
      {
        heading: "Core idea",
        body: "If portfolio withdrawals can safely cover annual expenses, you are financially independent.",
      },
      {
        heading: "Rule of thumb",
        body: "A common estimate is 25x annual expenses, based on a 4% withdrawal framework.",
      },
      {
        heading: "Different FIRE styles",
        body: "Lean FIRE, Fat FIRE, Coast FIRE, and Barista FIRE represent different spending and lifestyle choices.",
      },
    ],
  },
  {
    id: "four-percent-rule",
    title: "The 4% Rule",
    subtitle: "A practical framework for sustainable withdrawals",
    category: "Retirement",
    readMins: 3,
    level: "Intermediate",
    applyText: "Use this rule to set a target corpus inside the Retirement section.",
    content: [
      {
        body: "The 4% rule estimates how much can be withdrawn yearly while keeping a high probability of long-term portfolio survival.",
      },
      {
        heading: "How to use it",
        body: "Annual expenses x 25 gives a rough target corpus. Example: INR 5L annual expenses implies about INR 1.25Cr corpus.",
      },
      {
        heading: "Context matters",
        body: "Always review inflation, taxes, and local market assumptions before using a fixed withdrawal rate as policy.",
      },
    ],
  },
  {
    id: "why-start-at-21",
    title: "Why Start Investing at 21",
    subtitle: "Time in market creates outsized outcomes",
    category: "Retirement",
    readMins: 3,
    level: "Beginner",
    applyText: "Start with a small SIP now. Increase contributions as your income rises.",
    content: [
      {
        body: "In long-term investing, starting early is often more powerful than investing larger amounts later.",
      },
      {
        heading: "Compounding window",
        body: "Each year you start earlier adds another compounding cycle, which has multiplicative impact on final corpus.",
      },
      {
        heading: "Action step",
        body: "Automate a minimum monthly investment now to lock in habit and timeline.",
      },
    ],
  },
  {
    id: "asset-allocation",
    title: "Asset Allocation",
    subtitle: "How to divide money across risk buckets",
    category: "Advanced",
    readMins: 4,
    level: "Advanced",
    applyText: "Review your goals and align each one with an allocation suited to its timeline.",
    content: [
      {
        body: "Asset allocation is how your portfolio is split across equity, debt, cash, and alternatives. It drives risk more than stock picking.",
      },
      {
        heading: "Age and allocation",
        body: "Younger investors often tolerate more equity exposure due to longer time horizons. Allocation should match risk capacity and goals.",
      },
      {
        heading: "Why diversification works",
        body: "Different assets behave differently in market cycles. Diversification reduces single-source portfolio shock.",
      },
      {
        heading: "Periodic rebalancing",
        body: "Review allocations periodically and rebalance to maintain target risk profile.",
      },
    ],
  },
];

export function getLearnArticleById(id: string) {
  return LEARN_ARTICLES.find((article) => article.id === id);
}
