import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { Card, SectionTitle } from "@/components/ui";

const TOOLS = [
  {
    href: "/admin/production",
    title: "Production Entry",
    description: "Log completed and returned cases for an employee.",
    icon: "🦷",
  },
  {
    href: "/admin/manual-points",
    title: "Manual Points",
    description: "Award a +1 bonus or -1 deduction with a reason.",
    icon: "⭐",
  },
  {
    href: "/admin/settings",
    title: "Admin Settings",
    description: "View the admin account for this system.",
    icon: "⚙️",
  },
];

export default async function AdminHomePage() {
  const admin = await getCurrentAdmin();

  return (
    <div className="space-y-6">
      <SectionTitle subtitle={admin ? `Signed in as ${admin.username}` : undefined}>
        Admin Tools
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="focus-ring block rounded-xl">
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-surface-raised">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-xl">
                {tool.icon}
              </div>
              <h3 className="mt-3 font-bold text-foreground">{tool.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
