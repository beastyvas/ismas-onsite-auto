// pages/forgot-password.jsx
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const router = useRouter();

  // Fetch logo from database
  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from("settings")
        .select("logo_url")
        .maybeSingle();
      
      if (data?.logo_url) {
        const url = supabase.storage
          .from('business-assets')
          .getPublicUrl(data.logo_url).data.publicUrl;
        setLogoUrl(url);
      }
    };
    fetchLogo();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSuccess(false);
    setIsLoading(true);
    
    // Get the current URL origin for the redirect URL
    const origin = window.location.origin;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    
    if (error) {
      setErr(error.message);
      setIsLoading(false);
      return;
    }
    
    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img
              src={logoUrl || "/images/logo.png"}
              alt="Logo"
              className="w-48 mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Reset Password
          </h1>
          <p className="text-gray-400">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Try another email
                </button>
                <a
                  href="/login"
                  className="block w-full text-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Back to login
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {err && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 text-sm">{err}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-blue-500/50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Send Reset Link</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to login
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Back to Site */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to site
          </a>
        </div>
      </div>
    </main>
  );
}