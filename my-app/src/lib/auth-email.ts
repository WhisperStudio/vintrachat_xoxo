import { siteConfig } from "@/lib/site-config";

type AuthEmailTemplateArgs = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  supportLabel: string;
  supportValue: string;
  note: string;
  recipientName?: string;
  language?: 'no' | 'en';
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAuthEmailTemplate({
  preheader,
  eyebrow,
  title,
  intro,
  ctaLabel,
  ctaHref,
  supportLabel,
  supportValue,
  note,
  recipientName,
  language,
}: AuthEmailTemplateArgs) {
  const no = language === 'no';
  const greeting = recipientName?.trim() ? `${no ? 'Hei' : 'Hi'} ${recipientName.trim()},` : (no ? 'Hei,' : 'Hi,');
  const fallback = no ? 'Virker ikke knappen? Åpne denne lenken i nettleseren:' : 'Button not working? Open this link in your browser:';
  const ignore = no ? 'Har du ikke bedt om dette, kan du se bort fra denne e-posten.' : 'If you did not request this, you can ignore this email.';
  const safeHref = escapeHtml(ctaHref);
  return `<!doctype html>
<html lang="${no ? 'nb' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f5f7;color:#172d3a;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
<tr><td style="padding:0 0 24px;font-size:24px;font-weight:700;">Vintra<span style="color:#326989;">Chat</span></td></tr>
<tr><td bgcolor="#ffffff" style="padding:32px 24px;border:1px solid #e2e7ec;border-radius:12px;">
<p style="margin:0 0 18px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#607482;">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
<p style="font-size:16px;line-height:1.6;">${escapeHtml(greeting)}</p>
<p style="font-size:16px;line-height:1.6;color:#465d6b;">${escapeHtml(intro)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td bgcolor="#285f80" style="border-radius:8px;text-align:center;mso-padding-alt:16px 24px;">
<a href="${safeHref}" style="display:inline-block;background:#285f80;border:1px solid #285f80;border-radius:8px;padding:16px 24px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
</td></tr></table>
<p style="font-size:14px;line-height:1.6;color:#607482;">${escapeHtml(note)}</p>
<hr style="border:0;border-top:1px solid #e2e7ec;margin:24px 0;">
<p style="font-size:12px;line-height:1.7;color:#607482;">${fallback}<br><a href="${safeHref}" style="color:#285f80;word-break:break-all;overflow-wrap:anywhere;">${safeHref}</a></p>
</td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.7;color:#607482;">${ignore}<br>${escapeHtml(supportLabel)} ${escapeHtml(supportValue)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function buildVerificationEmail(args: {
  verificationLink: string;
  recipientName?: string;
  language?: 'no' | 'en';
}) {
  const no = args.language === 'no';
  const subject = no ? 'Bekreft e-postadressen din – VintraChat' : 'Verify your email address – VintraChat';
  const intro = no ? 'Bekreft e-postadressen din for å gjøre kontoen klar. Deretter kan du fortsette til VintraChat.' : 'Confirm your email address to finish setting up your account. Then you can continue to VintraChat.';
  const note = no ? 'Lenken er gyldig i 24 timer. Hvis du allerede er innlogget i samme nettleser, åpnes kontoen automatisk etter bekreftelsen.' : 'This link is valid for 24 hours. If you’re signed in using the same browser, your account opens automatically after confirmation.';
  return {
    subject,
    text: `${subject}\n\n${intro}\n\n${args.verificationLink}\n\n${note}\n\n${no ? 'Har du ikke bedt om dette, kan du se bort fra denne e-posten.' : 'If you did not request this, ignore this email.'}\n${siteConfig.contact.email}`,
    html: buildAuthEmailTemplate({
      language: args.language, preheader: subject,
      eyebrow: no ? 'Din konto' : 'Your account',
      title: no ? 'Velkommen til VintraChat.' : 'Welcome to VintraChat.',
      intro, note,
      ctaLabel: no ? 'Bekreft e-postadresse' : 'Verify email address',
      ctaHref: args.verificationLink,
      supportLabel: no ? 'Trenger du hjelp?' : 'Need help?',
      supportValue: siteConfig.contact.email,
      recipientName: args.recipientName,
    }),
  };
}

export function buildPasswordResetEmail(args: {
  resetLink: string;
  recipientName?: string;
}) {
  return {
    subject: "Reset your Vintra password",
    html: buildAuthEmailTemplate({
      preheader: "Reset your Vintra password securely.",
      eyebrow: "Password reset",
      title: "Create a new password",
      intro:
        "We received a request to reset the password for your Vintra account. Use the secure link below to choose a new one.",
      ctaLabel: "Reset password",
      ctaHref: args.resetLink,
      supportLabel: "Security note",
      supportValue: "This reset link expires in 1 hour for your protection.",
      note:
        "If you requested this change, continue below. If not, you can ignore this email and your password will stay the same.",
      recipientName: args.recipientName,
    }),
  };
}
