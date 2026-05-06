import "dotenv/config";
import { PrismaClient, ModuleName } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@rankkit.com",
    },
    update: {},
    create: {
      name: "Root Admin",
      email: "admin@rankkit.com",
      password: hashedPassword,
      isAdmin: true,
      isActive: true,
      permissions: {
        create: [
          {
            module: ModuleName.QUOTATION,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canDuplicate: true,
          },
          {
            module: ModuleName.STUDIO_BOOKING,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canDuplicate: true,
          },
          {
            module: ModuleName.EMPLOYEE_MANAGEMENT,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canDuplicate: true,
          },
        ],
      },
    },
  });

  console.log("Root admin created:", admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });