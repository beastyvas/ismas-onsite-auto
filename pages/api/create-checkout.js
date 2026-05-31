const { SquareClient, SquareEnvironment } = require('square');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('@/utils/supabaseAdminClient');

function getClient() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  });
}

async function getLocationId(client) {
  if (process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
    return process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  }
  const response = await client.locations.list();
  return response.locations?.[0]?.id;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const {
      id, name, phone, address, vehicle_info, services,
      date, start_time, notes, duration, is_emergency, veteran_discount,
    } = req.body;

    if (!name || !phone || !address || !vehicle_info || !services || !date || !start_time) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const bookingId = id || uuidv4();
    const startHour = parseInt(start_time.split(':')[0]);
    const end_time = `${String(startHour + (duration || 1)).padStart(2, '0')}:00`;
    const servicesArray = typeof services === 'string' ? services.split(',').map(s => s.trim()) : services;

    // 1. Save booking
    const { error: insertError } = await supabaseAdmin.from('bookings').insert({
      id: bookingId,
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
      status: 'pending',
      paid: false,
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    // 2. Create Square payment link
    const client = getClient();
    const locationId = await getLocationId(client);

    if (!locationId) {
      await supabaseAdmin.from('bookings').delete().eq('id', bookingId);
      return res.status(500).json({ success: false, error: 'No Square location found. Check credentials.' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.onsiteautolv.com';

    const response = await client.checkout.paymentLinks.create({
      idempotencyKey: bookingId,
      order: {
        locationId,
        lineItems: [{
          name: "Booking Deposit — Isma's OnSite Auto Repair",
          quantity: '1',
          basePriceMoney: { amount: 100n, currency: 'USD' },
          note: `${name} · ${servicesArray.join(', ')}`,
        }],
        referenceId: bookingId,
      },
      checkoutOptions: {
        redirectUrl: `${siteUrl}/booking-confirmation?bookingId=${bookingId}`,
        askForShippingAddress: false,
      },
    });

    const checkoutUrl = response.paymentLink?.url;
    if (!checkoutUrl) throw new Error('Square did not return a checkout URL');

    return res.status(200).json({ success: true, checkoutUrl });

  } catch (err) {
    console.error('create-checkout error:', err);
    const message = err?.errors?.[0]?.detail || err?.message || 'Unexpected server error';
    return res.status(500).json({ success: false, error: message });
  }
}
