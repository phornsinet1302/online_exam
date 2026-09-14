import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 1,
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  console.dir(exams, { depth: null });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
