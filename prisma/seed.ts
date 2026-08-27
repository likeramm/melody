import { PrismaClient } from "@prisma/client";

import { seedDatabase } from "../src/lib/seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((result) => {
    console.log("시드 데이터 생성 완료");
    console.log(result);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
