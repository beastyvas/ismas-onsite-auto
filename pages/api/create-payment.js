import { Client, Environment } from 'square';
import { v4 as uuidv4 } from 'uuid';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox,
});

const DEPOSIT_AMOUNT_CENTS = BigInt(5000); // $50.00

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { sourceId, bookingId, customerName } = req.body;

  if (!sourceId) {
    return res.status(400).json({ success: false, error: 'Missing payment source' });
  }

  try {
    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: uuidv4(),
      amountMoney: {
        amount: DEPOSIT_AMOUNT_CENTS,
        currency: 'USD',
      },
      note: `Deposit – ${customerName || 'Customer'} (Booking ${bookingId})`,
    });

    return res.status(200).json({
      success: true,
      paymentId: result.payment.id,
      status: result.payment.status,
    });
  } catch (err) {
    console.error('Square payment error:', err);
    const errorDetail = err?.errors?.[0]?.detail || err.message;
    return res.status(500).json({ success: false, error: errorDetail });
  }
}
