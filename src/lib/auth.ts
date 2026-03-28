import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Always reads onboarded from DB. Falls back to email lookup if
// session.user.id is the Google OAuth sub (not our cuid).
export async function getSession() {
  const session = await auth();
  if (!session?.user) return null;

  try {
    // Primary: look up by our DB id stored in session
    let user: { id: string; onboarded: boolean } | null = null;

    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, onboarded: true },
      });
    }

    // Fallback: session.user.id might be the Google OAuth sub (numeric string).
    // Try by email which is always correct.
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, onboarded: true },
      });
    }

    if (!user) return null;
    return { userId: user.id, onboarded: user.onboarded };
  } catch {
    return null;
  }
}
