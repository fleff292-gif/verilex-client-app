import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const REVIEW_PROMPT = `You are a senior legal reviewer. Analyse the document provided and return a JSON object with EXACTLY this structure (no markdown, no code blocks, just raw JSON):

{
  "summary": "2-3 sentence plain-English summary of what this document is and what it does",
  "riskLevel": "Low" | "Medium" | "High",
  "riskRationale": "One sentence explaining the overall risk level",
  "parties": ["Party 1 name", "Party 2 name"],
  "keyDates": [{"label": "...", "date": "..."}],
  "keyValues": [{"label": "...", "value": "..."}],
  "flaggedClauses": [
    {
      "title": "Clause name or topic",
      "excerpt": "Relevant excerpt from the document (max 120 chars)",
      "issue": "Plain-English explanation of why this is a concern",
      "severity": "High" | "Medium" | "Low",
      "recommendation": "What to do about it"
    }
  ],
  "missingClauses": [
    {
      "title": "Missing clause name",
      "why": "Why this clause is typically expected and what risk its absence creates"
    }
  ],
  "positives": ["Things the document does well — list up to 3"]
}

Flag clauses that contain: unlimited liability, unfair termination, automatic renewal without notice, exclusion of implied terms, one-sided indemnity, unreasonable penalties, vague governing law, missing dispute resolution, IP ownership ambiguity.

Be thorough but concise. If a field has no items, return an empty array. Return ONLY the JSON object, nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });

    const allowedTypes = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, TXT, DOC, or DOCX." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBytes = await file.arrayBuffer();
    const base64 = Buffer.from(fileBytes).toString("base64");

    // Determine MIME type
    let mimeType = file.type || "application/pdf";
    if (!mimeType || mimeType === "application/octet-stream") {
      if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
      else if (file.name.endsWith(".txt")) mimeType = "text/plain";
      else mimeType = "application/pdf";
    }

    const result = await model.generateContent([
      REVIEW_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Strip any accidental markdown code blocks
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let review;
    try {
      review = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned an unexpected response. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, review, fileName: file.name });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
