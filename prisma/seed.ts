import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. Create the Demo User ---
  const demoUserEmail = "demo@vyaparconnect.com";
  let demoUser = await prisma.user.findUnique({
    where: { email: demoUserEmail },
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('demopassword123', 10);
    demoUser = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: demoUserEmail,
        password: hashedPassword,
      },
    });
    console.log(`✅ Created demo user with email: ${demoUser.email}`);
  } else {
    console.log(`ℹ️ Demo user with email "${demoUserEmail}" already exists.`);
  }


  // --- 2. Create a Test Contact and link it to the Demo User ---
  const testContactPhone = "+911234567890";
  const existingContact = await prisma.contact.findUnique({
    where: { phone: testContactPhone },
  });

  if (!existingContact) {
    await prisma.contact.create({
      data: {
        name: "Test User Contact",
        phone: testContactPhone,
        userId: demoUser.id, // This links the contact to the user we just created/found
      },
    });
    console.log(`✅ Created test contact and linked to ${demoUser.email}`);
  } else {
    console.log(`ℹ️ Test contact with phone "${testContactPhone}" already exists.`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
