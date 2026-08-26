import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <AppShell user={{ name: user.name, role: user.role }} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
