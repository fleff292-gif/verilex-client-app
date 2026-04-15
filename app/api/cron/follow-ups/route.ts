import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin, type Matter } from "@/lib/supabase";
import firmConfig from "@/firm.config";

const resend = new Resend(process.env.RESEND_API_KEY);

// How many days before each follow-up triggers
const THRESHOLDS = {
  intakeStuck: 2,        // days at intake_received before nudging firm
  engagementUnsigned: 5, // days at engagement_sent before nudging client
  noActivity: 7,         // days with no stage change before alerting Franco
};

function daysSince(date: string): number {
  return (Date.now() - new Date(date).getTime()) / 86400000;
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call (or a manual trigger with secret)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: matters } = await supabaseAdmin
    .from("matters")
    .select("*")
    .neq("stage", "matter_open"); // ignore closed matters

  if (!matters?.length) return NextResponse.json({ ok: true, processed: 0 });

  const results: string[] = [];

  for (const rawMatter of matters) {
    const matter = rawMatter as Matter;
    const days = daysSince(matter.created_at);

    // 1 — Matter stuck at intake_received for 2+ days
    if (matter.stage === "intake_received" && days >= THRESHOLDS.intakeStuck) {
      const alreadySent = await hasFollowUpBeenSent(matter.id, "intake_stuck");
      if (!alreadySent) {
        await resend.emails.send({
          from: `Verilex <onboarding@resend.dev>`,
          to: [firmConfig.email],
          subject: `Action needed: ${matter.first_name} ${matter.last_name} is waiting`,
          html: firmNudgeEmail(matter, days),
        });
        await logFollowUp(matter.id, "intake_stuck");
        results.push(`intake_stuck: ${matter.first_name} ${matter.last_name}`);
      }
    }

    // 2 — Engagement letter unsigned for 5+ days
    if (matter.stage === "engagement_sent" && days >= THRESHOLDS.engagementUnsigned) {
      const alreadySent = await hasFollowUpBeenSent(matter.id, "engagement_unsigned");
      if (!alreadySent) {
        await resend.emails.send({
          from: `${firmConfig.name} <onboarding@resend.dev>`,
          to: [matter.email],
          subject: `Reminder: your engagement letter is waiting to be signed`,
          html: clientSigningReminderEmail(matter),
        });
        await logFollowUp(matter.id, "engagement_unsigned");
        results.push(`engagement_unsigned: ${matter.first_name} ${matter.last_name}`);
      }
    }

    // 3 — No activity for 7+ days — alert Franco
    if (days >= THRESHOLDS.noActivity) {
      const alreadySent = await hasFollowUpBeenSent(matter.id, "no_activity");
      if (!alreadySent) {
        await resend.emails.send({
          from: `Verilex System <onboarding@resend.dev>`,
          to: ["verilexagency@gmail.com"],
          subject: `⚠ Stale matter: ${matter.first_name} ${matter.last_name} — ${Math.round(days)} days`,
          html: staleAlertEmail(matter, days),
        });
        await logFollowUp(matter.id, "no_activity");
        results.push(`no_activity: ${matter.first_name} ${matter.last_name}`);
      }
    }
  }

  return NextResponse.json({ ok: true, processed: matters.length, sent: results });
}

// Track follow-ups in a separate table to avoid spamming
async function hasFollowUpBeenSent(matterId: string, type: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("follow_ups")
    .select("id")
    .eq("matter_id", matterId)
    .eq("type", type)
    .single();
  return !!data;
}

async function logFollowUp(matterId: string, type: string) {
  await supabaseAdmin.from("follow_ups").insert({ matter_id: matterId, type, sent_at: new Date().toISOString() });
}

// ─── Email templates ────────────────────────────────────────────────────────

function firmNudgeEmail(matter: Matter, days: number): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;">
      <div style="background:${firmConfig.primaryColor};padding:20px 28px;">
        <span style="font-family:Georgia,serif;font-weight:bold;font-size:16px;letter-spacing:4px;color:white;text-transform:uppercase;">${firmConfig.name}</span>
      </div>
      <div style="padding:32px 28px;">
        <h2 style="font-family:Georgia,serif;font-size:20px;color:#07111f;margin:0 0 12px;">Action needed: engagement letter</h2>
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
          <strong>${matter.first_name} ${matter.last_name}</strong> submitted their intake form ${Math.round(days)} days ago
          but their engagement letter hasn't been sent yet.
        </p>
        <div style="background:#f8f9fa;border-left:3px solid ${firmConfig.primaryColor};padding:14px 18px;margin:0 0 24px;">
          <p style="font-size:13px;color:#6b7280;margin:4px 0;"><strong style="color:#07111f;">Client:</strong> ${matter.first_name} ${matter.last_name}</p>
          <p style="font-size:13px;color:#6b7280;margin:4px 0;"><strong style="color:#07111f;">Matter:</strong> ${matter.matter_type}</p>
          <p style="font-size:13px;color:#6b7280;margin:4px 0;"><strong style="color:#07111f;">Email:</strong> ${matter.email}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/matters/${matter.id}" style="display:inline-block;background:${firmConfig.primaryColor};color:white;font-weight:600;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:12px 24px;text-decoration:none;">
          Open matter →
        </a>
      </div>
    </div>`;
}

function clientSigningReminderEmail(matter: Matter): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;">
      <div style="background:${firmConfig.primaryColor};padding:20px 28px;">
        <span style="font-family:Georgia,serif;font-weight:bold;font-size:16px;letter-spacing:4px;color:white;text-transform:uppercase;">${firmConfig.name}</span>
      </div>
      <div style="padding:32px 28px;">
        <h2 style="font-family:Georgia,serif;font-size:20px;color:#07111f;margin:0 0 12px;">Just a reminder, ${matter.first_name}</h2>
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
          Your engagement letter for your <strong>${matter.matter_type}</strong> matter is waiting for your signature.
          Once signed, we can open your file and get started right away.
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">
          Please check your email for the signing link, or reply to this message if you need it resent.
        </p>
        <p style="font-size:14px;color:#6b7280;">— ${firmConfig.name}<br/>
        <a href="mailto:${firmConfig.email}" style="color:#6b7280;">${firmConfig.email}</a> · ${firmConfig.phone}</p>
      </div>
    </div>`;
}

function staleAlertEmail(matter: Matter, days: number): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;background:#07111f;padding:28px;">
      <p style="font-family:Georgia,serif;font-size:18px;color:white;margin:0 0 16px;">⚠ Stale matter alert</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0 0 20px;">
        <strong style="color:white;">${matter.first_name} ${matter.last_name}</strong> has been stuck at
        <strong style="color:white;">${matter.stage.replace(/_/g, " ")}</strong> for <strong style="color:white;">${Math.round(days)} days</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px;width:120px;">Client</td><td style="padding:6px 0;color:white;font-size:13px;">${matter.first_name} ${matter.last_name}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px;">Email</td><td style="padding:6px 0;color:white;font-size:13px;">${matter.email}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px;">Matter</td><td style="padding:6px 0;color:white;font-size:13px;">${matter.matter_type}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px;">Stage</td><td style="padding:6px 0;color:#f59e0b;font-size:13px;font-weight:600;">${matter.stage.replace(/_/g, " ")}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/matters/${matter.id}" style="display:inline-block;background:white;color:#07111f;font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:12px 24px;text-decoration:none;">
        Take action →
      </a>
    </div>`;
}
