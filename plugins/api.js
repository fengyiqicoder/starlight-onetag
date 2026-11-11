// starlight-onetag/api: AI helpers other Starlight plugins can switch on.
// Every call runs in the browser and spends the site's OneTag AI key; on localhost a shared demo key answers.
//
//   import { askDocs, summarizePage, explainText } from "starlight-onetag/api";
//   await askDocs({ key, base: "/" }, "How do I deploy?", answerElement);
import { answerLanguage, pageText, pageTitle, stream } from './shared.js';

export { render, errorText } from './shared.js';

const DEFAULTS = { site: 'https://onetagai.com', base: '/', topPages: 5, perPage: 5000, maxContext: 20000, maxTokens: 400, via: 'starlight-onetag/api' };
const withDefaults = (cfg = {}) => ({ ...DEFAULTS, ...cfg, base: (cfg.base || '/').replace(/\/?$/, '/') });

const STOP = new Set(('a an and are as at be by can could do does for from how i if in into is it its me my of on or ' +
	'our should site that the their there these this to use using we what when where which who why will with you your').split(' '));
function keywords(q) {
	const words = (q.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || []).filter((w) => w.length > 1 && !STOP.has(w));
	const unique = [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 6);
	return unique.length ? unique : [q];
}

// Top pages for the question from the Pagefind index Starlight builds. Pagefind matches every
// word of a query, so keywords are searched one by one and pages ranked by how many they match.
export async function retrieve(cfg, question) {
	try {
		const pf = await import(/* @vite-ignore */ cfg.base + 'pagefind/pagefind.js');
		await pf.init();
		const searches = await Promise.all(keywords(question).map((w) => pf.search(w)));
		const scores = new Map();
		searches.forEach((s) =>
			s.results.slice(0, 10).forEach((r, rank) => {
				const cur = scores.get(r.id) || { score: 0, result: r };
				cur.score += 1 + Math.max(0, 10 - rank) / 20 + (r.score || 0) / 100;
				scores.set(r.id, cur);
			})
		);
		const top = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, cfg.topPages);
		const hits = await Promise.all(top.map((t) => t.result.data()));
		const pages = hits.map((h) => ({ title: h.meta?.title || h.url, url: h.url, text: (h.content || h.excerpt || '').slice(0, cfg.perPage) }));
		if (pages.length) return pages;
	} catch {}
	// No index (astro dev) or nothing matched: fall back to llms-full.txt, then the current page.
	for (const name of ['llms-full.txt', 'llms-small.txt']) {
		try {
			const r = await fetch(cfg.base + name);
			if (!r.ok) continue;
			const text = await r.text();
			if (text.length <= cfg.maxContext) return [{ title: 'All pages', url: cfg.base + name, text }];
		} catch {}
	}
	return [{ title: pageTitle(), url: location.pathname, text: pageText(cfg.perPage) }];
}


/** Answer a question from the docs (Pagefind retrieval). Streams into `target` if given; resolves to { text, pages }. */
export async function askDocs(cfg, question, target, opts = {}) {
	cfg = withDefaults(cfg);
	const pages = await retrieve(cfg, question);
	let budget = cfg.maxContext;
	const parts = [];
	for (const p of pages) {
		const chunk = `Page: ${p.title} (${p.url})\n${p.text}`.slice(0, budget);
		if (!chunk) break;
		parts.push(chunk);
		budget -= chunk.length;
	}
	const system =
		opts.system ||
		'You answer questions from a documentation site. Answer only from the pages provided. When they cover the question, answer it directly in under 120 words and stop. When they do not, say so in one sentence and name the closest page. Plain text, no headings. Answer in the language of the question.';
	const text = await stream(cfg, question + '\n\n(Reply in the same language as the question above.)', parts, target, { ...opts, system });
	return { text, pages: pages.filter((p) => p.title !== 'All pages') };
}

/** Summarize the current page in a few bullets. */
export async function summarizePage(cfg, target, opts = {}) {
	cfg = withDefaults(cfg);
	const system =
		opts.system ||
		'You summarize a documentation page for a reader deciding whether it answers their question. Give 3 to 5 bullets, each one line, with the concrete facts. No intro, no heading, no closing line.';
	return stream(cfg, `Summarize this page. Answer in ${answerLanguage(cfg)}.`, [`Page: ${pageTitle()}`, pageText(28000)], target, { ...opts, system });
}

/** Explain a piece of text (a selection, a term) in the context of the current page. */
export async function explainText(cfg, text, target, opts = {}) {
	cfg = withDefaults(cfg);
	const system =
		opts.system ||
		'A reader wants part of a documentation page explained. Explain it in the context of the page: what it means and why it matters here. Plain words, under 100 words, no headings.';
	return stream(cfg, opts.question || `Explain: "${text}". Answer in ${answerLanguage(cfg)}.`, [`Page: ${pageTitle()}`, `Text: ${text}`, opts.context ? `Where it appears: ${opts.context}` : '', `The page:\n${pageText(12000)}`].filter(Boolean), target, { ...opts, system });
}
