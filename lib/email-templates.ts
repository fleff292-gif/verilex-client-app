import firmConfig from "@/firm.config";
import type { Matter } from "./supabase";

const header = () => `
  <div style="background:${firmConfig.primaryColor};padding:20px 28px;">
    <span style="font-family:Georgia,serif;font-weight:bold;font-size:18px;letter-spacing:4px;color:white;text-transform:uppercase;">${firmConfig.name}</span>
  </div>`;

const footer = () => `
  <div style="padding:20px 28px;border-top:1px solid #e5e7eb;margin-top:8px;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} ${firmConfig.name}. All rights reserved.</p>
  </div>`;

export function intakeConfirmationEmail(matter: Pick<Matter, "first_name" | "last_name" | "email" | "matter_type">, portalUrl?: string) {
  return {
    subject: `We've received your enquiry — ${firmConfig.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;">
        ${header()}
        <div style="padding:36px 28px;">
          <h2 style="font-family:Georgia,serif;font-size:24px;color:#07111f;margin:0 0 16px;">Thanks, ${matter.first_name}.</h2>
          <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">We've received your enquiry and a member of our team will be in touch within one business day.</p>
          <div style="background:#f8f9fa;border-left:3px solid ${firmConfig.primaryColor};padding:16px 20px;margin:0 0 28px;">
            <p style="font-size:13px;color:#6b7280;margin:4px 0;"><strong style="color:#07111f;">Name:</strong> ${matter.first_name} ${matter.last_name}</p>
            <p style="font-size:13px;color:#6b7280;margin:4px 0;"><strong style="color:#07111f;">Matter type:</strong> ${matter.matter_type}</p>
          </div>
          ${portalUrl ? `
          <p style="font-size:14px;color:#374151;margin:0 0 12px;font-weight:600;">Track your matter online</p>
          <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">You can check the status of your matter at any time using the link below — no login required.</p>
          <a href="${portalUrl}" style="display:inline-block;background:${firmConfig.primaryColor};color:white;font-weight:600;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 28px;text-decoration:none;margin-bottom:28px;">Track your matter →</a>
          <p style="font-size:13px;color:#9ca3af;margin:0 0 28px;">Or copy this link: <span style="color:#6b7280;">${portalUrl}</span></p>
          ` : `
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">In the meantime, you can book a call with us directly:</p>
          <a href="${firmConfig.calLink}" style="display:inline-block;background:${firmConfig.primaryColor};color:white;font-weight:600;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 28px;text-decoration:none;margin-bottom:28px;">Book a call</a>
          `}
          <p style="font-size:14px;color:#6b7280;margin:0;">— ${firmConfig.name}<br/><a href="mailto:${firmConfig.email}" style="color:#6b7280;">${firmConfig.email}</a></p>
        </div>
        ${footer()}
      </div>`,
  };
}

export function firmNotificationEmail(matter: Matter) {
  return {
    subject: `New intake: ${matter.first_name} ${matter.last_name} — ${matter.matter_type}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;">
        ${header()}
        <div style="padding:28px;">
          <h2 style="font-family:Georgia,serif;color:#07111f;margin:0 0 20px;">New intake submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row("Name", `${matter.first_name} ${matter.last_name}`)}
            ${row("Email", `<a href="mailto:${matter.email}">${matter.email}</a>`)}
            ${row("Phone", matter.phone || "—")}
            ${row("Matter type", matter.matter_type)}
            ${row("Details", matter.details || "—")}
            ${row("Submitted", new Date(matter.created_at).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))}
          </table>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" style="display:inline-block;margin-top:24px;background:${firmConfig.primaryColor};color:white;font-weight:600;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 28px;text-decoration:none;">View in portal →</a>
        </div>
        ${footer()}
      </div>`,
  };
}

export function milestoneEmail(matter: Matter, stageName: string, stageMessage: string) {
  return {
    subject: `Update on your matter — ${firmConfig.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;">
        ${header()}
        <div style="padding:36px 28px;">
          <h2 style="font-family:Georgia,serif;font-size:24px;color:#07111f;margin:0 0 16px;">An update on your matter</h2>
          <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">Hi ${matter.first_name}, we wanted to keep you updated on where things stand.</p>
          <div style="background:#f8f9fa;border-left:3px solid ${firmConfig.primaryColor};padding:16px 20px;margin:0 0 28px;">
            <p style="font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;margin:0 0 6px;">Current status</p>
            <p style="font-size:16px;font-weight:700;color:#07111f;margin:0 0 6px;">${stageName}</p>
            <p style="font-size:14px;color:#6b7280;margin:0;">${stageMessage}</p>
          </div>
          <p style="font-size:14px;color:#6b7280;margin:0 0 8px;">If you have any questions, reply to this email or call us on ${firmConfig.phone}.</p>
          <p style="margin-top:32px;font-size:14px;color:#6b7280;">— ${firmConfig.name}<br/><a href="mailto:${firmConfig.email}" style="color:#6b7280;">${firmConfig.email}</a></p>
        </div>
        ${footer()}
      </div>`,
  };
}

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;">${label}</td><td style="padding:8px 0;color:#07111f;font-size:13px;">${value}</td></tr>`;
}
