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
  const githubToken = process.env.GITHUB_TOKEN;

  // Store in GitHub private repo if token available
  if (githubToken) {
    try {
      const fileUrl = 'https://api.github.com/repos/quorbz/ops-playbooks/contents/leads/waitlist.json';
      const headers = {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      };

      // Get current file
      const getRes = await fetch(fileUrl, { headers });
      if (getRes.ok) {
        const fileData = await getRes.json();
        const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
        currentContent.waitlist.push({ email, ts: new Date().toISOString() });
        const newContent = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64');

        await fetch(fileUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Add waitlist lead: ${email}`,
            content: newContent,
            sha: fileData.sha
          })
        });
      }
    } catch {
      // Fall through to Telegram fallback
    }
  }

  // Log to Vercel function logs as backup (visible in Vercel dashboard)
  console.log(JSON.stringify({ event: 'waitlist_signup', email, ts: new Date().toISOString() }));

  return res.status(200).json({ ok: true });
}
