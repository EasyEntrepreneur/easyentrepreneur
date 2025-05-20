import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const checkDocumentQuota = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user; // Auth middleware doit remplir req.user
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  // Vérifier le plan actuel
  const userDb = await prisma.user.findUnique({ where: { id: user.userId } });
  const currentPlan = userDb?.currentPlan || 'FREEMIUM';

  if (currentPlan !== 'FREEMIUM') {
    // Si non-freemium, pas de limite
    return next();
  }

  // Dates limites du mois en cours
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Compte tous les documents créés ce mois-ci (Facture + Devis + Contrat)
  const [facturesCount, devisCount, contratsCount] = await Promise.all([
    prisma.invoice.count({
      where: {
        userId: user.userId,
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    }),
    prisma.quote.count({
      where: {
        userId: user.userId,
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    }),
    prisma.contract.count({
      where: {
        userId: user.userId,
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    }),
  ]);

  const totalDocs = facturesCount + devisCount + contratsCount;

  if (totalDocs >= 5) {
    return res.status(403).json({
      error: "Limite atteinte : l'offre Freemium permet de générer 5 documents par mois. Passez à une offre supérieure pour continuer.",
      quota: 5,
      used: totalDocs,
    });
  }

  // Sinon, autorisé
  return next();
};
