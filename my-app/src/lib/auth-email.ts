import { absoluteUrl, siteConfig } from "@/lib/site-config";

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
}: AuthEmailTemplateArgs) {
  const safeName = recipientName ? escapeHtml(recipientName.trim()) : "";
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const appUrl = siteConfig.url;
  const logoUrl = absoluteUrl("/image/logo.png");
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeSupportLabel = escapeHtml(supportLabel);
  const safeSupportValue = escapeHtml(supportValue);
  const safeNote = escapeHtml(note);
  const safeHref = escapeHtml(ctaHref);
  const safeAppUrl = escapeHtml(appUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safePreheader = escapeHtml(preheader);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;padding:0;background:#eef4ff;color:#0f172a;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${safePreheader}
        </div>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#eef4ff;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px;">
                <tr>
                  <td style="padding-bottom:18px;text-align:center;">
                    <a href="${safeAppUrl}" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;color:#0f172a;">
                      <img src="${safeLogoUrl}" alt="Vintra logo" width="40" height="40" style="display:block;border-radius:12px;" />
                      <span style="font-size:18px;font-weight:700;letter-spacing:0.02em;">Vintra</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);border-radius:30px 30px 0 0;padding:34px 36px 28px;color:#ffffff;">
                    <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                      ${safeEyebrow}
                    </div>
                    <h1 style="margin:18px 0 12px;font-size:34px;line-height:1.1;font-weight:800;letter-spacing:-0.04em;">
                      ${safeTitle}
                    </h1>
                    <p style="margin:0;max-width:470px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.88);">
                      ${safeIntro}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;border:1px solid rgba(148,163,184,0.25);border-top:none;border-radius:0 0 30px 30px;padding:34px 36px 30px;">
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">
                      ${greeting}
                    </p>
                    <p style="margin:0 0 26px;font-size:16px;line-height:1.7;color:#334155;">
                      ${safeNote}
                    </p>
                    <table role="presentation" cellPadding="0" cellSpacing="0" style="margin:0 0 26px;">
                      <tr>
                        <td>
                          <a
                            href="${safeHref}"
                            style="display:inline-block;padding:15px 24px;border-radius:16px;background:linear-gradient(135deg,#2563eb 0%,#38bdf8 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 16px 30px rgba(37,99,235,0.24);"
                          >
                            ${safeCtaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="padding:18px 20px;border-radius:20px;background:#f8fbff;border:1px solid #dbeafe;">
                      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;">
                        Secure link
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;word-break:break-word;">
                        If the button does not work, copy this link into your browser:<br />
                        <a href="${safeHref}" style="color:#1d4ed8;text-decoration:none;">${safeHref}</a>
                      </p>
                    </div>
                    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="margin-top:26px;">
                      <tr>
                        <td style="padding:18px 20px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">
                            ${safeSupportLabel}
                          </p>
                          <p style="margin:0;font-size:15px;line-height:1.6;color:#0f172a;">
                            ${safeSupportValue}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
                      You received this email because an action was requested for your Vintra account. If this was not you, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildVerificationEmail(args: {
  verificationLink: string;
  recipientName?: string;
}) {
  return {
    subject: "Verify your Vintra email address",
    html: buildAuthEmailTemplate({
      preheader: "Verify your email to activate your Vintra account.",
      eyebrow: "Verify account",
      title: "Welcome to Vintra",
      intro:
        "Confirm your email address to finish setup and unlock your workspace, website tools, and AI support features.",
      ctaLabel: "Verify email address",
      ctaHref: args.verificationLink,
      supportLabel: "Need help?",
      supportValue: `${siteConfig.contact.email} | ${siteConfig.contact.phoneDisplay}`,
      note:
        "Use the button below to verify your address. For your security, this link should only be used by the person who created the account.",
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
