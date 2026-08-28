// Seeds the initial department configuration. This is real, permanent
// reference data the product spec calls for by name — not demo/fake data —
// so it's safe to seed into the production database. No employees,
// production entries, or an Admin account are created here; those are real
// operational data entered through the app itself.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_DEPARTMENTS = [
  { name: "Design", slug: "design", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 1 },
  { name: "Build Up", slug: "build-up", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 2 },
  { name: "Model", slug: "model", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 3 },
  { name: "Finishing", slug: "finishing", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 4 },
  { name: "QC", slug: "qc", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 5 },
  { name: "Dispatch", slug: "dispatch", scoringRule: "NET_PRODUCTION", rankingMetric: "AVG_NET_PER_EMPLOYEE", sortOrder: 6 },
];

async function main() {
  for (const dept of INITIAL_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: dept,
    });
  }
  console.log(`Seeded ${INITIAL_DEPARTMENTS.length} departments.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
