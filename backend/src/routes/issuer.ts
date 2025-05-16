// backend/src/routes/issuer.ts
import { Router } from "express";
import prisma from "../lib/prisma";  // l'unique fichier prisma.ts que tu as conservé

const router = Router();

// GET /api/issuer
router.get("/api/issuer", async (req, res) => {
  try {
    // Adapte la condition WHERE en fonction de la manière dont tu identifies l'utilisateur
    // ici j'imagine que tu as déjà un middleware qui met `req.user.id`
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const issuer = await prisma.companyInfo.findUnique({
      where: { userId },
      select: {
        name: true,
        address: true,
        zip: true,
        city: true,
        siret: true,
        vat: true,
        phone: true,
      },
    });

    if (!issuer) {
      return res.status(404).json({ error: "Infos émetteur non trouvées" });
    }
    res.json(issuer);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
