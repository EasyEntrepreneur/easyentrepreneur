// backend/src/routes/quota.ts
import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticateToken";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId || req.user.id;

  // Récupère l'offre de l'utilisateur
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isFreemium = user?.currentPlan === "FREEMIUM";
  const quotaMax = isFreemium ? 5 : 99999;

  // Calcule le début et la fin du mois
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Compte les factures créées ce mois
  const invoicesCount = await prisma.invoice.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Compte les devis créés ce mois
  const quotesCount = await prisma.quote.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Additionne tous les documents générés
  const docsCount = invoicesCount + quotesCount;

  res.json({
    used: docsCount,
    max: quotaMax,
    offer: user?.currentPlan,
  });
});

export default router;
