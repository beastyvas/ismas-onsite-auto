export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method Not Allowed" });

  const { fromAddress, toAddress } = req.body;

  if (!fromAddress || !toAddress) {
    return res
      .status(400)
      .json({ success: false, error: "fromAddress and toAddress required" });
  }

  try {
    // 1. Geocode both addresses → get coordinates
    const geo = async (addr) => {
      const r = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(
          addr
        )}`
      );
      const d = await r.json();
      if (!d.features || d.features.length === 0)
        throw new Error("Address not found: " + addr);
      return d.features[0].geometry.coordinates; // [lon, lat]
    };

    const from = await geo(fromAddress);
    const to = await geo(toAddress);

    // 2. Call directions API to get drive distance
    const r = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [from, to], // [[lon, lat], [lon, lat]]
      }),
    });

    const d = await r.json();

    if (!d?.routes?.[0]?.summary?.distance)
      throw new Error("Unable to calculate distance");

    const meters = d.routes[0].summary.distance;
    const miles = meters / 1609.34;

    return res.json({
      success: true,
      miles: Number(miles.toFixed(1)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}