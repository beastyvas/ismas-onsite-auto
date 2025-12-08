export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { customerPhone, name, date, start_time } = req.body;

  if (!customerPhone) {
    return res.status(400).json({ success: false, error: "Missing phone number" });
  }

  try {
    // Textbelt SMS
    const sms = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: customerPhone,
        message: `🚗 Your mechanic is on the way!\nAppointment: ${date} at ${start_time}`,
        key: process.env.TEXTBELT_API_KEY,
      }),
    }).then(r => r.json());

    if (!sms.success) {
      console.error("Textbelt error:", sms.error);
      return res.status(500).json({ success: false, error: sms.error });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("On The Way Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
