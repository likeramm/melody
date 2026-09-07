import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={{ name: user.name }} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
