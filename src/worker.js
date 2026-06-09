const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405);
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const name = clean(data.name);
  const email = clean(data.email);
  const message = String(data.message || data.problem || '').trim();
  const honey = clean(data._honey || data.website);
  const recipient = clean(env.CONTACT_EMAIL || env.FORMSUBMIT_EMAIL || 'pigtownsanctuary@gmail.com');

  if (honey) return json({ ok: true });
  if (!name || !email || !message) return json({ ok: false, error: 'Please fill out all three fields.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);

  const body = new FormData();
  body.append('name', name);
  body.append('email', email);
  body.append('message', message);
  body.append('_subject', env.CONTACT_SUBJECT || `Pigtown Sanctuary inquiry from ${name}`);
  body.append('_template', 'table');
  body.append('_captcha', 'false');

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    return json({ ok: false, error: 'The message could not be sent right now.' }, 502);
  }

  return json({ ok: true });
}
