export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    const recipient = process.env.CONTACT_EMAIL || process.env.FORMSUBMIT_EMAIL;
    if (!recipient) {
      return res.status(500).json({ ok: false, error: 'Contact email is not configured.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || body.problem || '').trim();
    const honey = String(body._honey || body.website || '').trim();

    if (honey) return res.status(200).json({ ok: true });
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Please fill out all required fields.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    const data = new FormData();
    data.append('name', name);
    data.append('email', email);
    data.append('message', message);
    data.append('_subject', process.env.CONTACT_SUBJECT || 'New Pigtown Sanctuary website message');
    data.append('_template', 'table');
    data.append('_captcha', 'false');

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      return res.status(502).json({ ok: false, error: 'The message could not be sent right now.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'The message could not be sent right now.' });
  }
}
