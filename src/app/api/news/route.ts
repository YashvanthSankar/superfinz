import { NextResponse } from "next/server";

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = "https://newsdata.io/api/1/news";

const MOCK_NEWS = [
  {
    title: "RBI keeps repo rate unchanged at 6.5% — what it means for your EMIs",
    description: "The Reserve Bank of India maintained its key interest rate, providing relief to home loan borrowers.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "Economic Times" },
    category: "Banking",
  },
  {
    title: "Nifty50 hits all-time high: Should Gen Z start investing now?",
    description: "Market analysts suggest SIP investments as the best entry strategy for first-time investors.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "Moneycontrol" },
    category: "Markets",
  },
  {
    title: "UPI transactions cross ₹20 lakh crore — India's digital payment revolution",
    description: "India processed record UPI transactions this quarter, cementing its position as the world's largest real-time payments market.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "Business Standard" },
    category: "Fintech",
  },
  {
    title: "How to build an emergency fund on a student budget in 2026",
    description: "Finance experts recommend saving 3x monthly expenses before investing. Here's how to start with ₹500/month.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "Livemint" },
    category: "Personal Finance",
  },
  {
    title: "Zepto, Swiggy Instamart spending habits eating into Gen Z savings",
    description: "A new survey reveals 60% of 18-25 year olds spend over ₹3000/month on food delivery apps.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "Inc42" },
    category: "Gen Z Finance",
  },
  {
    title: "New tax regime vs old: Which is better for first-time earners?",
    description: "With budget changes, many young professionals are confused about which tax regime to choose.",
    url: "#",
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: "CNBCTV18" },
    category: "Tax",
  },
];

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ articles: MOCK_NEWS, source: "mock" });
  }

  try {
    const url = `${BASE_URL}?apikey=${API_KEY}&q=finance+investing+money&country=in&language=en&category=business&size=10`;
    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) throw new Error("NewsData API error");

    const data = await res.json();
    const articles = (data.results ?? []).map((a: {
      title: string;
      description: string | null;
      link: string;
      image_url: string | null;
      pubDate: string;
      source_name: string;
      category: string[] | null;
    }) => ({
      title: a.title,
      description: a.description ?? "",
      url: a.link,
      image: a.image_url,
      publishedAt: a.pubDate,
      source: { name: a.source_name },
      category: a.category?.[0] ?? "Markets",
    }));

    return NextResponse.json({ articles, source: "live" });
  } catch {
    return NextResponse.json({ articles: MOCK_NEWS, source: "mock" });
  }
}
