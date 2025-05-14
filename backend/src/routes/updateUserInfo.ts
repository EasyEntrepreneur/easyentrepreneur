import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken';
import prisma from '../lib/prisma';

const router = express.Router();

// ✅ Mise à jour utilisateur
router.put('/update-user', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

  const { name, lastname, email, password } = req.body;

  try {
    const data: any = { name, lastname, email };
    if (password && password.length > 3) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({ success: true, user: updatedUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur mise à jour utilisateur' });
  }
});

// ✅ Mise à jour infos de facturation
router.put('/update-billing', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

  const body = req.body;

  try {
    const billingInfo = await prisma.billingInfo.upsert({
      where: { userId },
      update: {
        name: body.billingName,
        lastname: body.billingLastname,
        email: body.billingEmail,
        country: body.billingCountry,
        address1: body.billingAddress,
        zip: body.billingZip,
        city: body.billingCity,
        company: body.billingCompany,
        vat: body.billingVat,
      },
      create: {
        userId: userId, // ✅ garanti string
        name: body.billingName,
        lastname: body.billingLastname,
        email: body.billingEmail,
        country: body.billingCountry,
        address1: body.billingAddress,
        zip: body.billingZip,
        city: body.billingCity,
        company: body.billingCompany,
        vat: body.billingVat,
      },
    });

    return res.json({ success: true, billingInfo });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur mise à jour facturation' });
  }
});

// ✅ Mise à jour infos entreprise
router.put('/update-company', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

  const body = req.body;

  try {
    const company = await prisma.companyInfo.upsert({
      where: { userId },
      update: {
        name: body.companyName,
        address: body.companyAddress,
        zip: body.companyZip,
        city: body.companyCity,
        siret: body.companySiret,
        vat: body.companyVat,
        phone: body.companyPhone,
      },
      create: {
        userId: userId, // ✅ garanti string
        name: body.companyName,
        address: body.companyAddress,
        zip: body.companyZip,
        city: body.companyCity,
        siret: body.companySiret,
        vat: body.companyVat,
        phone: body.companyPhone,
      },
    });

    return res.json({ success: true, company });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur mise à jour entreprise' });
  }
});

export default router;
