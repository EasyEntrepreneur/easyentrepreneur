// frontend/src/lib/middlewares/checkDocumentQuota.ts

import prisma from '@/lib/prisma';

/**
 * Vérifie si l'utilisateur (FREEMIUM) a le droit de créer un nouveau document (facture, devis).
 * Retourne true si quota OK, false si quota dépassé.
 * 
 * @param userId - ID de l'utilisateur connecté
 * @returns {Promise<{ allowed: boolean, used: number, quota: number }>}
 */
export async function checkDocumentQuota(userId: string): Promise<{ allowed: boolean, used: number, quota: number }> {
  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  const currentPlan = userRecord?.currentPlan ?? 'FREEMIUM';

  // Si ce n'est pas un plan freemium, pas de limite
  if (currentPlan !== 'FREEMIUM') {
    return { allowed: true, used: 0, quota: 5 };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Compte factures créées ce mois
  const invoicesCount = await prisma.invoice.count({
    where: { userId, createdAt: { gte: monthStart, lte: monthEnd } }
  });

  // Compte devis créés ce mois
  const quotesCount = await prisma.quote.count({
    where: { userId, createdAt: { gte: monthStart, lte: monthEnd } }
  });

  const totalDocs = invoicesCount + quotesCount;
  const quota = 5;

  return { allowed: totalDocs < quota, used: totalDocs, quota };
}
