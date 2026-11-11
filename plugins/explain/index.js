/**
 * starlight-onetag-explain: an "Explain" button under every code block in Starlight docs.
 *
 *   import starlightOnetagExplain from "starlight-onetag/explain";
 *   starlight({ plugins: [starlightOnetagExplain()] })
 */
import { makePlugin } from '../plugin.js';

export default function starlightOnetagExplain(options = {}) {
	return makePlugin(
		'starlight-onetag-explain',
		{
			key: options.key ?? '',
			site: options.site ?? 'https://onetagai.com',
			label: options.label ?? 'Explain this code',
			minLines: options.minLines ?? 1,
			lang: options.lang ?? '',
			rules:
				options.rules ??
				'You explain code samples in documentation to readers who are learning. Walk through what the code does, step by step, in plain words. Mention what they need to change before using it (placeholders, keys, paths). Use short paragraphs or a short list, under 180 words. Wrap identifiers and commands in backticks. No headings.',
			maxTokens: options.maxTokens ?? 600,
		},
		'code explanations',
		'starlight-onetag/explain/client'
	);
}
