import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const exam = await prisma.exam.create({
    data: {
      title: "Automated Test Exam",
      description: "Testing student flow",
      subject: "Test",
      status: "PUBLISHED",
      ownerId: user.id,
      uniqueCode: "TEST" + Math.floor(Math.random() * 10000),
      sessionState: "ACTIVE",
      sections: {
        create: [
          {
            title: "Section 1",
            order: 0,
            questions: {
              create: [
                {
                  type: "MCQ",
                  difficulty: "EASY",
                  text: "What is 2+2?",
                  points: 1,
                  order: 0,
                  required: true,
                  options: {
                    create: [
                      { text: "3", order: 0, isCorrect: false },
                      { text: "4", order: 1, isCorrect: true },
                      { text: "5", order: 2, isCorrect: false },
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log(exam.uniqueCode);
}

main().catch(console.error).finally(() => prisma.$disconnect());
