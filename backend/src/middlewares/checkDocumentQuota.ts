import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/authenticateToken';

/**
 * Middleware to enforce a 5-document-per-month limit on FREEMIUM users.
 * Requires authenticateToken to populate req.user with { userId }.
 */
export async function checkDocumentQuota(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  const currentPlan = userRecord?.currentPlan ?? 'FREEMIUM';

  if (currentPlan !== 'FREEMIUM') {
    return next();
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

  // (Tu pourras ajouter contractsCount plus tard si tu veux)
  const totalDocs = invoicesCount + quotesCount;

  if (totalDocs >= 5) {
    return res.status(403).json({
      error: 'Limite atteinte : l’offre FREEMIUM permet de générer 5 documents par mois.',
      used: totalDocs,
      quota: 5,
    });
  }

  next();
}