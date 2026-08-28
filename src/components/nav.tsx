import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { logoutAdmin } from "@/lib/actions/auth";
import { AdminNavLinks, NavLinks } from "./nav-links";

export default async function Nav() {
  const admin = await getCurrentAdmin();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="focus-ring flex items-center gap-2.5 rounded-lg py-1 font-extrabold tracking-tight text-foreground"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-base text-white shadow-surface"
          >
            🦷
          </span>
          <span className="hidden sm:inline">DentoCraft Leaderboard</span>
          <span className="sm:hidden">DentoCraft</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2 text-sm">
          {admin ? (
            <>
              <AdminNavLinks />
              <span className="hidden pl-1 text-xs font-medium text-muted lg:inline">
                {admin.username}
              </span>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="focus-ring rounded-lg px-2.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-hover hover:text-foreground"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="focus-ring rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
