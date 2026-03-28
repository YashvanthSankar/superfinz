import { auth } from "@/auth";

// Drop-in replacement — all server components call this unchanged
export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, onboarded: session.user.onboarded };
}
