const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const html = (message, status = 200) => new Response(`<!doctype html><meta charset="utf-8"><title>Pigtown Sanctuary</title><body style="font-family:system-ui;margin:3rem;line-height:1.5"><h1>${message}</h1><p><a href="/">Return to the site</a></p></body>`, {
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8' }
});

const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function onRequestPost(context) {
  const { request, env } = context;
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  let data;
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return wantsJson ? json({ ok: false, error: 'Invalid form submission.' }, 400) : html('The message could not be sent right now.', 400);
  }

  const honeypot = clean(data.website);
  if (honeypot) return wantsJson ? json({ ok: true }) : html('Message sent. Thank you.');

  const name = clean(data.name);
  const email = clean(data.email);
  const topic = clean(data.topic);
  const message = String(data.message || '').trim();

  if (!name || !email || !message) return wantsJson ? json({ ok: false, error: 'Please fill out your name, email, and message.' }, 400) : html('Please fill out your name, email, and message.', 400);
  if (!isEmail(email)) return wantsJson ? json({ ok: false, error: 'Please enter a valid email address.' }, 400) : html('Please enter a valid email address.', 400);
  if (!env.RESEND_API_KEY) return wantsJson ? json({ ok: false, error: 'The message could not be sent right now.' }, 500) : html('The message could not be sent right now. Please try again shortly.', 500);

  const subject = `Pigtown Sanctuary inquiry from ${name}`;
  const text = [
    'New Pigtown Sanctuary website inquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    topic ? `Topic: ${topic}` : '',
    '',
    'Message:',
    message,
    '',
    `Submitted from: ${request.headers.get('referer') || 'pigtownsanctuary.org'}`
  ].filter(Boolean).join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FORM_FROM || 'Pigtown Sanctuary <onboarding@resend.dev>',
      to: [env.FORM_TO || 'pigtownsanctuary@gmail.com'],
      reply_to: email,
      subject,
      text
    })
  });

  if (!response.ok) return wantsJson ? json({ ok: false, error: 'The message could not be sent right now.' }, 502) : html('The message could not be sent right now. Please try again shortly.', 502);
  return wantsJson ? json({ ok: true }) : html('Message sent. Thank you.');
}

export async function onRequestGet() {
  return html('Use the contact form to send a message.', 405);
}
