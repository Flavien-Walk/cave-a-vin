const BREVO_API_KEY    = process.env.BREVO_API_KEY;
const SENDER_EMAIL     = process.env.BREVO_SENDER_EMAIL || 'cavevin76@gmail.com';
const SENDER_NAME      = 'Cave à Vin';

// ── Envoi générique via Brevo REST ────────────────────────────────────────────
async function sendEmail({ to, toName, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY manquant — email non envoyé');
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
      to:          [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Brevo ${res.status}: ${err.message ?? 'erreur inconnue'}`);
  }
}

// ── Email de bienvenue ────────────────────────────────────────────────────────
function sendWelcomeEmail(user) {
  return sendEmail({
    to:      user.email,
    toName:  user.name,
    subject: 'Bienvenue dans votre Cave à Vin 🍷',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFDF8;border-radius:16px;overflow:hidden;border:1px solid #E8DDD0;">

        <!-- Header bordeaux -->
        <tr>
          <td style="background:#6B1A2A;padding:36px 40px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🍷</div>
            <h1 style="margin:0;color:#FFFDF8;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Cave à Vin</h1>
            <p style="margin:6px 0 0;color:rgba(255,253,248,0.7);font-size:14px;">Votre cave, vos règles.</p>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#2C1A0E;font-weight:700;">
              Bienvenue, ${user.name} !
            </h2>
            <p style="margin:0 0 20px;font-size:15px;color:#6B4E3D;line-height:1.6;">
              Votre cave numérique est prête. Commencez à y ajouter vos bouteilles,
              suivre vos millésimes et découvrir les meilleures associations mets-vins.
            </p>

            <!-- Encadré fonctionnalités -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF5E6;border-radius:12px;border:1px solid #E8C97A40;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#8B7355;letter-spacing:0.8px;text-transform:uppercase;">Ce que vous pouvez faire</p>
                ${featureRow('🍾', 'Gérer votre cave', 'Ajoutez, organisez et suivez vos bouteilles')}
                ${featureRow('📸', 'Scanner les étiquettes', 'Reconnaissance automatique par photo')}
                ${featureRow('📊', 'Consulter vos stats', 'Valeur estimée, répartition, millésimes')}
                ${featureRow('🍽️', 'Accords mets-vins', 'Suggestions personnalisées pour vos repas')}
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9C8573;line-height:1.5;">
              Si vous n'avez pas créé ce compte, ignorez simplement cet email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9F5F0;padding:20px 40px;text-align:center;border-top:1px solid #E8DDD0;">
            <p style="margin:0;font-size:12px;color:#B5A090;">
              © ${new Date().getFullYear()} Cave à Vin — Application mobile de gestion de cave
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

function featureRow(emoji, title, desc) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr>
        <td width="32" style="vertical-align:top;padding-top:2px;font-size:18px;">${emoji}</td>
        <td>
          <span style="font-size:14px;font-weight:600;color:#2C1A0E;">${title}</span>
          <br><span style="font-size:13px;color:#6B4E3D;">${desc}</span>
        </td>
      </tr>
    </table>`;
}

// ── Email de réinitialisation ─────────────────────────────────────────────────
function sendResetCodeEmail(user, code) {
  return sendEmail({
    to:      user.email,
    toName:  user.name,
    subject: 'Réinitialisation de votre mot de passe — Cave à Vin',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFDF8;border-radius:16px;overflow:hidden;border:1px solid #E8DDD0;">

        <!-- Header -->
        <tr>
          <td style="background:#6B1A2A;padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🔐</div>
            <h1 style="margin:0;color:#FFFDF8;font-size:22px;font-weight:800;">Réinitialisation</h1>
            <p style="margin:6px 0 0;color:rgba(255,253,248,0.7);font-size:14px;">Cave à Vin</p>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <p style="margin:0 0 24px;font-size:15px;color:#6B4E3D;line-height:1.6;text-align:left;">
              Bonjour <strong style="color:#2C1A0E;">${user.name}</strong>,<br><br>
              Voici votre code de réinitialisation. Il est valable <strong>15 minutes</strong>.
            </p>

            <!-- Code OTP -->
            <div style="background:#F9F5F0;border:2px dashed #6B1A2A40;border-radius:16px;padding:28px 24px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#8B7355;letter-spacing:1px;text-transform:uppercase;">Votre code</p>
              <div style="font-size:42px;font-weight:800;color:#6B1A2A;letter-spacing:12px;font-family:'Courier New',monospace;">
                ${code}
              </div>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3F3;border-radius:10px;border:1px solid #E5534B30;margin-bottom:24px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#C0392B;line-height:1.5;">
                  ⚠️ Ce code expire dans <strong>15 minutes</strong>. Ne le partagez avec personne.
                </p>
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9C8573;line-height:1.5;text-align:left;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email —
              votre mot de passe ne sera pas modifié.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9F5F0;padding:20px 40px;text-align:center;border-top:1px solid #E8DDD0;">
            <p style="margin:0;font-size:12px;color:#B5A090;">
              © ${new Date().getFullYear()} Cave à Vin — Application mobile de gestion de cave
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ── Email de vérification avant inscription ───────────────────────────────────
function sendVerificationCodeEmail(email, code) {
  return sendEmail({
    to:      email,
    toName:  email,
    subject: 'Votre code de vérification — Cave à Vin',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFDF8;border-radius:16px;overflow:hidden;border:1px solid #E8DDD0;">
        <tr>
          <td style="background:#6B1A2A;padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🍷</div>
            <h1 style="margin:0;color:#FFFDF8;font-size:22px;font-weight:800;">Vérification de compte</h1>
            <p style="margin:6px 0 0;color:rgba(255,253,248,0.7);font-size:14px;">Cave à Vin</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <p style="margin:0 0 24px;font-size:15px;color:#6B4E3D;line-height:1.6;text-align:left;">
              Voici votre code de vérification pour créer votre compte. Il est valable <strong>15 minutes</strong>.
            </p>
            <div style="background:#F9F5F0;border:2px dashed #6B1A2A40;border-radius:16px;padding:28px 24px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#8B7355;letter-spacing:1px;text-transform:uppercase;">Votre code</p>
              <div style="font-size:42px;font-weight:800;color:#6B1A2A;letter-spacing:12px;font-family:'Courier New',monospace;">
                ${code}
              </div>
            </div>
            <p style="margin:0;font-size:13px;color:#9C8573;line-height:1.5;text-align:left;">
              Si vous n'avez pas demandé la création d'un compte, ignorez cet email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F9F5F0;padding:20px 40px;text-align:center;border-top:1px solid #E8DDD0;">
            <p style="margin:0;font-size:12px;color:#B5A090;">
              © ${new Date().getFullYear()} Cave à Vin — Application mobile de gestion de cave
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendWelcomeEmail, sendResetCodeEmail, sendVerificationCodeEmail };
