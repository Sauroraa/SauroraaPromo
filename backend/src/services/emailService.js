import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.us.appsuite.cloud',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.MAIL_USER || 'contact@sauroraa.be',
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const FROM = process.env.MAIL_FROM || 'Promoteam <noreply@sauroraa.be>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://promoteam.sauroraa.be';

// Verify SMTP connection at startup (non-blocking)
transporter.verify().then(() => {
  logger.info('SMTP connection verified');
}).catch(err => {
  logger.warn('SMTP connection failed — emails disabled:', err.message);
});

async function send({ to, subject, html }) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
    throw err;
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #1e293b; border-radius: 12px; padding: 36px; border: 1px solid #334155; }
    .logo { color: #60a5fa; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 32px; }
    h2 { color: #f1f5f9; font-size: 20px; margin: 0 0 16px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .highlight { color: #f1f5f9; font-weight: 600; }
    .btn { display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .badge-green { background: #052e16; color: #4ade80; }
    .badge-red { background: #450a0a; color: #f87171; }
    .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
    .footer { color: #475569; font-size: 12px; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">Promoteam</div>
      <div class="subtitle">promoteam.sauroraa.be</div>
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Sauroraa Records ·
      <a href="${FRONTEND_URL}" style="color:#3b82f6;text-decoration:none;">promoteam.sauroraa.be</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Public functions ────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ email, firstName }) {
  await send({
    to: email,
    subject: 'Bienvenue sur Promoteam !',
    html: baseTemplate(`
      <h2>Bienvenue, ${firstName} !</h2>
      <p>Ton compte promoteur a été créé avec succès.</p>
      <p>Tu peux dès maintenant te connecter, voir les missions actives et soumettre tes preuves pour gagner des points.</p>
      <a href="${FRONTEND_URL}/dashboard" class="btn">Accéder au dashboard</a>
      <hr class="divider">
      <p style="font-size:13px;">Si tu n'as pas créé ce compte, ignore cet email.</p>
    `)
  });
}

export async function sendProofApprovedEmail({ email, firstName, missionTitle, pointsAwarded, totalPoints }) {
  await send({
    to: email,
    subject: `✅ Preuve approuvée — +${pointsAwarded} points`,
    html: baseTemplate(`
      <h2>Ta preuve a été approuvée !</h2>
      <p>Bonne nouvelle, <span class="highlight">${firstName}</span> !</p>
      <p>
        Ta preuve pour la mission <span class="highlight">${missionTitle}</span> a été validée par un admin.
      </p>
      <p>
        <span class="badge badge-green">+${pointsAwarded} points ajoutés</span>
      </p>
      <p>Tu as maintenant <span class="highlight">${totalPoints} points</span> au total.</p>
      <a href="${FRONTEND_URL}/leaderboard" class="btn">Voir le classement</a>
      <hr class="divider">
      <p style="font-size:13px;">Continue à soumettre des preuves pour monter dans le classement !</p>
    `)
  });
}

export async function sendProofRejectedEmail({ email, firstName, missionTitle, reason }) {
  await send({
    to: email,
    subject: `❌ Preuve refusée — ${missionTitle}`,
    html: baseTemplate(`
      <h2>Ta preuve a été refusée</h2>
      <p>Bonjour <span class="highlight">${firstName}</span>,</p>
      <p>
        Ta preuve pour la mission <span class="highlight">${missionTitle}</span> a été refusée.
      </p>
      ${reason ? `
      <p>
        <span class="badge badge-red">Raison</span>
      </p>
      <p style="background:#1a1a2e;border-left:3px solid #f87171;padding:12px 16px;border-radius:4px;">
        ${reason}
      </p>` : ''}
      <a href="${FRONTEND_URL}/missions" class="btn">Voir les missions</a>
      <hr class="divider">
      <p style="font-size:13px;">Tu peux soumettre une nouvelle preuve pour une autre mission.</p>
    `)
  });
}

export async function sendInviteEmail({ to, inviteToken, inviteCode, expiresAt, createdByName }) {
  const expireDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const registerUrl = `${FRONTEND_URL}/register?token=${inviteToken}`;

  await send({
    to,
    subject: 'Invitation à rejoindre Promoteam',
    html: baseTemplate(`
      <h2>Tu es invité(e) !</h2>
      <p>${createdByName} t'invite à rejoindre <span class="highlight">Promoteam</span>, la plateforme de gestion de promoteurs Instagram.</p>
      ${inviteCode ? '<p>Utilise le code ci-dessous pour créer ton compte :</p>' : ''}
      ${inviteCode ? `
      <p style="background:#1e3a5f;border-radius:8px;padding:16px;font-size:24px;font-weight:700;letter-spacing:4px;color:#60a5fa;text-align:center;">
        ${inviteCode}
      </p>` : ''}
      <p style="font-size:13px;color:#64748b;">Expire le ${expireDate}</p>
      <a href="${registerUrl}" class="btn">Créer mon compte</a>
    `)
  });
}

export async function sendPasswordResetEmail({ to, firstName, resetToken }) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  await send({
    to,
    subject: 'Reinitialisation de votre mot de passe Promoteam',
    html: baseTemplate(`
      <h2>Reinitialisation du mot de passe</h2>
      <p>Bonjour <span class="highlight">${firstName || 'Utilisateur'}</span>,</p>
      <p>
        Une demande de reinitialisation de mot de passe a ete effectuee pour votre compte Promoteam.
      </p>
      <p>Ce lien est valide pendant 60 minutes.</p>
      <a href="${resetUrl}" class="btn">Reinitialiser mon mot de passe</a>
      <hr class="divider">
      <p style="font-size:13px;">
        Si vous n'etes pas a l'origine de cette demande, ignorez simplement cet email.
      </p>
    `)
  });
}
