// pages/login.jsx
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
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
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setErr(error.message);
      setIsLoading(false);
      return;
    }
    
    const to = router.query.redirectedFrom || "/dashboard";
    router.replace(to);
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
            Dashboard Login
          </h1>
          <p className="text-gray-400">Access your admin panel</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 shadow-2xl">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Sign In</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>
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