import { createTransporter } from './email-config';
import { env } from '@/config/env';
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^([^<]+)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "Kalivergo", email: from };
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = env.baseUrl ?? "http://localhost:3000";
  const apiKey = env.brevoApiKey;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY tidak ditemukan di environment variables (.env)");
  }

  const link = `${baseUrl}/api/verify-email?email=${encodeURIComponent(
    to
  )}&token=${token}`;

  const safeName = escapeHtml(name);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Verifikasi Akun Kalivergo</h2>
      <p>Halo ${safeName},</p>
      <p>Terima kasih sudah mendaftar di Kalivergo.</p>
      <p>Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
      <p style="margin: 24px 0;">
        <a
          href="${link}"
          style="background: #111827; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block;"
        >
          Verifikasi Email
        </a>
      </p>
      <p>Jika tombol tidak bisa diklik, salin link berikut:</p>
      <p style="word-break: break-all; color: #6b7280;">${link}</p>
      <p>Link ini berlaku selama 1 jam.</p>
      <p>Jika Anda tidak merasa mendaftar di Kalivergo, abaikan email ini.</p>
    </div>
  `;

  const fromAddress = env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>";
  const from = parseFromAddress(fromAddress);

  const payload = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to, name: name }],
    subject: "Verifikasi Akun Kalivergo",
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("BREVO_SEND_ERROR:", response.status, errorText);
    throw new Error(`Gagal mengirim email verifikasi (Status: ${response.status})`);
  }
}

export async function sendOwnerApprovalEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = env.baseUrl ?? "http://localhost:3000";
  const apiKey = env.brevoApiKey;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY tidak ditemukan di environment variables (.env)");
  }

  const link = `${baseUrl}/api/verify-email?email=${encodeURIComponent(
    to
  )}&token=${token}`;

  const safeName = escapeHtml(name);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Akun Owner Kalivergo Telah Diverifikasi</h2>
      <p>Halo ${safeName},</p>
      <p>Selamat, pengajuan owner Anda telah disetujui oleh admin KYC.</p>
      <p>Silakan klik tombol di bawah ini untuk mengaktifkan akses akun Anda:</p>
      <p style="margin: 24px 0;">
        <a
          href="${link}"
          style="background: #111827; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block;"
        >
          Aktifkan Akun
        </a>
      </p>
      <p>Jika tombol tidak bisa diklik, salin link berikut:</p>
      <p style="word-break: break-all; color: #6b7280;">${link}</p>
      <p>Link ini berlaku selama 1 jam.</p>
      <p>Jika Anda tidak merasa mengajukan owner di Kalivergo, abaikan email ini.</p>
    </div>
  `;

  const fromAddress = env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>";
  const from = parseFromAddress(fromAddress);

  const payload = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to, name: name }],
    subject: "Akun Owner Kalivergo Telah Diverifikasi",
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("BREVO_SEND_ERROR:", response.status, errorText);
    throw new Error(`Gagal mengirim email verifikasi owner (Status: ${response.status})`);
  }
}

export async function sendForgotPasswordVerificationEmail(
  email: string,
  verificationLink: string
) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: env.smtpUser,
    to: email,
    subject: 'Verifikasi Reset Password',
    html: `
      <h2>Verifikasi Reset Password</h2>
      <p>Klik link berikut untuk menyelesaikan proses reset password:</p>
      <a href="${verificationLink}">Verifikasi Sekarang</a>
      <p>Link akan kadaluarsa dalam 1 jam.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendMemberRejectionEmail(
  to: string,
  name: string
): Promise<void> {
  const apiKey = env.brevoApiKey;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY tidak ditemukan di environment variables (.env)");
  }

  const safeName = escapeHtml(name);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Pendaftaran Anggota Ditolak</h2>
      <p>Halo ${safeName},</p>
      <p>Maaf, pendaftaran anggota Anda di Kalivergo telah ditolak oleh pengelola kelas.</p>
      <p>Jika Anda memiliki pertanyaan, silakan hubungi pengelola kelas terkait.</p>
      <p>Terima kasih.</p>
    </div>
  `;

  const fromAddress = env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>";
  const from = parseFromAddress(fromAddress);

  const payload = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to, name: name }],
    subject: "Pendaftaran Anggota Ditolak - Kalivergo",
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("BREVO_SEND_ERROR:", response.status, errorText);
    throw new Error(`Gagal mengirim email penolakan anggota (Status: ${response.status})`);
  }
}