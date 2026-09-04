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
      <p>Link verifikasi ini tidak memiliki batas waktu.</p>
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

export async function sendMemberApprovalEmail(
  to: string,
  name: string,
  className: string,
  tenantUrl: string
): Promise<void> {
  const apiKey = env.brevoApiKey;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY tidak ditemukan di environment variables (.env)");
  }

  const safeName = escapeHtml(name);
  const safeClass = escapeHtml(className);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Akun Anda Telah Diverifikasi</h2>
      <p>Halo ${safeName},</p>
      <p>Selamat! Pendaftaran anggota Anda untuk kelas <strong>${safeClass}</strong> telah disetujui oleh pengelola kelas dan akun Anda telah diverifikasi.</p>
      <p>Anda kini dapat langsung masuk dan mulai menggunakan kelas tersebut.</p>
      <p style="margin: 24px 0;">
        <a
          href="${tenantUrl}"
          style="background: #111827; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block;"
        >
          Kunjungi Kelas Saya
        </a>
      </p>
      <p>Jika tombol tidak bisa diklik, salin link berikut:</p>
      <p style="word-break: break-all; color: #6b7280;">${tenantUrl}</p>
      <p>Jika Anda tidak merasa mendaftar di Kalivergo, abaikan email ini.</p>
    </div>
  `;

  const fromAddress = env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>";
  const from = parseFromAddress(fromAddress);

  const payload = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to, name: name }],
    subject: "Akun Anda Telah Diverifikasi - Kalivergo",
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
    throw new Error(`Gagal mengirim email persetujuan anggota (Status: ${response.status})`);
  }
}

async function sendSubscriptionNotice(
  to: string,
  name: string,
  subject: string,
  heading: string,
  className: string,
  graceEndsAt: Date
): Promise<void> {
  const apiKey = env.brevoApiKey;
  if (!apiKey) throw new Error("BREVO_API_KEY tidak ditemukan di environment variables (.env)");
  const safeName = escapeHtml(name);
  const safeClass = escapeHtml(className);
  const graceDate = escapeHtml(graceEndsAt.toLocaleDateString("id-ID", { dateStyle: "long" }));
  const from = parseFromAddress(env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: to, name }],
      subject,
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;"><h2>${heading}</h2><p>Halo ${safeName},</p><p>Masa akses kelas <strong>${safeClass}</strong> telah berakhir.</p><p>Akses tetap tersedia selama masa tenggang hingga <strong>${graceDate}</strong>. Silakan perpanjang sebelum tanggal tersebut agar data tidak dihapus otomatis.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Gagal mengirim email subscription (Status: ${response.status})`);
}

export function sendFreeTierExpiredEmail(to: string, name: string, className: string, graceEndsAt: Date) {
  return sendSubscriptionNotice(to, name, "Batas Free Tier Kalivergo Terlewati", "Batas Free Tier Terlewati", className, graceEndsAt);
}

export function sendSubscriptionExpiredEmail(to: string, name: string, className: string, graceEndsAt: Date) {
  return sendSubscriptionNotice(to, name, "Subscription Kalivergo Telah Berakhir", "Subscription Telah Berakhir", className, graceEndsAt);
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

export async function sendPlatformAdminForgotPasswordVerificationEmail(
  email: string,
  verificationLink: string
) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtpUser,
    to: email,
    subject: 'Verifikasi Reset Password Admin Platform',
    html: `
      <h2>Verifikasi Reset Password Admin Platform</h2>
      <p>Klik link berikut untuk mengubah password akun admin platform Anda:</p>
      <a href="${verificationLink}">Verifikasi Reset Password</a>
      <p>Link akan kadaluarsa dalam 1 jam.</p>
    `,
  });
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