// backend/src/middlewares/checkDocumentQuota.ts
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
  // assure req.user is defined and has userId
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Retrieve user's plan from database
  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  const currentPlan = userRecord?.currentPlan ?? 'FREEMIUM';

  // Only limit FREEMIUM
  if (currentPlan !== 'FREEMIUM') {
    return next();
  }

  // Compute month start/end
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Count invoices this month
  const invoicesCount = await prisma.invoice.count({
    where: { userId, createdAt: { gte: monthStart, lte: monthEnd } }
  });

  // TODO: also count quotes and contracts if applicable
  const totalDocs = invoicesCount;

  if (totalDocs >= 5) {
    return res.status(403).json({
      error: 'Limite atteinte : l’offre FREEMIUM permet de générer 5 documents par mois.',
      used: totalDocs,
      quota: 5,
    });
  }

  // OK to proceed
  next();
}