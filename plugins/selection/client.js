// Browser side of starlight-onetag-selection.
import { addStyle, answerLanguage, BASE_CSS, contentRoot, demoNote, el, errorText, pageText, pageTitle, stream } from '../shared.js';

export default function init(cfg) {
	const root = contentRoot();
	if (!root) return;
	addStyle('starlight-onetag-selection', BASE_CSS + CSS);

	let picked = null; // { text, paragraph, rect }
	let controller = null;
	let history = [];

	const pill = el('button', { type: 'button', class: 'onetag-pill', hidden: true, 'data-onetag-ui': '', onmousedown: (e) => e.preventDefault(), onclick: () => open() }, spark(), cfg.label);
	const quote = el('p', { class: 'onetag-quote' });
	const status = el('p', { class: 'onetag-status', 'aria-live': 'polite' });
	const answer = el('div', { class: 'onetag-answer' });
	const field = el('input', { type: 'text', maxlength: '300', placeholder: 'Ask a follow-up', 'aria-label': 'Ask a follow-up about the selection' });
	const form = el('form', { class: 'onetag-follow', onsubmit: (e) => {
		e.preventDefault();
		const q = field.value.trim();
		if (!q) return;
		field.value = '';
		ask(q);
	} }, field, el('button', { type: 'submit', class: 'onetag-btn' }, 'Ask'));
	const close = el('button', { type: 'button', class: 'onetag-link', onclick: () => hideCard() }, 'Close');
	const card = el('div', { class: 'onetag-card', hidden: true, role: 'dialog', 'aria-label': 'AI explanation of the selected text', 'data-onetag-ui': '' },
		quote, status, answer, form, demoNote(cfg), el('p', { class: 'onetag-foot' }, 'Explained by AI from this page. ', close));
	document.body.append(pill, card);

	function selection() {
		const sel = getSelection();
		if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
		const text = sel.toString().trim();
		if (text.length < cfg.minChars || text.length > cfg.maxChars) return null;
		const range = sel.getRangeAt(0);
		const node = range.commonAncestorContainer;
		const elm = node.nodeType === 1 ? node : node.parentElement;
		if (!root.contains(elm) || elm.closest('[data-onetag-ui], input, textarea')) return null;
		const block = elm.closest('p, li, td, pre, blockquote, dd, h2, h3, h4, .expressive-code') || elm;
		const rects = range.getClientRects();
		const rect = rects[rects.length - 1] || range.getBoundingClientRect();
		return { text, paragraph: block.textContent.trim().slice(0, 1500), rect };
	}

	function position(node, rect, below = 8) {
		const width = node.offsetWidth;
		const left = Math.min(Math.max(8, rect.left + scrollX), scrollX + document.documentElement.clientWidth - width - 8);
		node.style.left = left + 'px';
		node.style.top = rect.bottom + scrollY + below + 'px';
	}

	let timer = 0;
	const check = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!card.hidden) return;
			const s = selection();
			if (!s) return (pill.hidden = true);
			picked = s;
			pill.hidden = false;
			position(pill, s.rect, 6);
		}, 250);
	};
	document.addEventListener('selectionchange', check);
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			pill.hidden = true;
			if (!card.hidden) hideCard();
		}
	});
	document.addEventListener('mousedown', (e) => {
		if (!card.hidden && !card.contains(e.target)) hideCard();
	});

	function hideCard() {
		controller?.abort();
		card.hidden = true;
		pill.hidden = true;
	}

	function open() {
		if (!picked) return;
		pill.hidden = true;
		history = [];
		quote.textContent = '“' + (picked.text.length > 160 ? picked.text.slice(0, 160) + '…' : picked.text) + '”';
		card.hidden = false;
		position(card, picked.rect, 10);
		ask(null);
	}

	async function ask(followUp) {
		controller?.abort();
		controller = new AbortController();
		const { signal } = controller;
		answer.replaceChildren();
		status.classList.remove('error');
		status.textContent = 'Reading the page…';
		const prompt = followUp || `Explain the selected text: "${picked.text}". Answer in ${answerLanguage(cfg)}.`;
		const input = [`Page: ${pageTitle()}`, `Selected text: ${picked.text}`, `Where it appears: ${picked.paragraph}`, `The page:\n${pageText(12000)}`];
		try {
			const text = await stream(cfg, prompt, input, answer, {
				system: cfg.rules,
				history,
				signal,
				onDelta: () => (status.textContent = ''),
			});
			if (signal.aborted) return;
			status.textContent = '';
			history.push({ role: 'user', content: prompt }, { role: 'assistant', content: text });
			history = history.slice(-6);
		} catch (e) {
			if (signal.aborted) return;
			status.textContent = errorText(e);
			status.classList.add('error');
		}
	}
}

function spark() {
	const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	s.setAttribute('width', '14');
	s.setAttribute('height', '14');
	s.setAttribute('viewBox', '0 0 24 24');
	s.setAttribute('aria-hidden', 'true');
	s.innerHTML = '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>';
	return s;
}

const CSS = `
.onetag-pill { position: absolute; z-index: 30; display: inline-flex; align-items: center; gap: .35rem; font: inherit; font-size: var(--sl-text-sm); padding: .3rem .65rem; border: 1px solid var(--sl-color-accent); border-radius: 999px; background: var(--sl-color-accent-low); color: var(--sl-color-white); box-shadow: var(--sl-shadow-md); cursor: pointer; }
.onetag-pill:hover { background: var(--sl-color-accent); color: var(--sl-color-black); }
.onetag-card { position: absolute; z-index: 31; width: min(28rem, calc(100vw - 1rem)); padding: .9rem 1rem; border: 1px solid var(--sl-color-gray-5); border-radius: .5rem; background: var(--sl-color-gray-6); color: var(--sl-color-text); box-shadow: var(--sl-shadow-lg); }
.onetag-quote { color: var(--sl-color-gray-2); font-style: italic; overflow-wrap: anywhere; }
.onetag-follow { display: flex; gap: .4rem; margin-top: .6rem; }
.onetag-follow input { flex: 1; min-width: 0; font: inherit; font-size: var(--sl-text-sm); padding: .3rem .5rem; border: 1px solid var(--sl-color-gray-5); border-radius: .4rem; background: var(--sl-color-black); color: var(--sl-color-white); }
.onetag-follow input:focus { outline: 2px solid var(--sl-color-accent); outline-offset: 0; }
`;
