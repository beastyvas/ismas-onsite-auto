const { SquareClient, SquareEnvironment } = require('square');
const { supabaseAdmin } = require('@/utils/supabaseAdminClient');

function getClient() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { bookingId, orderId } = req.query;

    if (!bookingId || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing bookingId or orderId' });
    }

    // 1. Fetch the Square order and check for tenders (proof of payment)
    const client = getClient();
    const orderResponse = await client.orders.get({ orderId });
    const order = orderResponse.order;

    const tender = order?.tenders?.[0];
    if (!tender) {
      return res.status(400).json({ success: false, error: 'Payment not completed — no tender found' });
    }

    // tender.paymentId is the Payments API ID; fall back to tender.id
    const paymentId = tender.paymentId || tender.id;

    // 2. Fetch booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Prevent double-processing
    if (booking.paid) {
      return res.status(200).json({ success: true, booking });
    }

    // 3. Mark as paid
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ paid: true, square_payment_id: paymentId, status: 'pending' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // 4. SMS the owner
    const { data: settings } = await supabaseAdmin.from('settings').select('sms_number, phone').single();
    const ownerPhone = settings?.sms_number || settings?.phone || process.env.OWNER_PHONE;
    const textbeltKey = process.env.TEXTBELT_API_KEY;

    if (ownerPhone && textbeltKey) {
      const msg = `💳 NEW BOOKING — DEPOSIT PAID${booking.is_emergency ? ' 🚨 EMERGENCY' : ''}

Customer: ${booking.name}
Phone: ${booking.phone}
Vehicle: ${booking.vehicle}
Services: ${Array.isArray(booking.services) ? booking.services.join(', ') : booking.services}
Date: ${booking.date} at ${booking.start_time}
Address: ${booking.address}${booking.veteran_discount ? '\n🎖️ Veteran Discount' : ''}${booking.notes ? `\nNotes: ${booking.notes}` : ''}`;

      await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ownerPhone, message: msg, key: textbeltKey }),
      });
    }

    return res.status(200).json({ success: true, booking: { ...booking, paid: true } });

  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ success: false, error: err?.errors?.[0]?.detail || err?.message || 'Server error' });
  }
}
