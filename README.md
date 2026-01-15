# CDMG Pro Site (Manual Deploy + AI Function)

This site is static (HTML/CSS/JS) + an optional Netlify Function for the chat widget.

## Deploy (Manual / Drag & Drop)
- Upload the ZIP to Netlify (Deploy manually).
- Works without any build step.

## Enable AI chat
1) Netlify → Site settings → Environment variables
2) Add: `OPENAI_API_KEY`
3) Redeploy (manual upload again)

If no API key is set, the chat falls back to the built-in FAQ responses.
