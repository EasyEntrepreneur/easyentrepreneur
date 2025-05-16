// backend/src/routes/issuer.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/issuer
router.get("/", async (req: Request, res: Response) => {
  try {
    // 1. Vérifier la présence d'un header Authorization
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant" });
    }
    const token = auth.split(" ")[1];

    // 2. Vérifier et décoder le token
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return res.status(401).json({ error: "Token invalide" });
    }

    // 3. Récupérer les infos de l’émetteur pour l’utilisateur donné
    const issuer = await prisma.companyInfo.findUnique({
      where: { userId: payload.userId },
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
      return res.status(404).json({ error: "Émetteur non trouvé" });
    }

    // 4. Tout est OK, on renvoie les données
    return res.json(issuer);
  } catch (err) {
    console.error("API /issuer error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
