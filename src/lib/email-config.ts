import { env } from "@/config/env";

export function createTransporter() {
  const apiKey = env.brevoApiKey;
  const fromEmail = env.emailFrom ?? "Kalivergo <noreply@smtp-brevo.com>";

  if (!apiKey) {
    throw new Error("No email transporter configured: set BREVO_API_KEY in environment");
  }

  return {
    async sendMail(options: { from?: string; to: string; subject: string; html: string }) {
      const payload = {
        sender: (() => {
          const match = (fromEmail || "").match(/^([^<]+)<([^>]+)>$/);
          if (match) return { name: match[1].trim(), email: match[2].trim() };
          return { name: "Kalivergo", email: fromEmail };
        })(),
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      };

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to send email via Brevo (${res.status}): ${text}`);
      }

      return res;
    },
  };
}