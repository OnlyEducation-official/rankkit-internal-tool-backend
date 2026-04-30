// prisma/seed.ts

import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@rankkit.com",
    },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@rankkit.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log("Super admin created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });