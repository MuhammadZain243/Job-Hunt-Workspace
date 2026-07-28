import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireSessionOrRedirect } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSessionOrRedirect();

  return (
    <WorkspaceShell userEmail={user.email} userName={user.name}>
      {children}
    </WorkspaceShell>
  );
}
