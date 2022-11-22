const { getOpts } = require('./utils');
const GSM7_REPLACEMENTS = require('../src/static/gsm7-replacements.json');

function getHexFromChar(char) {
  return String(char)
    .charCodeAt(0)
    .toString(16)
    .padStart(4, '0')
    .toUpperCase();
}

function replaceAccent(text) {
  let updated = '';
  const removed = new Set();
  const replaced = {};
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const charHex = getHexFromChar(char);
    let replacement = GSM7_REPLACEMENTS[charHex];
    replacement = replacement === undefined ? char : replacement.substitute;
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
