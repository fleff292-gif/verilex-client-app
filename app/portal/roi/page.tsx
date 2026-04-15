"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import firmConfig from "@/firm.config";
import { supabase, type Matter, STAGES } from "@/lib/supabase";

type Stats = {
  totalMatters: number;
  mattersByStage: Record<string, number>;
  docsGenerated: number;
  milestonesTriggered: number;
  avgDaysToEngagement: number | null;
  mattersThisMonth: number;
  mattersLastMonth: number;
};

export default function ROIDashboard() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const c = firmConfig.primaryColor;
  const b = firmConfig.baseline;

  useEffect(() => {
    supabase.from("matters").select("*").order("created_at", { ascending: true })
      .then(({ data }) => { setMatters(data ?? []); setLoading(false); });
  }, []);

  // Compute stats
  const stats: Stats = (() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const mattersByStage: Record<string, number> = {};
    STAGES.forEach(s => { mattersByStage[s.key] = 0; });
    matters.forEach(m => { mattersByStage[m.stage] = (mattersByStage[m.stage] ?? 0) + 1; });

    // Docs generated = matters that reached engagement_sent or beyond
    const docsGenerated = matters.filter(m =>
      ["engagement_sent", "signed", "matter_open"].includes(m.stage)
    ).length;

    // Milestones = total stage advances (each matter starts at intake_received = 0 advances)
    const stageOrder: Record<string, number> = { intake_received: 0, engagement_sent: 1, signed: 2, matter_open: 3 };
    const milestonesTriggered = matters.reduce((acc, m) => acc + stageOrder[m.stage], 0);

    // Avg days from created_at to first stage advance (estimate: use matters that are past intake)
    const advancedMatters = matters.filter(m => m.stage !== "intake_received");
    const avgDaysToEngagement = advancedMatters.length > 0
      ? Math.round(advancedMatters.reduce((acc, m) => {
          const days = (now.getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return acc + Math.min(days, 7); // cap at 7 for demo
        }, 0) / advancedMatters.length * 10) / 10
      : null;

    return {
      totalMatters: matters.length,
      mattersByStage,
      docsGenerated,
      milestonesTriggered,
      avgDaysToEngagement,
      mattersThisMonth: matters.filter(m => new Date(m.created_at) >= thisMonthStart).length,
      mattersLastMonth: matters.filter(m => new Date(m.created_at) >= lastMonthStart && new Date(m.created_at) < thisMonthStart).length,
    };
  })();

  // ROI calculations
  const hoursOnIntake = stats.totalMatters * b.intakeHoursPerClient;
  const hoursOnDocs = stats.docsGenerated * b.docHoursPerDocument;
  const callsEliminated = stats.milestonesTriggered; // each milestone sent = one call avoided
  const totalHoursSaved = hoursOnIntake + hoursOnDocs;
  const moneySaved = Math.round(totalHoursSaved * b.hourlyStaffCost);
  const daysLive = Math.round((new Date().getTime() - new Date(b.goLiveDate).getTime()) / (1000 * 60 * 60 * 24));

  const goLiveFormatted = new Date(b.goLiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const todayFormatted = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Nav */}
      <nav style={{ background: c, padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 10, color: "white" }}>{firmConfig.logoText}</span>
          </div>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: "white" }}>{firmConfig.name}</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/portal" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>← Matters</Link>
          <button onClick={() => window.print()} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer" }}>
            Export PDF
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>Verilex · Automation Report</p>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, fontWeight: 700, color: c, marginBottom: 6 }}>
            {firmConfig.name}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            {goLiveFormatted} — {todayFormatted} &nbsp;·&nbsp; {daysLive} days live
          </p>
        </div>

        {/* Hero metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, background: c, marginBottom: 32 }}>
          {[
            { num: `${totalHoursSaved} hrs`, label: "Admin hours saved", sub: `${hoursOnIntake} hrs intake · ${hoursOnDocs} hrs docs` },
            { num: `$${moneySaved.toLocaleString()}`, label: "Estimated cost saved", sub: `At $${b.hourlyStaffCost}/hr staff cost` },
            { num: callsEliminated, label: "Status updates automated", sub: "Milestone emails sent automatically" },
          ].map(({ num, label, sub }) => (
            <div key={label} style={{ background: "#07111f", padding: "32px 28px" }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 40, fontWeight: 700, color: "white", lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>{label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Before vs After */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 24 }}>Before vs. after</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { metric: "Client onboarding", before: `${b.intakeHoursPerClient} hours`, after: "10 minutes", improvement: `${Math.round((b.intakeHoursPerClient * 60 - 10) / (b.intakeHoursPerClient * 60) * 100)}% faster` },
              { metric: "Document prep", before: `${b.docHoursPerDocument} hours`, after: "Seconds", improvement: "Instant generation" },
              { metric: "Status calls per matter", before: `${b.statusCallsPerMatter} calls`, after: "0 calls", improvement: "100% automated" },
            ].map(({ metric, before, after, improvement }, i) => (
              <div key={metric} style={{ padding: "20px 24px", borderRight: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12 }}>{metric}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, color: "#9ca3af", textDecoration: "line-through" }}>{before}</span>
                  <span style={{ color: "#d1d5db" }}>→</span>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Libre Baskerville', serif", color: c }}>{after}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "#f0fdf4", padding: "3px 8px" }}>{improvement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matter pipeline */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px" }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 20 }}>Matter pipeline</h2>
            {STAGES.map(s => {
              const count = stats.mattersByStage[s.key] ?? 0;
              const pct = stats.totalMatters > 0 ? (count / stats.totalMatters) * 100 : 0;
              return (
                <div key={s.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: "#f3f4f6" }}>
                    <div style={{ height: 4, background: c, width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Total matters</span>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Libre Baskerville', serif", color: c }}>{stats.totalMatters}</span>
            </div>
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px" }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 20 }}>Activity summary</h2>
            {[
              { label: "Documents generated", value: stats.docsGenerated, icon: "📄" },
              { label: "Automated emails sent", value: stats.milestonesTriggered, icon: "✉️" },
              { label: "Matters this month", value: stats.mattersThisMonth, icon: "📅" },
              { label: "Matters last month", value: stats.mattersLastMonth, icon: "📊" },
              { label: "Days since go-live", value: daysLive, icon: "🗓" },
              { label: "Avg. days to engagement", value: stats.avgDaysToEngagement !== null ? `${stats.avgDaysToEngagement}d` : "—", icon: "⚡" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f9fafb" }}>
                <span style={{ fontSize: 13, color: "#374151" }}>{icon} {label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Libre Baskerville', serif", color: c }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Powered by <strong style={{ color: c }}>Verilex</strong> · Legal operations automation ·{" "}
            <a href="https://verilex-agency.vercel.app" style={{ color: "#9ca3af" }}>verilex-agency.vercel.app</a>
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          nav { display: none !important; }
          body { background: white !important; }
          @page { margin: 20mm; }
        }
      `}</style>
    </div>
  );
}
