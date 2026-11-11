// The language answers are written in: the owner's option, else the language the reader
// chose with the translate button, else the page's own language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { answerLanguage, setReading } from '../plugins/shared.js';

// The few parts of a document these two functions touch.
function page(lang) {
	const attrs = new Map();
	globalThis.document = {
		documentElement: {
			lang,
			getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
			setAttribute: (k, v) => attrs.set(k, String(v)),
			removeAttribute: (k) => attrs.delete(k),
		},
	};
}

test('answers are in the language of the page when the reader chose none', () => {
	page('en');
	assert.equal(answerLanguage({}), 'English');
});

test('answers follow the language the reader is reading the page in', () => {
	page('en');
	setReading('ja');
	assert.equal(answerLanguage({}), 'Japanese');
});

test('a regional choice keeps its region', () => {
	page('en');
	setReading('zh-TW');
	assert.match(answerLanguage({}), /Chinese/);
	assert.match(answerLanguage({}), /Taiwan|Traditional/);
});

test('back on the original, answers are in the language of the page again', () => {
	page('de');
	setReading('ja');
	setReading('');
	assert.equal(answerLanguage({}), 'German');
});

test("the owner's lang option wins over the reader's choice", () => {
	page('en');
	setReading('ja');
	assert.equal(answerLanguage({ lang: 'French' }), 'French');
});

test('a code the browser does not know is passed on as it is', () => {
	page('en');
	setReading('not a language');
	assert.equal(answerLanguage({}), 'not a language');
});
