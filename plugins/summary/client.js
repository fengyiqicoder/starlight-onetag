// Browser side of starlight-onetag-summary.
import { addStyle, answerLanguage, BASE_CSS, contentRoot, demoNote, el, errorText, hash, pageText, pageTitle, render, store, stream } from '../shared.js';

export default function init(cfg) {
	const h1 = document.querySelector('h1#_top');
	if (!h1 || !contentRoot()) return;
	const text = pageText(28000);
	if (text.length < cfg.minChars) return;
	addStyle('starlight-onetag-summary', BASE_CSS + CSS);

	const cacheKey = 'starlight-onetag-summary:' + location.pathname + ':' + hash(text);
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

	let done = false;
	async function run() {
		button.hidden = true;
		panel.hidden = false;
		if (done) return;
		const cached = cfg.cache ? store(cacheKey) : null;
		if (typeof cached === 'string' && cached) {
			render(answer, cached);
			done = true;
			return;
		}
		status.classList.remove('error');
		status.textContent = 'Reading the page…';
		try {
			const out = await stream(cfg, `Summarize this page. Answer in ${answerLanguage(cfg)}.`, [`Page: ${pageTitle()}`, text], answer, {
				system: cfg.rules,
				onDelta: () => (status.textContent = ''),
			});
			status.textContent = '';
			done = true;
			if (cfg.cache) store(cacheKey, out);
		} catch (e) {
			status.textContent = errorText(e);
			status.classList.add('error');
		}
	}
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
