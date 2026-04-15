import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { intakeConfirmationEmail, firmNotificationEmail } from "@/lib/email-templates";
import firmConfig from "@/firm.config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, matterType, details } = await req.json();

    // Save to Supabase
    const { data: matter, error } = await supabaseAdmin
      .from("matters")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        matter_type: matterType,
        details: details || null,
        stage: "intake_received",
      })
      .select()
      .single();

    if (error) throw error;

    // Build client portal URL using the token Postgres generated
    const portalUrl = matter.client_token
      ? `${process.env.NEXT_PUBLIC_APP_URL}/my-matter/${matter.client_token}`
      : undefined;

    // Send emails in parallel
    const clientTpl = intakeConfirmationEmail({ first_name: firstName, last_name: lastName, email, matter_type: matterType }, portalUrl);
    const firmTpl = firmNotificationEmail(matter);

    await Promise.all([
      resend.emails.send({
        from: `${firmConfig.name} <onboarding@resend.dev>`,
        to: [email],
        subject: clientTpl.subject,
        html: clientTpl.html,
      }),
      resend.emails.send({
        from: `${firmConfig.name} <onboarding@resend.dev>`,
        to: [firmConfig.email],
        subject: firmTpl.subject,
        html: firmTpl.html,
      }),
    ]);

    return NextResponse.json({ ok: true, id: matter.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
