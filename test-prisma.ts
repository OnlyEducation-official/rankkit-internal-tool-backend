import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log("Prisma connected successfully");
}

main()
  .catch((error) => {
    console.error("Prisma connection failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });