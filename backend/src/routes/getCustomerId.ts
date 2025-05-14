import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      res.status(404).json({ error: 'stripeCustomerId introuvable' });
      return;
    }

    res.json({ stripeCustomerId: user.stripeCustomerId });
  } catch (error) {
    console.error('Erreur get-customer-id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
