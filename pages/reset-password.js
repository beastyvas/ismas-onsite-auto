// pages/reset-password.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // 1) Exchange the ?code= from the URL for a Supabase session
  useEffect(() => {
    const exchangeCode = async () => {
      const code = router.query.code;

      if (!code) {
        // no code yet (Next router not hydrated)
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("exchangeCodeForSession error", error);
        alert("Reset link is invalid or expired.");
        setLoading(false);
        return;
      }

      setSessionReady(true);
      setLoading(false);
    };

    exchangeCode();
  }, [router.query.code]);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error(error);
      alert("Could not update password.");
      return;
    }

    alert("Password updated! You can now log in.");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <p>Loading reset link…</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <p>Reset link is invalid or has already been used.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-zinc-50 mb-1">
          Reset your password
        </h1>
        <p className="text-xs text-zinc-400 mb-4">
          Enter a new password below.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-3 text-sm">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2 rounded-lg"
          >
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
