const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const name = clean(data.name);
  const email = clean(data.email);
  const message = String(data.message || '').trim();

  if (!name || !email || !message) return json({ ok: false, error: 'Please fill out all three fields.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Email service is not configured yet.' }, 500);

  const subject = `Pigtown Sanctuary inquiry from ${name}`;
  const text = [
    'New Pigtown Sanctuary website inquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Message:',
    message
  ].join('\n');

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

  if (!response.ok) return json({ ok: false, error: 'The message could not be sent yet.' }, 502);
  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ ok: false, error: 'Use POST.' }, 405);
}
