---
description: "Use when editing contact, forms, email delivery, index.html, src/worker.js, or deployment code for Pigtown Sanctuary. Covers the current FormSubmit contact form and Worker fallback handling."
name: "Pigtown Sanctuary Contact Form Protection"
---
# Pigtown Sanctuary Contact Form Protection

Apply these instructions whenever editing the contact section, `index.html`, `src/worker.js`, or deployment code.

- Preserve the existing direct FormSubmit form in `index.html` unless Pryce explicitly approves a replacement.
- Before merge or deploy, confirm the source contains:
  - `formsubmit` or `formsubmit.co`
  - `pigtownsanctuary@gmail.com`
  - the honeypot field
- If `src/worker.js` is touched, preserve the current fallback behavior for FormSubmit/Resend handling.
- Do not infer contact health from deploy status alone.
