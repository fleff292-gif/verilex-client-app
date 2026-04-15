"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import firmConfig from "@/firm.config";

type FlaggedClause = { title: string; excerpt: string; issue: string; severity: "High" | "Medium" | "Low"; recommendation: string };
type MissingClause = { title: string; why: string };
type KeyDate = { label: string; date: string };
type KeyValue = { label: string; value: string };

type Review = {
  summary: string;
  riskLevel: "Low" | "Medium" | "High";
  riskRationale: string;
  parties: string[];
  keyDates: KeyDate[];
  keyValues: KeyValue[];
  flaggedClauses: FlaggedClause[];
  missingClauses: MissingClause[];
  positives: string[];
};

const RISK_COLORS = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };
const SEVERITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };

export default function ReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const c = firmConfig.primaryColor;

  const handleFile = (f: File) => {
    setFile(f);
    setReview(null);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setReview(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/review-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setReview(data.review);
      setFileName(data.fileName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

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
        <Link href="/portal" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>← Portal</Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, fontWeight: 700, color: c, marginBottom: 6 }}>AI Document Review</h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Upload a contract or agreement. Get a risk assessment, flagged clauses, and plain-English summary in seconds.</p>
        </div>

        {/* Upload zone */}
        {!review && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? c : file ? c : "#d1d5db"}`,
              background: dragging ? `${c}08` : "white",
              padding: "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: 24,
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            {file ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 600, color: c, marginBottom: 4 }}>{file.name}</p>
                <p style={{ fontSize: 13, color: "#6b7280" }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Drop your document here</p>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>PDF, TXT, DOC, DOCX · Max 10MB</p>
              </>
            )}
          </div>
        )}

        {file && !review && (
          <button onClick={handleSubmit} disabled={loading} style={{
            background: c, color: "white", border: "none", cursor: loading ? "default" : "pointer",
            fontWeight: 600, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "16px 32px", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 10,
          }}>
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Reviewing document…
              </>
            ) : "Review document →"}
          </button>
        )}

        {error && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 16 }}>{error}</p>}

        {loading && (
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 12 }}>This usually takes 10–30 seconds depending on document length.</p>
        )}

        {/* Results */}
        {review && (
          <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 6 }}>Review complete</p>
                <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: c }}>{fileName}</h2>
              </div>
              <button onClick={() => { setReview(null); setFile(null); setFileName(""); }} style={{ background: "none", border: `1.5px solid #e5e7eb`, color: "#6b7280", fontSize: 12, cursor: "pointer", padding: "8px 16px" }}>
                Review another →
              </button>
            </div>

            {/* Risk banner */}
            <div style={{ background: `${RISK_COLORS[review.riskLevel]}12`, border: `1.5px solid ${RISK_COLORS[review.riskLevel]}40`, padding: "20px 24px", marginBottom: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 4 }}>Overall risk</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, fontWeight: 700, color: RISK_COLORS[review.riskLevel] }}>{review.riskLevel}</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 8 }}>{review.summary}</p>
                <p style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>{review.riskRationale}</p>
              </div>
            </div>

            {/* 3 column metadata */}
            {(review.parties?.length > 0 || review.keyDates?.length > 0 || review.keyValues?.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {review.parties?.length > 0 && (
                  <Card title="Parties">
                    {review.parties.map((p, i) => <p key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{p}</p>)}
                  </Card>
                )}
                {review.keyDates?.length > 0 && (
                  <Card title="Key dates">
                    {review.keyDates.map((d, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{d.date}</p>
                      </div>
                    ))}
                  </Card>
                )}
                {review.keyValues?.length > 0 && (
                  <Card title="Key values">
                    {review.keyValues.map((v, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{v.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{v.value}</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {/* Flagged clauses */}
            {review.flaggedClauses?.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af" }}>
                    Flagged clauses ({review.flaggedClauses.length})
                  </h3>
                </div>
                {review.flaggedClauses.map((clause, i) => (
                  <div key={i} style={{ padding: "20px 24px", borderBottom: i < review.flaggedClauses.length - 1 ? "1px solid #f9fafb" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#07111f" }}>{clause.title}</h4>
                      <span style={{ fontSize: 10, fontWeight: 700, color: SEVERITY_COLORS[clause.severity], background: `${SEVERITY_COLORS[clause.severity]}15`, padding: "3px 8px", flexShrink: 0, marginLeft: 12 }}>
                        {clause.severity}
                      </span>
                    </div>
                    {clause.excerpt && (
                      <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", background: "#f9fafb", padding: "8px 12px", marginBottom: 10, borderLeft: "2px solid #e5e7eb" }}>
                        &ldquo;{clause.excerpt}&rdquo;
                      </p>
                    )}
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 8 }}>{clause.issue}</p>
                    <p style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>→ {clause.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Missing clauses */}
            {review.missingClauses?.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af" }}>
                    Missing clauses ({review.missingClauses.length})
                  </h3>
                </div>
                {review.missingClauses.map((clause, i) => (
                  <div key={i} style={{ padding: "16px 24px", borderBottom: i < review.missingClauses.length - 1 ? "1px solid #f9fafb" : "none", display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#07111f", marginBottom: 4 }}>{clause.title}</p>
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{clause.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Positives */}
            {review.positives?.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e5e7eb" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af" }}>What the document does well</h3>
                </div>
                {review.positives.map((p, i) => (
                  <div key={i} style={{ padding: "12px 24px", borderBottom: i < review.positives.length - 1 ? "1px solid #f9fafb" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "#10b981", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 13, color: "#374151" }}>{p}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "16px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );
}
