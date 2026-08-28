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
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full transition hover:border-border hover:shadow-md">
              <div className="text-2xl">{tool.icon}</div>
              <h3 className="mt-2 font-bold text-foreground">{tool.title}</h3>
              <p className="mt-1 text-sm text-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
