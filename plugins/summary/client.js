// Browser side of starlight-onetag-summary.
import { addStyle, answerLanguage, BASE_CSS, cacheGet, cacheKey, cacheSet, contentRoot, demoNote, dropLegacy, el, errorText, hash, onReading, pageText, pageTitle, render, stream } from '../shared.js';

export default function init(cfg) {
	dropLegacy('summary');
	const h1 = document.querySelector('h1#_top');
	if (!h1 || !contentRoot()) return;
	if (pageText(28000).length < cfg.minChars) return;
	addStyle('starlight-onetag-summary', BASE_CSS + CSS);

	const answer = el('div', { class: 'onetag-answer' });
	const status = el('p', { class: 'onetag-status', 'aria-live': 'polite' });
	const hide = el('button', { type: 'button', class: 'onetag-link', onclick: () => {
		panel.hidden = true;
		button.hidden = false;
		button.focus();
	} }, 'Hide');
	const panel = el('div', { class: 'onetag-panel onetag-summary', hidden: true, 'data-onetag-ui': '' }, el('p', { class: 'onetag-summary-title' }, 'Summary'), status, answer, demoNote(cfg), el('p', { class: 'onetag-foot' }, 'Summarized by AI from this page. ', hide));
	const button = el('button', { type: 'button', class: 'onetag-btn', 'data-onetag-ui': '', onclick: run }, lines(), cfg.label);
	const wrap = el('div', { class: 'onetag-summary-wrap', 'data-onetag-ui': '' }, button, panel);
	(document.querySelector('.onetag-translate') || h1).after(wrap);

	// The language of the summary in the panel, and of the one still being written.
	let shown = null;
	let pending = null;
	let controller = null;

	// The page as the reader sees it now. A reader who had it translated gets a summary of the
	// translated page, in that language, kept apart from the summary of the original.
	function current() {
		const text = pageText(28000);
		const language = answerLanguage(cfg);
		return { text, language, key: cacheKey('summary', location.pathname, language), sum: hash(text) };
	}
	function kept(page) {
		const cached = cfg.cache ? cacheGet(page.key, page.sum) : null;
		return typeof cached === 'string' && cached ? cached : null;
	}
	function stop() {
		controller?.abort();
		controller = null;
		pending = null;
	}
	function show(page, text) {
		stop();
		status.textContent = '';
		status.classList.remove('error');
		render(answer, text);
		shown = page.language;
	}

	async function run() {
		button.hidden = true;
		panel.hidden = false;
		const page = current();
		if (shown === page.language || pending === page.language) return;
		const cached = kept(page);
		if (cached) return show(page, cached);
		stop();
		controller = new AbortController();
		const { signal } = controller;
		pending = page.language;
		shown = null;
		answer.replaceChildren();
		status.classList.remove('error');
		status.textContent = 'Reading the page…';
		try {
			const out = await stream(cfg, `Summarize this page. Answer in ${page.language}.`, [`Page: ${pageTitle()}`, page.text], answer, {
				system: cfg.rules,
				signal,
				onDelta: () => (status.textContent = ''),
			});
			if (signal.aborted) return;
			status.textContent = '';
			shown = page.language;
			pending = null;
			if (cfg.cache) cacheSet(page.key, page.sum, out);
		} catch (e) {
			if (signal.aborted) return;
			pending = null;
			status.textContent = errorText(e);
			status.classList.add('error');
		}
	}

	// The reader changed language with the summary open. Swap in the kept summary for the new
	// language when there is one; otherwise close the panel, so the button offers a new one.
	onReading(() => {
		if (panel.hidden) return;
		const page = current();
		if (shown === page.language || pending === page.language) return;
		const cached = kept(page);
		if (cached) return show(page, cached);
		stop();
		panel.hidden = true;
		button.hidden = false;
	});

	if (cfg.auto) run();
}

function lines() {
	const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	s.setAttribute('width', '15');
	s.setAttribute('height', '15');
	s.setAttribute('viewBox', '0 0 24 24');
	s.setAttribute('aria-hidden', 'true');
	s.innerHTML = '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 6h16M4 12h10M4 18h13"/>';
	return s;
}

const CSS = `
.onetag-summary-wrap { margin-top: .75rem; }
.onetag-summary-title { font-weight: 600; color: var(--sl-color-white); }
`;
