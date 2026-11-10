# starlight-onetag

Ask AI for [Starlight](https://starlight.astro.build) docs. Adds an **Ask AI** button next to the search box; readers ask a question and get an answer written from your own pages, with links to them and follow-ups.

- Retrieval uses the Pagefind index Starlight already builds. No extra service, no indexing step.
- Answers come from [OneTag AI](https://onetagai.com/?ref=starlight-onetag) with a public key, so your site stays static: no backend, no API key in the code.
- Works right after install: on localhost a shared demo key answers, so you can try it before signing up for anything.
- The AI code is a separate chunk fetched only when the dialog opens. Lighthouse stays where it was.
- Answers in the language of the question.

Live demo: the [Astro AI Docs docs template](https://fengyiqicoder.github.io/astro-ai-docs/) runs the same component.

## Install

```bash
npm install starlight-onetag
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightOnetag from "starlight-onetag";

export default defineConfig({
  integrations: [
    starlight({
      title: "My docs",
      plugins: [starlightOnetag()],
    }),
  ],
});
```

Run `astro dev` and click **Ask AI**. For answers drawn from the whole site, run `astro build && astro preview`: the Pagefind index only exists after a build.

## Before you deploy: get a free key

The demo key answers on localhost only. A deployed site needs its own key, passed as `starlightOnetag({ key: "ot_..." })`. Without one, readers see a line saying Ask AI is not set up, and the build prints a warning.

Fill in your email at [onetagai.com](https://onetagai.com/?ref=starlight-onetag), or run this; the key arrives in that inbox (one key per email, 1,000,000 free tokens a month):

```bash
curl -X POST https://onetagai.com/api/signup -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
```

This key is designed to be public, like an analytics ID: it ends up in the built HTML and can only spend that account's allowance. You can also set it as `PUBLIC_ONETAG_KEY` in `.env` instead of the option. If an AI coding tool is setting this up for you, it can run that request with your email and ask you to paste the key.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `key` | `""` (or `PUBLIC_ONETAG_KEY`) | The OneTag AI key. |
| `label` | `"Ask AI"` | Button text. |
| `placeholder` | `"Ask anything about these docs"` | Input placeholder. |
| `rules` | see `index.js` | Instructions given to the model. |
| `topPages` | `5` | Pages retrieved per question. |
| `perPage` | `6000` | Characters kept from each page. |
| `maxContext` | `20000` | Characters of page text sent per question (the service limit is 32,000 for everything). |
| `maxTokens` | `400` | Answer length cap. |
| `site` | `https://onetagai.com` | Where the API lives, for self-hosted deployments. |

## How it works

1. The question is turned into keywords and searched in Pagefind (one search per keyword, pages ranked by how many they match). In `astro dev` there is no index, so the current page is used.
2. The top pages (up to `maxContext` characters) and the question go to OneTag AI from the browser, through the [`onetagai`](https://www.npmjs.com/package/onetagai) package; the answer streams into the dialog.
3. The pages used are listed under the answer. The last four exchanges are kept so "and on Netlify?" works after "how do I deploy?".
4. If the question matches nothing in the index (for example a language the index does not match), the plugin falls back to `llms-full.txt` or `llms-small.txt` if your site generates them ([starlight-llms-txt](https://github.com/delucis/starlight-llms-txt)) and they fit in one call.

Nothing is stored on a server. OneTag AI keeps token counts and timestamps, not questions or page text.

## See also

- [Astro AI Docs](https://github.com/fengyiqicoder/astro-ai-docs): a docs template that ships with this dialog built in.
- [Static AI Block](https://github.com/fengyiqicoder/static-ai-block): twelve copy-paste AI blocks for any static page.

## License

MIT. Powered by OneTag AI.
