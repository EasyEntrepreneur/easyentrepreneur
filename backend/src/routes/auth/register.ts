import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import Stripe from 'stripe';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

router.post('/', async (req: Request, res: Response) => {
  const { email, password, name, lastname } = req.body;

  if (!email || !password || !name || !lastname) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  try {
    // Vérifie si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Utilisateur déjà existant.' });
    }

    // Crée le client Stripe
    const customer = await stripe.customers.create({
      email,
      name: `${name} ${lastname}`,
    });

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crée l’utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastname,
        stripeCustomerId: customer.id,
      },
    });

    res.status(201).json({ success: true, user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
