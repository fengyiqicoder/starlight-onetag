// The answer cache kept in the reader's browser: one entry per page and language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheGet, cacheKey, cacheSet, dropLegacy } from '../plugins/shared.js';

class Mem {
	constructor(seed = {}) {
		this.m = new Map(Object.entries(seed));
	}
	getItem(k) {
		return this.m.has(k) ? this.m.get(k) : null;
	}
	setItem(k, v) {
		this.m.set(k, String(v));
	}
	removeItem(k) {
		this.m.delete(k);
	}
	key(i) {
		return [...this.m.keys()][i] ?? null;
	}
	get length() {
		return this.m.size;
	}
	keys() {
		return [...this.m.keys()].sort();
	}
}
const use = (seed) => (globalThis.localStorage = new Mem(seed));

test('a key names the feature, the page and the language', () => {
	assert.equal(cacheKey('summary', '/guides/start/', 'English'), 'starlight-onetag:summary:/guides/start/:English');
	assert.notEqual(cacheKey('summary', '/guides/start/', 'English'), cacheKey('summary', '/guides/start/', 'Japanese'));
	assert.notEqual(cacheKey('summary', '/guides/start/', 'ja'), cacheKey('translate', '/guides/start/', 'ja'));
});

test('an answer comes back while the page is unchanged', () => {
	use();
	const key = cacheKey('summary', '/a/', 'English');
	cacheSet(key, 'h1', '- one\n- two');
	assert.equal(cacheGet(key, 'h1'), '- one\n- two');
});

test('an answer made from an older version of the page is not used', () => {
	use();
	const key = cacheKey('summary', '/a/', 'English');
	cacheSet(key, 'h1', 'old');
	assert.equal(cacheGet(key, 'h2'), null);
});

test('a new answer replaces the old one instead of piling up', () => {
	const mem = use();
	const key = cacheKey('summary', '/a/', 'English');
	cacheSet(key, 'h1', 'old');
	cacheSet(key, 'h2', 'new');
	assert.deepEqual(mem.keys(), [key]);
	assert.equal(cacheGet(key, 'h2'), 'new');
});

test('each language of a page keeps its own answer', () => {
	const mem = use();
	cacheSet(cacheKey('translate', '/a/', 'ja'), 'h1', ['こんにちは']);
	cacheSet(cacheKey('translate', '/a/', 'fr'), 'h1', ['Bonjour']);
	assert.equal(mem.keys().length, 2);
	assert.deepEqual(cacheGet(cacheKey('translate', '/a/', 'ja'), 'h1'), ['こんにちは']);
	assert.deepEqual(cacheGet(cacheKey('translate', '/a/', 'fr'), 'h1'), ['Bonjour']);
});

test('anything else found under the key reads as nothing', () => {
	const key = cacheKey('summary', '/a/', 'English');
	for (const raw of ['"a bare string"', '["an","array"]', '{"t":"no hash"}', 'not json', 'null', '{"h":"h1"}']) {
		use({ [key]: raw });
		assert.equal(cacheGet(key, 'h1'), null, raw);
	}
});

test('entries written by 0.4 and earlier are cleared, the language choice is kept', () => {
	const mem = use({
		'starlight-onetag-summary:/a/:1x2y3z': '"old summary"',
		'starlight-onetag-summary:/b/:9abc': '"old summary"',
		'starlight-onetag-translate:/a/:ja:1x2y3z': '["old"]',
		'starlight-onetag-translate:lang': '"ja"',
		'starlight-onetag:summary:/a/:English': '{"h":"h1","t":"new"}',
		'theme': 'dark',
	});
	dropLegacy('summary');
	dropLegacy('translate');
	assert.deepEqual(mem.keys(), ['starlight-onetag-translate:lang', 'starlight-onetag:summary:/a/:English', 'theme']);
});

test('a browser with storage switched off does not break anything', () => {
	globalThis.localStorage = {
		get length() {
			throw new Error('denied');
		},
		getItem() {
			throw new Error('denied');
		},
		setItem() {
			throw new Error('denied');
		},
	};
	const key = cacheKey('summary', '/a/', 'English');
	assert.doesNotThrow(() => cacheSet(key, 'h1', 'x'));
	assert.equal(cacheGet(key, 'h1'), null);
	assert.doesNotThrow(() => dropLegacy('summary'));
});
