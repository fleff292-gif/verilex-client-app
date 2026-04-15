"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import firmConfig from "@/firm.config";
import { supabase, type Matter, STAGES } from "@/lib/supabase";

const STAGE_COLORS: Record<string, string> = {
  intake_received: "#f59e0b",
  engagement_sent: "#3b82f6",
  signed:          "#8b5cf6",
  matter_open:     "#10b981",
};

export default function MatterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const c = firmConfig.primaryColor;

  useEffect(() => {
    supabase.from("matters").select("*").eq("id", id).single()
      .then(({ data }) => { setMatter(data); setLoading(false); });
  }, [id]);

  const currentStageIndex = matter ? STAGES.findIndex(s => s.key === matter.stage) : -1;
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  const advanceStage = async () => {
    if (!matter || !nextStage) return;
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch("/api/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: matter.id, newStage: nextStage.key }),
      });
      if (!res.ok) throw new Error();
      setMatter(prev => prev ? { ...prev, stage: nextStage.key } : prev);
      setMessage(`Stage updated to "${nextStage.label}" — client has been notified.`);
    } catch {
      setMessage("Failed to update stage. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const generateDoc = async () => {
    if (!matter) return;
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: matter.id }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `engagement-letter-${matter.first_name}-${matter.last_name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Engagement letter downloaded.");
    } catch {
      setMessage("Failed to generate document. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: "#6b7280" }}>Loading…</div>;
  if (!matter) return <div style={{ padding: 40, color: "#6b7280" }}>Matter not found.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <nav style={{ background: c, padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 10, color: "white" }}>{firmConfig.logoText}</span>
          </div>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: "white" }}>{firmConfig.name}</span>
        </div>
        <Link href="/portal" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>← All matters</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, fontWeight: 700, color: c }}>
            {matter.first_name} {matter.last_name}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
            {matter.matter_type} · Submitted {new Date(matter.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stage progress */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 20 }}>Matter stage</h2>
          <div style={{ display: "flex", gap: 0 }}>
            {STAGES.map((s, i) => {
              const isCurrent = s.key === matter.stage;
              const isPast = i < currentStageIndex;
              return (
                <div key={s.key} style={{ flex: 1, position: "relative" }}>
                  <div style={{ height: 4, background: isPast || isCurrent ? STAGE_COLORS[s.key] : "#e5e7eb", marginBottom: 12, transition: "background 0.3s" }} />
                  <div style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? STAGE_COLORS[s.key] : isPast ? "#9ca3af" : "#d1d5db" }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
          {nextStage && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Next: <strong style={{ color: "#07111f" }}>{nextStage.label}</strong> — client will receive an automated update email.</p>
              <button onClick={advanceStage} disabled={updating} style={{ background: c, color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 20px", opacity: updating ? 0.7 : 1, flexShrink: 0, marginLeft: 16 }}>
                {updating ? "Updating…" : `Mark as ${nextStage.label} →`}
              </button>
            </div>
          )}
          {!nextStage && <p style={{ marginTop: 16, fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ Matter is fully open</p>}
        </div>

        {/* Client details */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 20 }}>Client details</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {([
              ["Full name", `${matter.first_name} ${matter.last_name}`],
              ["Email", matter.email],
              ["Phone", matter.phone || "—"],
              ["Matter type", matter.matter_type],
              ["Details", matter.details || "—"],
            ] as [string, string][]).map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 0", fontSize: 13, color: "#6b7280", width: 140 }}>{label}</td>
                <td style={{ padding: "10px 0", fontSize: 13, color: "#07111f" }}>{value}</td>
              </tr>
            ))}
          </table>
        </div>

        {/* Document generator */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "28px" }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12 }}>Documents</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Generate a pre-populated engagement letter for this client.</p>
          <button onClick={generateDoc} disabled={generating} style={{ background: "white", color: c, border: `2px solid ${c}`, cursor: "pointer", fontWeight: 600, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 20px", opacity: generating ? 0.7 : 1 }}>
            {generating ? "Generating…" : "↓ Download engagement letter"}
          </button>
        </div>

        {message && (
          <p style={{ marginTop: 20, fontSize: 14, color: message.includes("Failed") ? "#dc2626" : "#10b981", fontWeight: 500 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
