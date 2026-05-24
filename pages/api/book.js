// pages/api/book.js
import { supabaseAdmin } from "@/utils/supabaseAdminClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      id,
      name,
      phone,
      address,
      vehicle_info,
      services,
      date,
      start_time,
      notes,
      duration,
      is_emergency,
      veteran_discount,
      square_payment_id,
    } = req.body;

    console.log('📥 Received booking request:', { name, phone, date, start_time, services });

    // Validate required fields
    if (!name || !phone || !address || !vehicle_info || !services || !date || !start_time) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    console.log('✅ Validation passed, inserting into database...');

    // Calculate end_time
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = startHour + duration;
    const end_time = `${String(endHour).padStart(2, '0')}:00`;

    // Convert services string to array if needed
    let servicesArray = services;
    if (typeof services === 'string') {
      // Split by comma and trim whitespace
      servicesArray = services.split(',').map(s => s.trim());
    }

    console.log('📦 Prepared data:', { vehicle_info, servicesArray });

    // Insert booking into Supabase
    const { data, error } = await supabaseAdmin.from("bookings").insert({
      id,
      name,
      phone,
      address,
      vehicle: vehicle_info,
      services: servicesArray,
      date,
      start_time,
      end_time,
      notes,
      duration,
      is_emergency,
      veteran_discount,
      ...(square_payment_id && { square_payment_id, paid: true }),
    }).select();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    console.log('✅ Booking inserted successfully:', data[0]?.id);

    // Get owner's phone number from settings
     const { data: settings, error: settingsError } = await supabaseAdmin
      .from("settings")
      .select("sms_number, phone")
      .single();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }

    const ownerPhone = settings?.sms_number || settings?.phone || process.env.OWNER_PHONE || "+17028017210";
    const textbeltKey = process.env.TEXTBELT_API_KEY;

    // Send SMS notification to Isma (the owner)
    if (ownerPhone && textbeltKey) {
      try {
        const smsMessage = `🚗 NEW BOOKING ${is_emergency ? '🚨 EMERGENCY' : ''}

Customer: ${name}
Phone: ${phone}
Vehicle: ${vehicle_info}
Services: ${Array.isArray(servicesArray) ? servicesArray.join(', ') : servicesArray}
Date: ${date} at ${start_time}
Address: ${address}
${veteran_discount ? '🎖️ Veteran Discount' : ''}
${notes ? `Notes: ${notes}` : ''}`;

        // Use TextBelt directly
        const textbeltResponse = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: ownerPhone,
            message: smsMessage,
            key: textbeltKey,
          }),
        });

        const textbeltResult = await textbeltResponse.json();
        
        if (!textbeltResult.success) {
          console.error('Failed to send SMS notification:', textbeltResult.error);
        } else {
          console.log('✅ SMS sent successfully. Quota remaining:', textbeltResult.quotaRemaining);
        }
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    } else {
      console.log('⚠️ SMS not sent - missing phone or API key');
    }

    return res.status(200).json({ 
      success: true, 
      data: data[0],
      message: "Booking created successfully" 
    });

  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error"
    });
  }
}