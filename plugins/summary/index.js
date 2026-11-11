/**
 * starlight-onetag-summary: a "Summarize this page" box at the top of Starlight docs pages.
 *
 *   import starlightOnetagSummary from "starlight-onetag/summary";
 *   starlight({ plugins: [starlightOnetagSummary()] })
 */
import { makePlugin } from '../plugin.js';

export default function starlightOnetagSummary(options = {}) {
	return makePlugin(
		'starlight-onetag-summary',
		{
			key: options.key ?? '',
			site: options.site ?? 'https://onetagai.com',
			label: options.label ?? 'Summarize this page',
			minChars: options.minChars ?? 1500,
			auto: options.auto ?? false,
			cache: options.cache ?? true,
			lang: options.lang ?? '',
			rules:
				options.rules ??
				'You summarize a documentation page for a reader deciding whether it answers their question. Give 3 to 5 bullets, each one line, with the concrete facts: what the page lets them do, the key steps, commands or options, and any warning. No intro, no heading, no closing line.',
			maxTokens: options.maxTokens ?? 400,
		},
		'page summaries',
		'starlight-onetag/summary/client'
	);
}
