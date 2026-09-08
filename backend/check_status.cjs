const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.exam.findMany({ select: { uniqueCode: true, status: true, title: true } }).then(console.log).finally(() => prisma.$disconnect());
