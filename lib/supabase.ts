import { createClient } from "@supabase/supabase-js";

export type Matter = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matter_type: string;
  details: string;
  stage: "intake_received" | "engagement_sent" | "signed" | "matter_open";
  client_token: string;
  created_at: string;
};

export const STAGES: { key: Matter["stage"]; label: string; description: string }[] = [
  { key: "intake_received",  label: "Intake received",   description: "Your enquiry has been received. We will be in touch shortly." },
  { key: "engagement_sent",  label: "Engagement sent",   description: "Your engagement letter has been prepared and sent for your signature." },
  { key: "signed",           label: "Signed",            description: "Your engagement letter has been signed. We are now opening your matter." },
  { key: "matter_open",      label: "Matter open",       description: "Your matter is now open and your file has been created." },
];

// Fallback to placeholder URLs at build time — real values come from env vars at runtime
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-key"
);
