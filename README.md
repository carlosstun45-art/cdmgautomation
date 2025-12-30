# CDMG Automation — Static Website (4 languages) + Automation Hooks

Static, fast website in 4 languages:
- English (EN)
- Español (ES)
- Français (FR)
- Nederlands (NL)

## What’s included
- Professional multi-language pages (Home, Services, About, Contact, Privacy)
- Plan selection (Starter / Pro / Growth) saved in the browser
- Contact form + plan selection can be sent to your automation backend (recommended: n8n)

## Files
- `index.html` — Home
- `services.html` — Services + pricing + plan picker
- `about.html` — About
- `contact.html` — Contact form (posts to automation; mailto fallback)
- `privacy.html` — Privacy Policy
- `styles.css` — Styling
- `config.js` — Edit company links (email, calendly, whatsapp) + optional direct webhook fallback
- `i18n.js` — Translations
- `main.js` — Language switcher + form/plan automation
- `/netlify/functions/automation.js` — Proxy that forwards website events to n8n (recommended)
- `netlify.toml` — Netlify functions config
- `/assets` — Logo + favicons

## Deploy (recommended way, so automations work)
1) Push this folder to GitHub.
2) Netlify → “Add new site” → “Import from Git”.
3) In Netlify → Site settings → **Environment variables** add:
   - `N8N_WEBHOOK_URL` = your n8n Webhook **Production URL**
   - `AUTOMATION_SECRET` = (optional) shared secret to reduce spam
4) Deploy.

### If you deploy as a simple static site (no Functions)
You can still send leads directly to your automation webhook:
- Set `automationWebhookUrl` in `config.js`
- Note: direct webhooks require CORS enabled on your automation server.

## Website → automation payloads
The website sends:
- `event: "lead"` — when the contact form is submitted
- `event: "plan_selected"` — when a plan card is selected

Each payload also includes a `meta` object (page URL, timestamp, etc.).
