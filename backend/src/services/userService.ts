// backend/src/services/userService.ts

import prisma from '../lib/prisma';

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}
