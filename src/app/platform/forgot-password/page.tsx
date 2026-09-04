"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPlatformAdminPasswordReset } from "@/actions/platform-password";
import PageBackground from "@/components/ui/PageBackground";

export default function PlatformForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (formData: FormData) => {
    setLoading(true); setError(""); setMessage("");
    try {
      const result = await requestPlatformAdminPasswordReset(formData);
      if (result.error) setError(result.error); else setMessage(result.success || "Silakan cek email Anda.");
    } catch { setError("Terjadi kesalahan. Silakan coba lagi."); }
    finally { setLoading(false); }
  };

  return <div className="relative flex min-h-screen items-center justify-center bg-dark-50 p-4 dark:bg-dark-950"><PageBackground /><div className="relative z-10 w-full max-w-md rounded-2xl border border-dark-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-md dark:border-dark-700 dark:bg-dark-800/70">
    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Lupa Password Admin Platform</h1>
    <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">Isi data sesuai registrasi admin platform.</p>
    {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
    <form action={submit} className="mt-6 space-y-4">
      <input name="name" required placeholder="Nama lengkap" className="w-full rounded-lg border px-3 py-2" />
      <input name="email" type="email" required placeholder="Gmail" className="w-full rounded-lg border px-3 py-2" />
      <input name="phone" type="tel" required placeholder="Nomor telepon" className="w-full rounded-lg border px-3 py-2" />
      <input name="newPassword" type="password" required minLength={6} placeholder="Password baru" className="w-full rounded-lg border px-3 py-2" />
      <input name="confirmPassword" type="password" required minLength={6} placeholder="Ulangi password" className="w-full rounded-lg border px-3 py-2" />
      <button disabled={loading} className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white disabled:opacity-50">{loading ? "Mengirim..." : "Kirim Verifikasi Email"}</button>
    </form>
    <Link href="/platform/login" className="mt-5 block text-center text-sm text-primary-600">Kembali ke login platform</Link>
  </div></div>;
}