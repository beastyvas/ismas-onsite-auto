import { Client } from 'square';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/utils/supabaseAdminClient';

function getClient() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
  });
}

async function getLocationId(client) {
  // Use env var if set, otherwise fetch first location from Square
  if (process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
    return process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  }
  const { result } = await client.locationsApi.listLocations();
  return result.locations?.[0]?.id;
}

export default async function handler(req, res) {
  // Outer catch ensures we always return JSON, never an HTML error page
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

    // 1. Save booking with pending_payment status
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
      return res.status(500).json({ success: false, error: 'No Square location found. Check your credentials.' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.onsiteautolv.com';

    const { result } = await client.checkoutApi.createPaymentLink({
      idempotencyKey: bookingId,
      order: {
        locationId,
        lineItems: [{
          name: "Booking Deposit — Isma's OnSite Auto Repair",
          quantity: '1',
          basePriceMoney: { amount: 5000n, currency: 'USD' },
          note: `${name} · ${servicesArray.join(', ')}`,
        }],
        referenceId: bookingId,
      },
      checkoutOptions: {
        redirectUrl: `${siteUrl}/booking-confirmation?bookingId=${bookingId}`,
        askForShippingAddress: false,
      },
    });

    return res.status(200).json({ success: true, checkoutUrl: result.paymentLink.url });

  } catch (err) {
    console.error('create-checkout error:', err);
    const message = err?.errors?.[0]?.detail || err?.message || 'Unexpected server error';
    return res.status(500).json({ success: false, error: message });
  }
}
