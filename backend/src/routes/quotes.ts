import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const quotes = await prisma.quote.findMany({ where: { userId } });
  res.json(quotes);
});

router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { clientName, clientAddress, items, total, notes } = req.body;
  try {
    const quote = await prisma.quote.create({
      data: { userId, clientName, clientAddress, items, total, status: 'en attente', notes }
    });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du devis' });
  }
});

export default router;
