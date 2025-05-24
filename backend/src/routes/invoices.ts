import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'
import { checkDocumentQuota } from '../middlewares/checkDocumentQuota';
import path from 'path'
import fs from 'fs/promises'
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

const router = Router()

// Suppression d'une facture (avec contrôle utilisateur)
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const invoiceId = req.params.id;
  try {
    // 1. Supprime d'abord tous les items de la facture (sécurité FK)
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId }
    });
    // 2. Supprime la facture SEULEMENT si elle appartient à l'utilisateur
    const result = await prisma.invoice.deleteMany({
      where: { id: invoiceId, userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: "Facture introuvable ou accès refusé." });
    }
    res.json({ success: true, id: invoiceId });
  } catch (error) {
    console.error("[DELETE] Erreur suppression facture :", error);
    res.status(500).json({ error: "Erreur lors de la suppression de la facture." });
  }
});

// Suppression groupée de factures
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { ids } = req.body; // tableau d'ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Aucune facture sélectionnée" });
  }
  try {
    // 1. Supprime tous les items liés à ces factures
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: { in: ids } }
    });
    // 2. Supprime toutes les factures appartenant à ce user
    const result = await prisma.invoice.deleteMany({
      where: { id: { in: ids }, userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: "Aucune facture supprimée (non trouvée ou accès refusé)." });
    }
    res.json({ deleted: result.count, ids });
  } catch (error) {
    console.error("[BULK DELETE] Erreur suppression factures :", error);
    res.status(500).json({ error: "Erreur lors de la suppression des factures." });
  }
});

// GET /invoices — toutes les factures du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { items: true, client: true },
      orderBy: { issuedAt: 'desc' },
    })
    // Ajoute le champ pdfUrl pour chaque facture (utilisé côté front)
    const invoicesWithPdfUrl = invoices.map((inv: { number: any }) => ({
      ...inv,
      pdfUrl: inv.number ? `/invoices/${inv.number}.pdf` : null
    }))
    res.json(invoicesWithPdfUrl)
  } catch (error) {
    console.error('Erreur GET /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des factures.' })
  }
})

// GET /invoices/:id — une facture spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { items: true, client: true },
    })
    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' })
    }
    // Ajoute le champ pdfUrl pour le front
    res.json({
      ...invoice,
      pdfUrl: invoice.number ? `/invoices/${invoice.number}.pdf` : null
    })
  } catch (error) {
    console.error('Erreur GET /invoices/:id :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la facture.' })
  }
})

