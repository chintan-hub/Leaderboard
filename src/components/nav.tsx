import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { logoutAdmin } from "@/lib/actions/auth";

const VIEW_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/departments", label: "Departments" },
  { href: "/employees", label: "Employees" },
  { href: "/activity", label: "Activity" },
  { href: "/monthly", label: "Monthly Results" },
];

export default async function Nav() {
  const admin = await getCurrentAdmin();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-foreground">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-base text-white"
          >
            🦷
          </span>
          <span>DentoCraft Leaderboard</span>
        </Link>

        <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted">
          {VIEW_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {admin ? (
            <>
              <Link
                href="/admin/production"
                className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white transition hover:bg-brand-strong"
              >
                Production
              </Link>
              <Link
                href="/admin"
                className="rounded-lg border border-border px-3 py-1.5 font-semibold text-muted transition hover:border-brand hover:text-brand"
              >
                Admin Tools
              </Link>
              <span className="hidden text-muted sm:inline">{admin.username}</span>
              <form action={logoutAdmin}>
                <button type="submit" className="font-semibold text-muted underline hover:text-foreground">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-lg border border-border px-3 py-1.5 font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
