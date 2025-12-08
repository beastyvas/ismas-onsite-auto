export default async function handler(req, res) {
  if (req.method !== "POST") 
    return res.status(405).end("Method Not Allowed");

  const { name, date, start_time, address } = req.body;

  const response = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+17028017210",  // <-- replace with Isma's number
      message: `🔧 NEW BOOKING REQUEST\nName: ${name}\nDate: ${date}\nTime: ${start_time}\nAddress: ${address}`,
      key: process.env.TEXTBELT_API_KEY,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error("Textbelt error:", data.error);
    return res.status(500).json({ success: false, error: data.error });
  }

  res.status(200).json({ success: true });
}
