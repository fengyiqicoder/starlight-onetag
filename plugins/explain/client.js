// Browser side of starlight-onetag-explain.
import { addStyle, answerLanguage, BASE_CSS, contentRoot, demoNote, el, errorText, pageTitle, stream } from '../shared.js';

// The text around a code block: the heading it sits under and the paragraph before it.
function context(block) {
	let heading = '';
	let before = '';
	let n = block;
	while (n && n.parentElement !== contentRoot()) n = n.parentElement;
	for (let p = n?.previousElementSibling; p; p = p.previousElementSibling) {
		if (!before && !p.matches('.expressive-code, pre')) before = p.textContent.trim().slice(0, 1200);
		if (/^H[2-4]$/.test(p.tagName) || p.querySelector?.(':scope > h2, :scope > h3, :scope > h4')) {
			heading = p.textContent.replace(/Section titled.*$/, '').trim();
			break;
		}
	}
	return { heading, before };
}

export default function init(cfg) {
	const root = contentRoot();
	if (!root) return;
	const blocks = [...root.querySelectorAll('.expressive-code')];
	root.querySelectorAll('pre').forEach((pre) => {
		if (!pre.closest('.expressive-code')) blocks.push(pre);
	});
	if (!blocks.length) return;
	addStyle('starlight-onetag-explain', BASE_CSS + CSS);

	blocks.forEach((block) => {
		const pre = block.matches('pre') ? block : block.querySelector('pre');
		const code = (pre?.innerText || '').trim();
		if (!code || code.split('\n').length < cfg.minLines) return;
		const lang = pre.getAttribute('data-language') || '';
		const title = block.querySelector('figcaption .title')?.textContent?.trim() || '';

		let controller = null;
		const answer = el('div', { class: 'onetag-answer' });
		const status = el('p', { class: 'onetag-status', 'aria-live': 'polite' });
		const close = el('button', { type: 'button', class: 'onetag-link', onclick: () => {
			controller?.abort();
			panel.hidden = true;
			button.hidden = false;
			button.focus();
		} }, 'Close');
		const panel = el('div', { class: 'onetag-panel', hidden: true, 'data-onetag-ui': '' }, status, answer, demoNote(cfg), el('p', { class: 'onetag-foot' }, 'Explained by AI. ', close));
		const button = el('button', { type: 'button', class: 'onetag-btn onetag-explain-btn', 'data-onetag-ui': '', onclick: run }, spark(), cfg.label);
		block.after(button, panel);

		async function run() {
			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;
			button.hidden = true;
			panel.hidden = false;
			answer.replaceChildren();
			status.classList.remove('error');
			status.textContent = 'Reading the code…';
			const { heading, before } = context(block);
			const input = [
				`Page: ${pageTitle()}`,
				heading && `Section: ${heading}`,
				before && `Text before the code:\n${before}`,
				`Code${lang ? ' (' + lang + ')' : ''}${title ? ', file ' + title : ''}:\n${code.slice(0, 12000)}`,
			].filter(Boolean);
			try {
				await stream(cfg, `Explain this code to a reader of the docs. Answer in ${answerLanguage(cfg)}.`, input, answer, {
					system: cfg.rules,
					signal,
					onDelta: () => (status.textContent = ''),
				});
				status.textContent = '';
			} catch (e) {
				if (signal.aborted) return;
				status.textContent = errorText(e);
				status.classList.add('error');
			}
		}
	});
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
.sl-markdown-content .onetag-explain-btn { margin-top: .5rem; border-color: transparent; background: transparent; color: var(--sl-color-gray-2); padding-inline: .25rem; }
.sl-markdown-content .onetag-explain-btn:hover { color: var(--sl-color-text-accent); border-color: transparent; }
.sl-markdown-content .onetag-panel { margin-top: .5rem; }
`;
