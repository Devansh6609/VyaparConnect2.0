import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.contact.create({
    data: {
      name: "Test User",
      phone: "+911234567890",
    },
  });
}
main().finally(() => prisma.$disconnect());
