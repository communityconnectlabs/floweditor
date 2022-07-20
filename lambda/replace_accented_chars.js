const replacementMapping = {
  à: 'a',
  ê: 'e',
  ã: 'a',
  â: 'a',
  ç: 'c',
  í: 'i',
  î: 'i',
  ú: 'u',
  û: 'u',
  õ: 'o',
  ô: 'o',
  ó: 'o',
  Á: 'A',
  Â: 'A',
  Ã: 'A',
  À: 'A',
  Ç: 'C',
  È: 'E',
  Ê: 'E',
  Í: 'I',
  Î: 'I',
  Ì: 'I',
  Ó: 'O',
  Ô: 'O',
  Ò: 'O',
  Õ: 'O',
  Ú: 'U',
  Ù: 'U',
  Û: 'U',
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '\xa0': ' ',
  '\t': ' ',
  Δ: '',
  '¡': '',
  '¿': '',
  '£': '',
  Φ: '',
  '¥': '',
  è: 'e',
  Λ: '',
  '¤': '',
  é: 'e',
  Ω: '',
  ù: 'u',
  Π: '',
  ì: 'i',
  Ψ: '',
  ò: 'o',
  Σ: '',
  Θ: 'O',
  Ξ: '',
  Ø: 'O',
  Ä: 'A',
  ä: 'a',
  ø: 'o',
  Æ: 'E',
  Ö: 'O',
  ö: 'o',
  æ: 'e',
  Ñ: 'N',
  ñ: 'n',
  Å: 'A',
  ß: '',
  Ü: 'U',
  ü: 'u',
  å: 'a',
  É: 'E',
  '§': ''
};

function replaceAccent(text) {
  let updated = '';
  const removed = new Set();
  const replaced = {};
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    let replacement = replacementMapping[char];
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

const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => {
  const requestBody = JSON.parse(evt.body);
  return cb(null, getOpts({ body: JSON.stringify(replaceAccent(requestBody.message)) }));
};
