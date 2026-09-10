import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findFirst();
  if (!exam) return;
  const section = await prisma.section.findFirst({ where: { examId: exam.id } });
  if (!section) return;

  try {
    const q = await prisma.question.create({
      data: {
        sectionId: section.id,
        type: 'MATCHING',
        text: 'Test Matching',
        points: 1,
        difficulty: 'MEDIUM',
        order: 99,
        required: true,
        metadata: {
          pairs: [{ L: "A", R: "B" }],
          correctPairs: [{ leftId: "A", rightId: "B" }]
        }
      }
    });
    console.log("Successfully created question:", q);
  } catch (err) {
    console.error("Error creating question:", err);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
