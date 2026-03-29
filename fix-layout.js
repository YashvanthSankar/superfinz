const fs = require('fs');
let code = \import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/session-provider';
import { ThemeToggle } from '@/components/theme-toggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SuperFinz — Gen Z Finance Dashboard',
  description: 'All-in-one finance dashboard for students and young professionals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={\\ \ h-full antialiased\}
    >
      <body className="min-h-screen relative">
        <Providers>{children}</Providers>
        <ThemeToggle />
      </body>
    </html>
  );
}
\;

fs.writeFileSync('src/app/layout.tsx', code, 'utf8');
