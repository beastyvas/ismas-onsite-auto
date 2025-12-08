import { supabase } from "@/utils/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") 
    return res.status(405).json({ success: false, error: "Method Not Allowed" });

  const { bookingId } = req.body;

  // Fetch booking details
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    console.error("Fetch error:", fetchErr);
    return res.status(500).json({
      success: false,
      error: "Booking not found",
    });
  }

  // Update status
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("Update error:", updateErr);
    return res.status(500).json({
      success: false,
      error: "Failed to update booking",
    });
  }

  // Send customer confirmation
  const response = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: `+1${booking.phone}`,
      message: `Your auto repair appointment is confirmed for ${booking.date} at ${booking.start_time}. Thank you!`,
      key: process.env.TEXTBELT_API_KEY,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error("Textbelt error:", data.error);
    return res.status(500).json({ success: false, error: data.error });
  }

  return res.status(200).json({ success: true });
}
