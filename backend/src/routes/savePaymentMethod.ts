import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, paymentMethodId } = req.body;

  if (!userId || !paymentMethodId) {
    res.status(400).json({ error: 'userId et paymentMethodId requis' });
    return;
  }

  try {
    // Empêche les doublons en base
    const existing = await prisma.paymentMethod.findUnique({
      where: { stripePaymentMethodId: paymentMethodId },
    });

    if (!existing) {
      await prisma.paymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId: paymentMethodId,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur savePaymentMethod:', error);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement' });
  }
});

export default router;
