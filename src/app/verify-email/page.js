"use client";

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState("Verifying...");
  const [error,      setError]      = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [email,      setEmail]      = useState("");
  const [cooldown,   setCooldown]   = useState(0);
  const [isSending,  setIsSending]  = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:8000/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setError(false);
          setShowResend(false);
          setMessage("Email verified successfully");
          setTimeout(() => router.replace("/login"), 2000);
        } else if (data.allowResend) {
          setError(true);
          setShowResend(true);
          setEmail(data.email || "");
          setMessage("Invalid or expired verification link. Please resend.");
        } else {
          setError(true);
          setShowResend(false);
          setMessage("Something went wrong.");
        }
      })
      .catch(() => { setError(true); setMessage("Something went wrong."); })
      .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      const res  = await fetch("http://localhost:8000/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Verification email sent 📩"); setCooldown(30); }
      else          toast.error(data.message || "Something went wrong ❌");
    } catch {
      toast.error("Network error ❌");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="bg-card max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            error ? "bg-error-light" : "bg-success-light"
          }`}>
            <svg className={`w-8 h-8 ${error ? "text-error" : "text-success"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {error
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              }
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${error ? "text-error" : "text-success"}`}>
            {message}
          </h2>
        </div>

        {!loading && (
          <div className="text-sm text-text-muted text-center">
            {error ? (
              showResend && email ? (
                <div>
                  <p className="mb-3">Click below to resend a new verification email</p>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={handleResend}
                      disabled={cooldown > 0 || isSending}
                      className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                    >
                      {isSending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
                    </button>
                    {cooldown > 0 && <p className="text-xs text-text-muted">Please wait before requesting again.</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-error font-medium mb-2">Invalid verification link.</p>
                  <a href="/login" className="text-primary hover:underline">Back to login</a>
                </div>
              )
            ) : (
              <div>
                <p className="text-success font-medium mb-2">Email verified successfully 🎉</p>
                <p>You will be redirected to login shortly.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
