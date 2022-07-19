import { StringObject } from './types';

const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ`¿abcdefghijklmnopqrstuvwxyzäöñüà§';
const GSM7_EXTENDED = '^{}\\[~]|€';

const GSM7_BASIC_CHARS: StringObject = GSM7_BASIC.split('').reduce(
  (acc, key) => ({ ...acc, [key]: key }),
  {}
);
const GSM7_EXTENDED_CHARS: StringObject = GSM7_EXTENDED.split('').reduce(
  (acc, key) => ({ ...acc, [key]: key }),
  {}
);
const GSM7_CHARS: StringObject = { ...GSM7_BASIC_CHARS, ...GSM7_EXTENDED_CHARS };

const isGSMText = (text: string) => {
  const textList = text.split('');
  let i = textList.length;
  while (i--) {
    const char = text[i];
    if (GSM7_CHARS[char] === undefined) return false;
  }

  return true;
};

const replacementMapping: StringObject = {
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

export const getMessageInfo = (text: string) => {
  const isGSM = isGSMText(text);
  let isMultipart = false;
  let segmentSize = 0;
  let accentedChars = new Set();

  const messageInfo = {
    isGSM,
    isMultipart: false,
    segmentCount: 1,
    characterSet: isGSM ? 'GSM' : 'Unicode',
    count: text.length
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isGSM && GSM7_EXTENDED_CHARS[char] !== undefined) segmentSize += 2;
    else segmentSize += 1;

    if ((!isGSM && segmentSize > 70) || (isGSM && segmentSize > 160)) {
      isMultipart = true;
      break;
    }
  }

  if (!isMultipart) {
    return { ...messageInfo, accentedChars: Array.from(accentedChars) };
  }

  segmentSize = 0;
  let segmentCount = 1;
  let count = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (replacementMapping[char] !== undefined) accentedChars.add(char);
    if (isGSM && GSM7_EXTENDED_CHARS[char] !== undefined) {
      segmentSize += 2;
      count += 2;
    } else {
      segmentSize += 1;
      count += 1;
    }

    if (isGSM && segmentSize > 153) {
      segmentSize -= 153;
      segmentCount++;
    }
    if (!isGSM && segmentSize > 67) {
      segmentSize -= 67;
      segmentCount++;
    }
  }
  return {
    ...messageInfo,
    count,
    isMultipart,
    segmentCount,
    accentedChars: Array.from(accentedChars)
  };
};
