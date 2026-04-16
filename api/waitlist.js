export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Silently succeed if not configured — don't expose missing config to public
    return res.status(200).json({ ok: true });
  }

  const text = `📬 New Quorbz waitlist signup\n\nEmail: ${email}\nSource: quorbz.com`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch {
    // Don't fail the user-facing request if Telegram call fails
  }

  return res.status(200).json({ ok: true });
}
