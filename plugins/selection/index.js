/**
 * starlight-onetag-selection: select text in Starlight docs, click "Ask AI", get it explained in context.
 *
 *   import starlightOnetagSelection from "starlight-onetag/selection";
 *   starlight({ plugins: [starlightOnetagSelection()] })
 */
import { makePlugin } from '../plugin.js';

export default function starlightOnetagSelection(options = {}) {
	return makePlugin(
		'starlight-onetag-selection',
		{
			key: options.key ?? '',
			site: options.site ?? 'https://onetagai.com',
			label: options.label ?? 'Ask AI',
			minChars: options.minChars ?? 2,
			maxChars: options.maxChars ?? 2000,
			lang: options.lang ?? '',
			rules:
				options.rules ??
				'A reader selected part of a documentation page and wants it explained. Explain the selected text in the context of the page: what it means, why it matters here, and an example if that helps. Plain words, under 120 words, no headings. If they ask a follow-up, answer it from the page.',
			maxTokens: options.maxTokens ?? 400,
		},
		'selection explanations',
		'starlight-onetag/selection/client'
	);
}
