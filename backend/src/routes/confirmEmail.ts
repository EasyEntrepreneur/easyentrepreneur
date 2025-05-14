// backend/src/routes/confirmEmail.ts
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.get('/confirm-email', async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerifiedToken: token },
    });

    if (!user) {
      return res.status(404).json({ error: 'Token invalide' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifiedToken: null,
      },
    });

    return res.redirect(`${process.env.FRONT_URL}/email-confirmed`);
  } catch (error) {
    console.error('Erreur lors de la confirmation email :', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
