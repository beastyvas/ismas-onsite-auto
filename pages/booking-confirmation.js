import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function BookingConfirmation() {
  const router = useRouter();
  const { bookingId, transactionId } = router.query;
  const [status, setStatus] = useState('loading');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!bookingId || !transactionId) {
      setError('Missing booking or payment information.');
      setStatus('error');
      return;
    }

    fetch(`/api/verify-payment?bookingId=${bookingId}&transactionId=${transactionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBooking(data.booking);
          setStatus('success');
        } else {
          setError(data.error || 'Payment verification failed.');
          setStatus('error');
        }
      })
      .catch(() => {
        setError('Something went wrong. Please call us at (702) 801-7210.');
        setStatus('error');
      });
  }, [router.isReady, bookingId, transactionId]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Confirming your payment…</p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-black text-red-400">Payment Issue</h1>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-600 text-xs">If you were charged, call us at <a href="tel:+17028017210" className="text-blue-400">(702) 801-7210</a> and we'll sort it out.</p>
          <Link href="/#booking" className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm">
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">

        {/* Success badge */}
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">You&apos;re Booked!</h1>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            Your $50 deposit is confirmed. Isma will reach out shortly to lock in the details.
          </p>
        </div>

        {/* Booking summary card */}
        {booking && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Booking Summary</p>
            <div className="space-y-2.5 text-sm">
              <Row label="Name" value={booking.name} />
              <Row label="Date" value={`${booking.date} at ${booking.start_time}`} />
              <Row label="Vehicle" value={booking.vehicle} />
              <Row label="Address" value={booking.address} />
              {booking.services && (
                <Row label="Services" value={Array.isArray(booking.services) ? booking.services.join(', ') : booking.services} />
              )}
              <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-gray-500">Deposit Paid</span>
                <span className="text-emerald-400 font-bold">$50.00 ✓</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-xs text-gray-600">
            Questions? Call{' '}
            <a href="tel:+17028017210" className="text-blue-400 hover:underline">(702) 801-7210</a>
          </p>
          <Link href="/" className="inline-block text-xs text-gray-700 hover:text-gray-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
