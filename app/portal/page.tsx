"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import firmConfig from "@/firm.config";
import { supabase, type Matter, STAGES } from "@/lib/supabase";

const STAGE_COLORS: Record<string, string> = {
  intake_received: "#f59e0b",
  engagement_sent: "#3b82f6",
  signed:          "#8b5cf6",
  matter_open:     "#10b981",
};

export default function Portal() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const c = firmConfig.primaryColor;

  useEffect(() => {
    supabase
      .from("matters")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMatters(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? matters : matters.filter(m => m.stage === filter);

  const counts = STAGES.reduce((acc, s) => {
    acc[s.key] = matters.filter(m => m.stage === s.key).length;
    return acc;
  }, {} as Record<string, number>);

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
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/portal/review" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none", letterSpacing: "0.5px" }}>Doc Review →</Link>
          <Link href="/portal/roi" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none", letterSpacing: "0.5px" }}>ROI Report →</Link>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>Matter Portal</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, fontWeight: 700, color: c, marginBottom: 4 }}>All matters</h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>{matters.length} total · {matters.filter(m => m.stage !== "matter_open").length} active</p>
          </div>
          <Link href="/" style={{ background: c, color: "white", fontWeight: 600, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 20px", textDecoration: "none" }}>
            + New intake
          </Link>
        </div>

        {/* Stage summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {STAGES.map(s => (
            <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)} style={{
              background: "white", border: `2px solid ${filter === s.key ? STAGE_COLORS[s.key] : "#e5e7eb"}`,
              padding: "16px 20px", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Libre Baskerville', serif", color: STAGE_COLORS[s.key] }}>{counts[s.key] ?? 0}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>No matters yet.</p>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  {["Client", "Matter type", "Stage", "Submitted", ""].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#07111f" }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{m.email}</div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#374151" }}>{m.matter_type}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ display: "inline-block", padding: "4px 10px", fontSize: 11, fontWeight: 600, background: `${STAGE_COLORS[m.stage]}18`, color: STAGE_COLORS[m.stage] }}>
                        {STAGES.find(s => s.key === m.stage)?.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#6b7280" }}>
                      {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <Link href={`/portal/matters/${m.id}`} style={{ fontSize: 12, fontWeight: 600, color: c, textDecoration: "none", letterSpacing: "0.5px" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
