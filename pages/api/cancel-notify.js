import { supabaseAdmin } from "@/utils/supabaseAdminClient";

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { name, phone, date, start_time } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: "Missing phone number" });
  }

  const textbeltKey = process.env.TEXTBELT_API_KEY;
  if (!textbeltKey) {
    return res.status(200).json({ success: true, skipped: true });
  }

  try {
    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("business_name, phone")
      .single();

    const businessName = settings?.business_name || "Isma's OnSite Auto";
    const businessPhone = settings?.phone || "(702) 801-7210";

    const message =
      `Hey ${name}! 👋 Your appointment on ${date} at ${start_time} with ${businessName} has been cancelled. ` +
      `We're sorry about that! Whenever you're ready, we'd love to have you back — book again anytime. ` +
      `Give us a call at ${businessPhone}. See you soon! 🔧`;

    const smsRes = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizePhone(phone),
        message,
        key: textbeltKey,
      }),
    });

    const result = await smsRes.json();
    if (!result.success) {
      console.error("cancel-notify SMS failed:", result.error);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("cancel-notify error:", err);
    return res.status(200).json({ success: true, skipped: true });
  }
}
