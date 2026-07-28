import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth, type SessionUser } from "@/lib/auth/auth";
import { UnauthorizedError } from "@/lib/errors/app-error";

export async function getSession() {
  try {
    const auth = await getAuth();
    return auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<{
  user: SessionUser;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>["session"];
}> {
  const session = await getSession();

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    session: session.session,
  };
}

export async function requireSessionOrRedirect(
  redirectTo = "/login",
): Promise<{
  user: SessionUser;
}> {
  const session = await getSession();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}

export async function redirectIfAuthenticated(
  redirectTo = "/dashboard",
): Promise<void> {
  const session = await getSession();
  if (session?.user) {
    redirect(redirectTo);
  }
}