// --- UTILITY : Optionnel, fallback de génération HTML côté back (pour tests)
function generateInvoiceHtml(invoice: any) {
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px;}
          th, td { border: 1px solid #aaa; padding: 8px; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Facture ${invoice.number}</h1>
        <div>
          <b>Client :</b> ${invoice.clientName} <br>
          ${invoice.clientAddress} <br>
          ${invoice.clientZip} ${invoice.clientCity}
        </div>
        <div style="margin-top:10px;">
          <b>Date :</b> ${invoice.issuedAt?.toLocaleDateString ? invoice.issuedAt.toLocaleDateString() : invoice.issuedAt}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.items
                .map(
                  (it: any) => `<tr>
                    <td>${it.description}</td>
                    <td class="right">${it.quantity}</td>
                    <td class="right">${it.unitPrice.toFixed(2)} €</td>
                    <td class="right">${it.totalHT.toFixed(2)} €</td>
                  </tr>`
                )
                .join("")
            }
          </tbody>
        </table>
        <div class="right" style="margin-top:24px;">
          <b>Total HT : </b>${invoice.totalHT.toFixed(2)} €<br>
          <b>TVA : </b>${invoice.totalTVA.toFixed(2)} €<br>
          <b>Total TTC : </b>${invoice.totalTTC.toFixed(2)} €
        </div>
        <div style="margin-top:24px; font-size:12px;">${invoice.legalNote || ""}</div>
      </body>
    </html>
  `
}

router.post('/', authenticateToken, checkDocumentQuota, async (req, res) => {
  const userId = req.user.userId
  const {
    client,
    dueAt,
    iban,
    bic,
    items,
    invoiceHtml,
    ...rest
  } = req.body

  try {
    // 1. Récupère ou crée le client (inchangé)
    let dbClient = null
    if (client.siret) {
      dbClient = await prisma.client.findFirst({
        where: { userId, siret: client.siret }
      })
    }
    if (!dbClient) {
      dbClient = await prisma.client.findFirst({
        where: {
          userId,
          name: client.name,
          address: client.address,
          zip: client.zip,
          city: client.city,
        }
      })
    }
    if (!dbClient) {
      const clientToInsert = {
        name: client.name,
        address: client.address,
        zip: client.zip,
        city: client.city,
        siret: client.siret || "",
        vat: client.vat || "",
        phone: client.phone || "",
        userId
      }
      dbClient = await prisma.client.create({ data: clientToInsert })
    }

    // 2. Génération d'un numéro de facture unique **robuste**
    const year = new Date().getFullYear();
    const regex = new RegExp(`^${year}-(\\d{3})$`);

    // Cherche tous les numéros pour l'année en cours
    const invoicesThisYear = await prisma.invoice.findMany({
      where: {
        userId,
        number: { startsWith: `${year}-` }
      },
      select: { number: true }
    });

    // Trouve le plus grand numéro de la série
    let nextNumber = 1;
    if (invoicesThisYear.length > 0) {
      const nums = invoicesThisYear
        .map((inv: any) => {
          const match = inv.number.match(regex);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => !isNaN(n));
      if (nums.length > 0) {
        nextNumber = Math.max(...nums) + 1;
      }
    }
    let number = `${year}-${String(nextNumber).padStart(3, '0')}`;

    // Vérifie l'unicité (boucle ultra-rare)
    let exists = await prisma.invoice.findUnique({ where: { number } });
    let tries = 0;
    const maxTries = 10;
    while (exists && tries < maxTries) {
      nextNumber++;
      number = `${year}-${String(nextNumber).padStart(3, '0')}`;
      exists = await prisma.invoice.findUnique({ where: { number } });
      if (!exists) break;
      tries++;
    }
    if (tries === maxTries && exists) {
      return res.status(500).json({ error: "Impossible de générer un numéro de facture unique. Veuillez réessayer." });
    }

    // 3. Calcul des totaux (inchangé)
    let totalHT = 0
    let totalTVA = 0
    let totalTTC = 0
    const invoiceItems = items.map((item: any) => {
      const ht = item.unitPrice * item.quantity
      const tva = ht * (item.vatRate / 100)
      const ttc = ht + tva
      totalHT += ht
      totalTVA += tva
      totalTTC += ttc
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        totalHT: ht,
        totalTVA: tva,
        totalTTC: ttc,
      }
    })

    // 4. Création en base (inchangé sauf number utilisé)
    let newInvoice = await prisma.invoice.create({
      data: {
        number,
        userId,
        statut: "EN_ATTENTE",
        clientId: dbClient.id,
        clientName: client.name,
        clientAddress: client.address,
        clientZip: client.zip,
        clientCity: client.city,
        clientEmail: client.email,
        clientPhone: client.phone,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        iban,
        bic,
        totalHT,
        totalTVA,
        totalTTC,
        items: { createMany: { data: invoiceItems } },
      },
      include: { items: true, client: true },
    })

    // 5. Génération du PDF (inchangé)
    const htmlToUse = invoiceHtml || generateInvoiceHtml(newInvoice)
    const executablePath = await chromium.executablePath;
    console.log("chromium.executablePath =", executablePath);
    if (!executablePath) {
      throw new Error("Chromium executablePath not found! Check chrome-aws-lambda install.");
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
    });
    const page = await browser.newPage()
    await page.setContent(htmlToUse, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({ format: "A4" })
    await browser.close()

    const pdfDir = path.join(__dirname, "../../invoices_pdf")
    await fs.mkdir(pdfDir, { recursive: true })
    const pdfFilename = `${newInvoice.number}.pdf`
    const pdfPath = path.join(pdfDir, pdfFilename)
    await fs.writeFile(pdfPath, pdfBuffer)
    const pdfUrl = `/invoices/${newInvoice.number}.pdf`
    
    // Met à jour la facture avec le PDF
    newInvoice = await prisma.invoice.update({
      where: { id: newInvoice.id },
      data: { pdfPath: pdfFilename },
      include: { items: true, client: true },
    })

    res.status(201).json({
      ...newInvoice,
      pdfUrl: `/invoices/${newInvoice.number}.pdf`
    })
  } catch (error) {
    console.error('Erreur POST /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' })
  }
})

// PATCH /invoices/:id/statut — Changer le statut de la facture
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id
  const { statut } = req.body
  // On ne valide QUE les valeurs enum
  const allowedStatuts = ["PAYEE", "EN_ATTENTE", "ANNULE"];
  if (!allowedStatuts.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" })
  }
  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId, userId },
      data: { statut },
    })
    if (!invoice) return res.status(404).json({ error: "Facture introuvable" })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// GET /invoices/number/:number/pdf — Télécharge le PDF par numéro (ex: 2024-043)
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceNumber = req.params.id // c'est bien le NUMERO de facture ici (ex: 2024-045)

  // Cherche la facture par number et userId
  const invoice = await prisma.invoice.findFirst({
    where: { number: invoiceNumber, userId }
  })

  if (!invoice || !invoice.pdfPath) {
    return res.status(404).json({ error: "PDF non trouvé" })
  }

  const pdfFilePath = path.join(__dirname, "../../invoices_pdf", invoice.pdfPath)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="Facture-${invoice.number}.pdf"`)
  res.sendFile(path.resolve(pdfFilePath))
})

export default router
