"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyForgotPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan.');
      return;
    }

    const verify = async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/verify-forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Verifikasi gagal');
        setStatus('success');
        setMessage(data?.message || 'Password berhasil diperbarui.');
       
        setTimeout(() => router.push('/login?reset-success=1'), 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Terjadi kesalahan saat verifikasi');
      }
    };

    verify();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white rounded-lg shadow">
        {status === 'loading' && <p>Memverifikasi token...</p>}
        {status === 'success' && <p className="text-green-600">{message}</p>}
        {status === 'error' && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}