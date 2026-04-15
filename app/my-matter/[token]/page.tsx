import { supabaseAdmin } from "@/lib/supabase";
import firmConfig from "@/firm.config";
import { notFound } from "next/navigation";

const STAGE_INFO = [
  {
    key: "intake_received",
    label: "Enquiry received",
    description: "We've received your enquiry and a member of our team will be in touch within one business day.",
    next: "We will prepare and send your engagement letter shortly.",
  },
  {
    key: "engagement_sent",
    label: "Engagement letter sent",
    description: "Your engagement letter has been sent. Please check your email, read it carefully, and sign it to proceed.",
    next: "Once signed, we will open your file and begin work on your matter.",
  },
  {
    key: "signed",
    label: "Documents signed",
    description: "Your engagement letter has been signed. We are now preparing to open your file.",
    next: "Your matter will be formally opened and assigned to a lawyer shortly.",
  },
  {
    key: "matter_open",
    label: "Matter open",
    description: "Your matter is fully open. Your legal work is underway and your file has been created.",
    next: null,
  },
];

export default async function ClientPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: matter } = await supabaseAdmin
    .from("matters")
    .select("id, first_name, last_name, matter_type, stage, created_at")
    .eq("client_token", token)
    .single();

  if (!matter) notFound();

  const c = firmConfig.primaryColor;
  const stageIndex = STAGE_INFO.findIndex(s => s.key === matter.stage);
  const currentStage = STAGE_INFO[stageIndex] ?? STAGE_INFO[0];
  const isComplete = matter.stage === "matter_open";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Nav */}
      <nav style={{ background: c, padding: "0 32px", height: 56, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 10, color: "white" }}>{firmConfig.logoText}</span>
          </div>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: "white" }}>{firmConfig.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Greeting */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>Your matter</p>
        <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, fontWeight: 700, color: c, marginBottom: 4 }}>
          {matter.first_name} {matter.last_name}
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 36 }}>
          {matter.matter_type} · Submitted {new Date(matter.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Current status */}
        <div style={{ background: isComplete ? "#f0fdf4" : "white", border: `2px solid ${isComplete ? "#10b981" : c}`, padding: "28px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 10 }}>Current status</p>
          <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: isComplete ? "#10b981" : c, marginBottom: 12 }}>
            {isComplete ? "✓ " : ""}{currentStage.label}
          </h2>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: currentStage.next ? 16 : 0 }}>
            {currentStage.description}
          </p>
          {currentStage.next && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginTop: 4 }}>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                <strong style={{ color: "#07111f" }}>What happens next: </strong>{currentStage.next}
              </p>
            </div>
          )}
        </div>

        {/* Progress timeline */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 24 }}>Progress</p>
          <div>
            {STAGE_INFO.map((s, i) => {
              const done = i < stageIndex;
              const current = i === stageIndex;
              const upcoming = i > stageIndex;
              return (
                <div key={s.key} style={{ display: "flex", gap: 16, paddingBottom: i < STAGE_INFO.length - 1 ? 24 : 0, position: "relative" }}>
                  {/* Vertical line */}
                  {i < STAGE_INFO.length - 1 && (
                    <div style={{
                      position: "absolute", left: 10, top: 22, width: 2,
                      height: "calc(100% - 4px)",
                      background: done ? c : "#e5e7eb",
                    }} />
                  )}
                  {/* Circle */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                    background: done || current ? c : "white",
                    border: `2px solid ${done || current ? c : "#e5e7eb"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done && <span style={{ color: "white", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                    {current && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                  {/* Label */}
                  <div style={{ paddingTop: 1 }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: current ? 700 : 400,
                      color: current ? "#07111f" : done ? "#6b7280" : "#c4c8cd",
                    }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "24px 28px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Questions?</p>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 16 }}>
            Reply to any email we&apos;ve sent you, or reach us directly:
          </p>
          <p style={{ fontSize: 14, marginBottom: 4 }}>
            <a href={`mailto:${firmConfig.email}`} style={{ color: c, textDecoration: "none", fontWeight: 600 }}>{firmConfig.email}</a>
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>{firmConfig.phone}</p>
          <a href={firmConfig.calLink} style={{
            display: "inline-block", background: c, color: "white",
            fontWeight: 600, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "12px 24px", textDecoration: "none",
          }}>
            Book a call →
          </a>
        </div>
      </div>
    </div>
  );
}
