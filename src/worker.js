const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
const cleanMessage = (value) => String(value || '').trim().slice(0, 8000);

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

async function readSubmission(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  try {
    return await request.json();
  } catch {
    try {
      const form = await request.formData();
      return Object.fromEntries(form.entries());
    } catch {
      return null;
    }
  }
}

async function handleContact(request, env) {
  const data = await readSubmission(request);
  if (!data) return json({ ok: false, error: 'Invalid form submission.' }, 400);

  const name = clean(data.name);
  const email = clean(data.email);
  const message = cleanMessage(data.message || data.problem);
  const honey = clean(data._honey || data.website);

  if (honey) return json({ ok: true });
  if (!name || !email || !message) return json({ ok: false, error: 'Please fill out all three fields.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);

  const subject = clean(env.CONTACT_SUBJECT || `Pigtown Sanctuary inquiry from ${name}`);
  const recipient = clean(env.CONTACT_EMAIL || env.FORM_TO || env.RESEND_TO || env.FORMSUBMIT_EMAIL);

  if (env.RESEND_API_KEY) {
    if (!recipient) return json({ ok: false, error: 'Contact service is not configured.' }, 503);
    return sendWithResend({ env, recipient, subject, name, email, message });
  }

  const formSubmitRecipient = clean(env.FORMSUBMIT_EMAIL || env.CONTACT_EMAIL);
  if (formSubmitRecipient) {
    return sendWithFormSubmit({ recipient: formSubmitRecipient, subject, name, email, message });
  }

  return json({ ok: false, error: 'Contact service is not configured.' }, 503);
}

async function sendWithResend({ env, recipient, subject, name, email, message }) {
  const from = clean(env.FORM_FROM || env.RESEND_FROM || 'Pigtown Sanctuary <onboarding@resend.dev>');
  const text = [
    'New Pigtown Sanctuary inquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    message
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: email,
      subject,
      text
    })
  });

  if (!response.ok) return json({ ok: false, error: 'The message could not be sent right now.' }, 502);
  return json({ ok: true });
}

async function sendWithFormSubmit({ recipient, subject, name, email, message }) {
  const body = new FormData();
  body.append('name', name);
  body.append('email', email);
  body.append('message', message);
  body.append('_subject', subject);
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
