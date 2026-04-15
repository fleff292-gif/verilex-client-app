"use client";
import { useState } from "react";
import firmConfig from "@/firm.config";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matterType: string;
  details: string;
};

const INITIAL: FormData = { firstName: "", lastName: "", email: "", phone: "", matterType: "", details: "" };

export default function IntakeForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [step, setStep] = useState<"form" | "submitting" | "done">("form");
  const [error, setError] = useState("");

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.matterType) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStep("submitting");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const c = firmConfig.primaryColor;

  if (step === "done") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
        <Nav c={c} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ width: 56, height: 56, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, fontWeight: 700, color: c, marginBottom: 16 }}>
              Thanks, {form.firstName}.
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 32 }}>
              We&apos;ve received your enquiry and will be in touch within one business day.
            </p>
            <a href={firmConfig.calLink} style={{ display: "inline-block", background: c, color: "white", fontWeight: 600, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", padding: "14px 28px", textDecoration: "none" }}>
              Book a call now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Nav c={c} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, fontWeight: 700, color: c, marginBottom: 8 }}>
            Start your enquiry
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
            Fill in your details and we&apos;ll be in touch within one business day.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="First name *">
              <input style={inputStyle} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Sarah" />
            </Field>
            <Field label="Last name *">
              <input style={inputStyle} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Mitchell" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Email *">
              <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="sarah@email.com" />
            </Field>
            <Field label="Phone">
              <input style={inputStyle} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
            </Field>
          </div>
          <Field label="Matter type *">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {firmConfig.matterTypes.map(t => (
                <button key={t} type="button" onClick={() => set("matterType", t)} style={{
                  padding: "8px 14px", border: `1.5px solid ${form.matterType === t ? c : "#e5e7eb"}`,
                  background: form.matterType === t ? c : "white",
                  color: form.matterType === t ? "white" : "#374151",
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tell us about your matter">
            <textarea style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties} rows={4}
              value={form.details} onChange={e => set("details", e.target.value)}
              placeholder="Brief description of what you need help with..." />
          </Field>

          {error && <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>}

          <button type="submit" disabled={step === "submitting"} style={{
            background: c, color: "white", border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "16px 32px", alignSelf: "flex-start",
            opacity: step === "submitting" ? 0.7 : 1,
          }}>
            {step === "submitting" ? "Submitting…" : "Submit enquiry →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Nav({ c }: { c: string }) {
  return (
    <nav style={{ background: c, padding: "0 32px", height: 56, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 10, color: "white" }}>{firmConfig.logoText}</span>
        </div>
        <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: "white" }}>{firmConfig.name}</span>
      </div>
    </nav>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#07111f", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #e5e7eb", background: "white",
  fontSize: 14, color: "#07111f", outline: "none", fontFamily: "inherit",
};
