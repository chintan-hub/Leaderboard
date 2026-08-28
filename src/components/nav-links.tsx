"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconActivity,
  IconCalendar,
  IconClipboard,
  IconGrid,
  IconHome,
  IconTool,
  IconUsers,
} from "./nav-icons";

const VIEW_LINKS = [
  { href: "/", label: "Dashboard", icon: IconHome, exact: true },
  { href: "/departments", label: "Departments", icon: IconGrid },
  { href: "/employees", label: "Employees", icon: IconUsers },
  { href: "/activity", label: "Activity", icon: IconActivity },
  { href: "/monthly", label: "Monthly Results", icon: IconCalendar },
];

function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active: boolean) =>
  `focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
    active
      ? "bg-brand text-white shadow-surface"
      : "text-muted hover:bg-surface-hover hover:text-foreground"
  }`;

/** The view-only route group — every visitor sees these, no admin required. */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-wrap items-center gap-1" aria-label="Main">
      {VIEW_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href, link.exact);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={linkClass(active)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Admin-only actions, visually grouped apart from the view links since they change data rather than just navigate. */
export function AdminNavLinks() {
  const pathname = usePathname();
  const productionActive = isActivePath(pathname, "/admin/production");
  const toolsActive = pathname.startsWith("/admin") && !productionActive;

  return (
    <div className="flex items-center gap-1 border-l border-border pl-3">
      <Link
        href="/admin/production"
        aria-current={productionActive ? "page" : undefined}
        className={linkClass(productionActive)}
      >
        <IconClipboard className="h-4 w-4 shrink-0" />
        <span>Production</span>
      </Link>
      <Link
        href="/admin"
        aria-current={toolsActive ? "page" : undefined}
        className={linkClass(toolsActive)}
      >
        <IconTool className="h-4 w-4 shrink-0" />
        <span>Admin Tools</span>
      </Link>
    </div>
  );
}
