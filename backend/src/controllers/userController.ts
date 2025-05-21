import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/authenticateToken';

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        billingInfo: true,
        companyInfo: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        emailVerified: user.emailVerified,
        billingName: user.billingInfo?.name || '',
        billingLastname: user.billingInfo?.lastname || '',
        billingEmail: user.billingInfo?.email || '',
        billingCountry: user.billingInfo?.country || '',
        billingAddress: user.billingInfo?.address1 || '',
        billingZip: user.billingInfo?.zip || '',
        billingCity: user.billingInfo?.city || '',
        billingCompany: user.billingInfo?.company || '',
        billingVat: user.billingInfo?.vat || '',
        companyName: user.companyInfo?.name || '',
        companyAddress: user.companyInfo?.address || '',
        companyZip: user.companyInfo?.zip || '',
        companyCity: user.companyInfo?.city || '',
        companySiret: user.companyInfo?.siret || '',
        companyVat: user.companyInfo?.vat || '',
        companyPhone: user.companyInfo?.phone || ''
      }
    });
  } catch (error) {
    console.error('[GET /me] Erreur :', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
