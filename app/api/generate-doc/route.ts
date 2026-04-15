import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin, type Matter } from "@/lib/supabase";
import firmConfig from "@/firm.config";

export async function POST(req: NextRequest) {
  try {
    const { matterId } = await req.json();

    const { data: rawMatter, error } = await supabaseAdmin
      .from("matters")
      .select("*")
      .eq("id", matterId)
      .single();

    if (error || !rawMatter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    const matter = rawMatter as Matter;
    const t = firmConfig.engagementTemplate;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const clientName = `${matter.first_name} ${matter.last_name}`;

    // Build PDF
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const regular = await doc.embedFont(StandardFonts.Helvetica);

    const navy = rgb(7 / 255, 17 / 255, 31 / 255);
    const gray = rgb(107 / 255, 114 / 255, 128 / 255);

    let y = height - 60;

    // Header bar
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: navy });
    page.drawText(t.firmFullName.toUpperCase(), { x: 40, y: height - 52, size: 13, font: bold, color: rgb(1, 1, 1) });
    page.drawText(t.firmAddress, { x: 40, y: height - 68, size: 9, font: regular, color: rgb(0.7, 0.7, 0.7) });

    y = height - 120;

    // Date
    page.drawText(today, { x: 40, y, size: 10, font: regular, color: gray });
    y -= 32;

    // Title
    page.drawText("ENGAGEMENT LETTER", { x: 40, y, size: 14, font: bold, color: navy });
    y -= 8;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1.5, color: navy });
    y -= 28;

    // Salutation
    page.drawText(`Dear ${clientName},`, { x: 40, y, size: 11, font: regular, color: navy });
    y -= 24;

    // Body paragraphs
    const paragraphs = [
      `Thank you for choosing ${t.firmFullName} to assist you with your ${matter.matter_type} matter. We are pleased to confirm our engagement on the terms set out in this letter.`,
      `SCOPE OF SERVICES`,
      `We will provide legal services in connection with your ${matter.matter_type} matter. The specific scope of work will be agreed between us prior to commencing any work beyond initial consultations.`,
      `FEES`,
      `Our fees are charged at ${t.hourlyRate} per hour. We will provide you with a cost estimate before commencing substantive work. Payment is due within ${t.paymentTerms} of invoice.`,
      `CONFIDENTIALITY`,
      `All information provided to us in connection with this matter will be kept strictly confidential in accordance with our professional obligations and applicable law.`,
      `ACCEPTANCE`,
      `Please sign and return a copy of this letter to confirm your instructions. By signing below, you confirm that you have read and agree to the terms set out in this engagement letter.`,
    ];

    for (const para of paragraphs) {
      const isHeading = para === para.toUpperCase() && para.length < 40;
      if (isHeading) {
        y -= 8;
        page.drawText(para, { x: 40, y, size: 10, font: bold, color: navy });
        y -= 18;
      } else {
        // Word wrap
        const words = para.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          const w = regular.widthOfTextAtSize(test, 10);
          if (w > width - 80 && line) {
            page.drawText(line, { x: 40, y, size: 10, font: regular, color: navy });
            y -= 16;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) {
          page.drawText(line, { x: 40, y, size: 10, font: regular, color: navy });
          y -= 16;
        }
        y -= 8;
      }
    }

    // Signature block
    y -= 24;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 24;

    const sigCols = [
      { label: "Signed for the firm:", name: t.firmFullName, x: 40 },
      { label: "Signed by client:", name: clientName, x: width / 2 + 10 },
    ];

    for (const col of sigCols) {
      page.drawText(col.label, { x: col.x, y, size: 9, font: regular, color: gray });
      page.drawLine({ start: { x: col.x, y: y - 32 }, end: { x: col.x + 180, y: y - 32 }, thickness: 0.5, color: navy });
      page.drawText(col.name, { x: col.x, y: y - 48, size: 9, font: bold, color: navy });
      page.drawText("Date: _______________", { x: col.x, y: y - 64, size: 9, font: regular, color: gray });
    }

    // Footer
    page.drawText(`${t.firmFullName} · ${t.firmPhone} · ${t.firmEmail}`, {
      x: 40, y: 30, size: 8, font: regular, color: gray,
    });

    const pdfBytes = await doc.save();
    const buffer = Buffer.from(pdfBytes);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="engagement-letter-${matter.first_name}-${matter.last_name}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
