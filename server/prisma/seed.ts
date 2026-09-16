import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const company = await prisma.company.create({
    data: { name: "Demo Builders Pvt Ltd" },
  });

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Admin User",
      email: "admin@demobuilders.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      name: "Skyline Residences",
      code: "SKY-001",
      status: "ACTIVE",
      projectManagerId: admin.id,
      budget: 50000000,
      address: "Plot 12, Sector 44, Gurugram",
    },
  });

  const site = await prisma.site.create({
    data: {
      projectId: project.id,
      name: "Skyline Residences - Main Site",
      address: "Plot 12, Sector 44, Gurugram",
    },
  });

  const building = await prisma.building.create({
    data: { siteId: site.id, name: "Tower A" },
  });

  const floor = await prisma.floor.create({
    data: { buildingId: building.id, name: "Ground Floor", levelOrder: 0 },
  });

  await prisma.unit.create({
    data: { floorId: floor.id, name: "Unit G-01", areaSqft: 1200, unitType: "2BHK" },
  });

  console.log("Seed complete.");
  console.log("Login with: admin@demobuilders.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
