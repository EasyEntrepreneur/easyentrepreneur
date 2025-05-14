// backend/src/utils/sendEmail.ts
import nodemailer from 'nodemailer';

export async function sendConfirmationEmail(to: string, name: string, plan: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // ou Mailgun, Sendinblue, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"EasyEntrepreneur" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Confirmation de votre paiement",
    html: `<p>Bonjour ${name},</p>
           <p>Merci pour votre achat du plan <strong>${plan}</strong>.</p>
           <p>Votre accès est désormais actif.</p>`
  });
}
