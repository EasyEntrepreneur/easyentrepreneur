import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

// Lister tous les clients de l'utilisateur connecté
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  res.json(clients);
});

// Récupérer un client (uniquement s'il appartient à l'utilisateur)
router.get("/:id", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
});

// Créer un nouveau client lié à l'utilisateur connecté
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { name, address, zip, city, siret, vat, phone } = req.body;
  if (!name || !address || !zip || !city || !siret) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }
  const client = await prisma.client.create({
    data: { name, address, zip, city, siret, vat, phone, userId },
  });
  res.json(client);
});

export default router;
