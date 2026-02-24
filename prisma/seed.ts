import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@pililokal.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@pililokal.com",
      passwordHash: await bcrypt.hash("admin123", 10),
    },
  });

  console.log("Seed completed. Import leads from Excel on Leads Pipeline.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
