CDMG Website (Manual Deploy)

Chat options:
1) Netlify Function (default):
   - Set environment variable OPENAI_API_KEY in Netlify Site settings.
   - The website calls: /.netlify/functions/chat

2) External webhook (optional):
   - Open assets/config.js
   - Set: window.CDMG_CHAT_WEBHOOK_URL = "https://YOUR_WEBHOOK_URL"
   - The website will POST JSON: { message, lang }

Notes:
- The site does NOT display tool names (workflow engine is generic).
- Language selector shows flags and stays consistent across devices.
