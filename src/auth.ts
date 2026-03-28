import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            googleId: account.providerAccountId,
            avatar: user.image ?? undefined,
            name: user.name ?? user.email,
          },
          create: {
            email: user.email,
            name: user.name ?? user.email,
            googleId: account.providerAccountId,
            avatar: user.image ?? undefined,
          },
        });
        return true;
      }
      return false;
    },
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || trigger === "update" || !token.userId) {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.onboarded = dbUser.onboarded;
            token.avatar = dbUser.avatar;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.onboarded = token.onboarded as boolean;
        if (token.avatar) session.user.image = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
