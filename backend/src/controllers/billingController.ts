import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // ✅ Correct : import default
import { AuthenticatedRequest } from '../middlewares/authenticateToken';

export const saveBillingInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const body = req.body;
    console.log('📦 Infos facturation reçues:', body);

    const existingBilling = await prisma.billingInfo.findFirst({
      where: { userId },
    });

    let billing;

    if (existingBilling) {
      billing = await prisma.billingInfo.update({
        where: { id: existingBilling.id },
        data: {
          name: body.name,
          lastname: body.lastname,
          email: body.email,
          country: body.country,
          address1: body.address1 || '',
          city: body.city,
          zip: body.zip,
          company: body.company || '',
          vat: body.vat || '',
        },
      });
    } else {
      billing = await prisma.billingInfo.create({
        data: {
          userId,
          name: body.name,
          lastname: body.lastname,
          email: body.email,
          country: body.country,
          address1: body.address1 || '',
          city: body.city,
          zip: body.zip,
          company: body.company || '',
          vat: body.vat || '',
        },
      });
    }

    return res.json({ success: true, billing });
  } catch (error: any) {
    console.error('❌ Erreur enregistrement billing:', error.message);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};
