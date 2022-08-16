const { getOpts } = require('./utils');
const GSM7_REPLACEMENTS = require('../src/static/gsm7-replacements.json');

function replaceAccent(text) {
  let updated = '';
  const removed = new Set();
  const replaced = {};
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    let replacement = GSM7_REPLACEMENTS[char];
    replacement = replacement === undefined ? char : replacement;
    if (replacement === '') removed.add(char);
    else {
      updated += replacement;
      if (char !== replacement) replaced[char] = replacement;
    }
  }
  updated = updated
    .split('\n')
    .reduce((acc, str) => {
      return `${acc}\n${str.replace(/\s+/g, ' ')}`;
    }, '')
    .trim();
  return { updated, replaced, removed: Array.from(removed) };
}

exports.handler = (evt, ctx, cb) => {
  const requestBody = JSON.parse(evt.body);
  return cb(null, getOpts({ body: JSON.stringify(replaceAccent(requestBody.message)) }));
};
