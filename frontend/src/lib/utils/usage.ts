import { PrismaClient, UsageType, Plan } from '@prisma/client';

const prisma = new PrismaClient();

// Quotas mensuels par plan
const QUOTAS: Record<Plan, Record<UsageType, number>> = {
  FREEMIUM: {
    invoice: 5,
    quote: 5,
    ai_request: 5,
  },
  BASIC: {
    invoice: 50,
    quote: 50,
    ai_request: 30,
  },
  STANDARD: {
    invoice: 200,
    quote: 200,
    ai_request: 100,
  },
  PREMIUM: {
    invoice: Infinity,
    quote: Infinity,
    ai_request: Infinity,
  },
};

// Renvoie le dernier jour du mois
function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

export async function checkAndUpdateUsage(userId: string, type: UsageType, plan: Plan): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const quota = QUOTAS[plan][type];
  const now = new Date();

  const existingUsage = await prisma.usage.findUnique({
    where: {
      userId_type: {
        userId,
        type,
      },
    },
  });

  // Si aucun usage trouvé → premier usage
  if (!existingUsage) {
    await prisma.usage.create({
      data: {
        userId,
        type,
        count: 1,
        resetDate: getEndOfMonth(),
      },
    });
    return {
      allowed: true,
      remaining: quota === Infinity ? Infinity : quota - 1,
    };
  }

  // Si le quota doit être réinitialisé
  if (existingUsage.resetDate < now) {
    await prisma.usage.update({
      where: { id: existingUsage.id },
      data: {
        count: 1,
        resetDate: getEndOfMonth(),
      },
    });
    return {
      allowed: true,
      remaining: quota === Infinity ? Infinity : quota - 1,
    };
  }

  // Si le quota est atteint
  if (existingUsage.count >= quota) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  // Sinon on incrémente
  await prisma.usage.update({
    where: { id: existingUsage.id },
    data: {
      count: { increment: 1 },
    },
  });

  return {
    allowed: true,
    remaining: quota === Infinity ? Infinity : quota - (existingUsage.count + 1),
  };
}
