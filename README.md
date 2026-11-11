# starlight-onetag

Free AI features for [Starlight](https://starlight.astro.build) docs. No account, no backend, no credit card.

- **Ask AI**: a button next to search; readers ask, the answer comes from your own pages, with links.
- **AI answers in search**, above the Pagefind results.
- **Read in your language**: one-click page translation for readers. In Chrome it runs on the reader's device, with no key at all.
- **Explain this code** under code blocks, **Summarize this page**, and **ask about a selection**.

Each feature is optional and none needs a server. On localhost everything works right after install. A deployed site needs a free key for the AI answers: enter an email, the key arrives in your inbox. No sign-up form, no password, no dashboard.

Retrieval uses the Pagefind index Starlight already builds, and the AI code loads only when a reader uses a feature, so Lighthouse stays where it was.

Live demo: the [Astro AI Docs](https://fengyiqicoder.github.io/astro-ai-docs/guides/ai-features/) template runs every feature.

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

## Before you deploy: get a free key (email only)

The demo key answers on localhost only. A deployed site needs its own key, passed as `starlightOnetag({ key: "ot_..." })`. Without one, readers see a line saying Ask AI is not set up, and the build prints a warning.

Fill in your email at [onetagai.com](https://onetagai.com/?ref=starlight-onetag), or run this; the key arrives in that inbox (one key per email, 1,000,000 free tokens, one time, no monthly reset):

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

## More AI features in this package

Five more plugins ship in the same package. Add the ones you want next to `starlightOnetag()`; they share the key and add no component overrides.

```js
import starlightOnetag from "starlight-onetag";
import starlightOnetagSearch from "starlight-onetag/search";
import starlightOnetagTranslate from "starlight-onetag/translate";
import starlightOnetagExplain from "starlight-onetag/explain";
import starlightOnetagSummary from "starlight-onetag/summary";
import starlightOnetagSelection from "starlight-onetag/selection";

starlight({
  plugins: [
    starlightOnetag(),
    starlightOnetagSearch(),    // AI answer inside the search dialog, above the Pagefind results
    starlightOnetagTranslate(), // "Read in <your language>": AI translation of the page for the reader
    starlightOnetagExplain(),   // "Explain this code" under every code block
    starlightOnetagSummary(),   // "Summarize this page" on long pages
    starlightOnetagSelection(), // select text, click Ask AI, get it explained in context
  ],
});
```

Each one has its own page with screenshots and options: [search](https://github.com/fengyiqicoder/starlight-onetag-search), [translate](https://github.com/fengyiqicoder/starlight-onetag-translate), [explain](https://github.com/fengyiqicoder/starlight-onetag-explain), [summary](https://github.com/fengyiqicoder/starlight-onetag-summary), [selection](https://github.com/fengyiqicoder/starlight-onetag-selection). The options are the same as listed there; the key also comes from `PUBLIC_ONETAG_KEY`.

## Use it from your own plugin

`starlight-onetag/api` exposes the same helpers for other Starlight plugins that want an optional AI switch: `askDocs(cfg, question, target)`, `summarizePage(cfg, target)`, `explainText(cfg, text, target)`. [starlight-page-feedback](https://github.com/fengyiqicoder/starlight-page-feedback) uses it.

## See also

- [Astro AI Docs](https://github.com/fengyiqicoder/astro-ai-docs): a docs template that ships with this dialog built in.
- [Static AI Block](https://github.com/fengyiqicoder/static-ai-block): twelve copy-paste AI blocks for any static page.

## License

MIT. Powered by OneTag AI.
