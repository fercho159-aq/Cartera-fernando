import { auth } from "@/lib/auth";

export async function getServerSession() {
  const session = await auth();
  return session;
}

export async function getCurrentUserId(): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return parseInt(session.user.id);
}
