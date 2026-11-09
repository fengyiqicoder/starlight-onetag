/**
 * starlight-onetag: adds an "Ask AI" dialog next to Starlight's search.
 *
 * Usage in astro.config.mjs:
 *   import starlightOnetag from "starlight-onetag";
 *   starlight({ plugins: [starlightOnetag({ key: "YOUR_ONETAG_KEY" })] })
 *
 * Options:
 *   key         OneTag AI key (designed to be public). Also read from PUBLIC_ONETAG_KEY. Without a key the
 *               dialog still appears and tells readers it is not set up; everything else works.
 *   site        Where v1.js and the API live. Default https://onetagai.com
 *   label       Button text. Default "Ask AI"
 *   placeholder Input placeholder.
 *   rules       Instructions given to the model (persona, limits).
 *   topPages    Pages retrieved per question (default 5); perPage characters kept per page (default 6000).
 */
export default function starlightOnetag(options = {}) {
	const opts = {
		key: options.key ?? "",
		site: (options.site ?? "https://onetagai.com").replace(/\/$/, ""),
		label: options.label ?? "Ask AI",
		placeholder: options.placeholder ?? "Ask anything about these docs",
		rules:
			options.rules ??
			"You are the help desk for this documentation site. Answer only from the pages provided. When the pages cover the question, answer it directly and stop. Only when they do not, say so in one sentence and name the closest page. Plain text, under 150 words, no headings. Answer in the language of the question.",
		topPages: options.topPages ?? 5,
		perPage: options.perPage ?? 6000,
		maxContext: options.maxContext ?? 20000,
		maxTokens: options.maxTokens ?? 400,
	};
	return {
		name: "starlight-onetag",
		hooks: {
			"config:setup"({ config, updateConfig, addIntegration, logger }) {
				if (config.components?.Search && config.components.Search !== "starlight-onetag/Search.astro") {
					logger.warn("A custom Search component is already set; starlight-onetag replaces it.");
				}
				updateConfig({ components: { ...config.components, Search: "starlight-onetag/Search.astro" } });
				addIntegration({
					name: "starlight-onetag",
					hooks: {
						"astro:config:setup"({ updateConfig: update }) {
							const id = "virtual:starlight-onetag/config";
							update({
								vite: {
									plugins: [
										{
											name: "starlight-onetag-config",
											resolveId: (source) => (source === id ? "\0" + id : undefined),
											load: (source) => (source === "\0" + id ? `export default ${JSON.stringify(opts)};` : undefined),
										},
									],
								},
							});
						},
					},
				});
			},
		},
	};
}
