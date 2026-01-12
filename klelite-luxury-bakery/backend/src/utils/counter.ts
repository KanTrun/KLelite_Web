import prisma from '../lib/prisma';

export async function getNextSequence(name: string): Promise<number> {
  // Use Prisma transaction to ensure atomic increment
  const counter = await prisma.counter.upsert({
    where: { entity: name },
    update: {
      seq: {
        increment: 1
      }
    },
    create: {
      entity: name,
      seq: 1
    }
  });

  return counter.seq;
}
