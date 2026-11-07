import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { Script } from 'node:vm';
await import('./timeline.js');
const root = new URL('.', import.meta.url);
for (const name of ['script.js', 'timeline.js', 'settings.js']) {
  new Script(await readFile(new URL(name, root), 'utf8'), { filename: name });
}
const html = await readFile(new URL('index.html', root), 'utf8');
for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/g)) await access(new URL(path, root));
await access(new URL('assets/Inter-OFL.txt', root));
const { words, sample } = globalThis.RevealTimeline;
assert.equal(words.length, 27);
assert.equal(new Set(words.map(w => w.exit)).size, words.length);
for (const word of words) {
  assert.equal(sample(word, word.start - .001).state, 'hidden');
  assert.notEqual(sample(word, word.start).state, 'hidden');
  assert.equal(sample(word, 5.5).state, 'settled');
  assert.equal(sample(word, 9.875).state, 'hidden');
  assert.deepEqual(sample(word, 9.25), sample(word, 9.25));
}
const partial = words.map(w => sample(w, 9.3).state);
assert(partial.includes('hidden') && partial.some(s => s !== 'hidden'));
assert.equal(sample(words[3], 5.02).state, 'panel');
assert.equal(sample(words[26], 7.42).state, 'panel');
for (const [start, end, ids, cut, offset] of [
  [103,104,[0,1,2,3,4,5,6,7],48,36],
  [142,145,[14,15,16,17,18,19,20,21],63,17],
  [189,200,[8,9,10,11,12,13],40,-17],
]) {
  for (const id of ids) {
    assert.notEqual(sample(words[id], (start - .01) / 24).state, 'slice');
    assert.deepEqual(sample(words[id], start / 24), { state: 'slice', strength: 0, cut, offset });
    assert.notEqual(sample(words[id], end / 24).state, 'slice');
  }
  for (const word of words.filter(word => !ids.includes(word.id)))
    assert.notEqual(sample(word, start / 24).state, 'slice');
}
for (const length of [.5, 1, 2]) {
  for (const word of words) {
    assert.notEqual(sample(word, word.start, length).state, 'hidden');
    assert.equal(sample(word, 10.1, length).state, 'hidden');
  }
}
console.log('PASS: JavaScript syntax, local assets, 27-word entrance/hold/exit boundaries, deterministic seeking, idle accents.');
