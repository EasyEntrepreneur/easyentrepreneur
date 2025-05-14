import nodemailer from 'nodemailer';

export async function sendValidationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const validationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/confirm-email?token=${token}`;

  await transporter.sendMail({
    from: `"EasyEntrepreneur" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Confirmez votre adresse email',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Bienvenue sur EasyEntrepreneur 👋</h2>
        <p>Merci de vous être inscrit. Veuillez cliquer sur le bouton ci-dessous pour valider votre adresse email :</p>
        <p><a href="${validationUrl}" style="background-color: #1e40af; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Valider mon adresse</a></p>
        <p style="font-size: 0.9em; color: #555;">Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.</p>
      </div>
    `,
  });
}
