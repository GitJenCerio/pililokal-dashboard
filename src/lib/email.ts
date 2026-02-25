import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_NAME = process.env.APP_NAME ?? "Pililokal Dashboard";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendInviteEmail(params: {
  to: string;
  name: string;
  tempPassword: string;
  role: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `You're invited to ${APP_NAME}`,
      html: `
        <p>Hi ${params.name},</p>
        <p>You've been invited to <strong>${APP_NAME}</strong> with the role <strong>${params.role}</strong>.</p>
        <p>Your temporary password is: <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">${params.tempPassword}</code></p>
        <p>Sign in at: <a href="${APP_URL}">${APP_URL}</a></p>
        <p>Please change your password after your first login.</p>
      `,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}
