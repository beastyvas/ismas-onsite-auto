// pages/api/add-client-booking.js
// Owner-initiated manual booking — bypasses payment flow, blocks the time slot immediately.
import { supabaseAdmin } from "@/utils/supabaseAdminClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      name,
      phone,
      address,
      vehicle,
      services,
      date,
      start_time,
      duration,
      notes,
      is_emergency,
      veteran_discount,
    } = req.body;

    if (!name || !phone || !address || !vehicle || !date || !start_time) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const startHour = parseInt(start_time.split(":")[0]);
    const startMinute = start_time.split(":")[1] || "00";
    const endHour = startHour + (parseInt(duration) || 2);
    const end_time = `${String(endHour).padStart(2, "0")}:${startMinute}`;

    let servicesArray = services;
    if (typeof services === "string") {
      servicesArray = services.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(servicesArray) || servicesArray.length === 0) {
      servicesArray = ["General Service"];
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        name,
        phone,
        address,
        vehicle,
        services: servicesArray,
        date,
        start_time,
        end_time,
        duration: parseInt(duration) || 2,
        notes: notes || "",
        is_emergency: !!is_emergency,
        veteran_discount: !!veteran_discount,
        status: "confirmed",
        paid: false,
      })
      .select()
      .single();

    if (error) {
      console.error("add-client-booking insert error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("add-client-booking error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
