import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin, STAGES, type Matter } from "@/lib/supabase";
import { milestoneEmail } from "@/lib/email-templates";
import firmConfig from "@/firm.config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { matterId, newStage } = await req.json();

    const stageInfo = STAGES.find(s => s.key === newStage);
    if (!stageInfo) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    // Update in Supabase
    const { data: rawMatter, error } = await supabaseAdmin
      .from("matters")
      .update({ stage: newStage })
      .eq("id", matterId)
      .select()
      .single();

    if (error) throw error;

    const matter = rawMatter as Matter;
    const tpl = milestoneEmail(matter, stageInfo.label, stageInfo.description);
    await resend.emails.send({
      from: `${firmConfig.name} <onboarding@resend.dev>`,
      to: [matter.email],
      subject: tpl.subject,
      html: tpl.html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
