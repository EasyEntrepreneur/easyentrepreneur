// backend/src/routes/quota.ts
import { Router } from "express";
import { authenticateToken } from "../middlewares/authenticateToken";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId || req.user.id;
  // Exemple : quota = 5 si offre FREEMIUM, sinon très élevé ou selon l’offre
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isFreemium = user?.currentPlan === "FREEMIUM";
  const quotaMax = isFreemium ? 5 : 99999;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const docsCount = await prisma.invoice.count({
    where: {
      userId,
      issuedAt: { gte: startOfMonth },
    },
  });
  // Ajoute pareil pour d'autres types de docs si besoin (devis/contrats)
  res.json({
    used: docsCount,
    max: quotaMax,
    offer: user?.currentPlan,
  });
});

export default router;
