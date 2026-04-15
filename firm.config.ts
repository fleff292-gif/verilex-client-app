// ─────────────────────────────────────────────────────────────────────────────
// FIRM CONFIG — edit this file for each client deployment
// ─────────────────────────────────────────────────────────────────────────────

const firmConfig = {
  // Firm identity
  name: "Verilex Demo",
  shortName: "Verilex",
  email: "verilexagency@gmail.com",       // where new leads are sent
  phone: "+1 555 000 0000",
  website: "https://verilex-agency.vercel.app",
  address: "123 Legal Street, New York, NY 10001",

  // Branding
  primaryColor: "#07111f",               // nav, buttons, accents
  logoText: "VX",                        // mark letters (2 chars)

  // Matter types this firm handles
  matterTypes: [
    "Family Law",
    "Conveyancing",
    "Wills & Estates",
    "Commercial Law",
    "Employment Law",
    "Other",
  ],

  // Booking link
  calLink: "https://cal.com/verilex/discovery",

  // ROI baseline — what the firm did BEFORE Verilex (used to calculate savings)
  baseline: {
    intakeHoursPerClient: 4,       // hours to onboard one client manually
    docHoursPerDocument: 2,        // hours to draft one document manually
    statusCallsPerMatter: 8,       // inbound status calls per matter
    hourlyStaffCost: 75,           // $ per hour for admin staff
    goLiveDate: "2026-01-01",      // when Verilex went live for this firm
  },

  // Engagement letter placeholder — used in PDF generation
  engagementTemplate: {
    firmFullName: "Verilex Demo LLP",
    firmAddress: "123 Legal Street, New York, NY 10001",
    firmPhone: "+1 555 000 0000",
    firmEmail: "verilexagency@gmail.com",
    hourlyRate: "$350",
    paymentTerms: "14 days",
  },
};

export default firmConfig;
export type FirmConfig = typeof firmConfig;
