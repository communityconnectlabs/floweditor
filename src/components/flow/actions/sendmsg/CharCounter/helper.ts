import { StringObject } from './types';

const GSM7_REPLACEMENTS = require('static/gsm7-replacements.json');
const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ`¿abcdefghijklmnopqrstuvwxyzäöñüà§';
export const GSM7_EXTENDED = '^{}\\[~]|€';

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

export const GSM7_SINGLE_SEGMENT = 160;
export const GSM7_MULTI_SEGMENTS = 153;
export const UCS2_SINGLE_SEGMENT = 70;
export const UCS2_MULTI_SEGMENTS = 67;

export const getMessageInfo = (text: string) => {
  const isGSM = isGSMText(text);
  let isMultipart = false;
  let segmentSize = 0;
  let accentedChars = new Set();

  const messageInfo = {
    isGSM,
    isMultipart: false,
    segmentCount: 1,
    characterSet: isGSM ? 'GSM/7-bit' : 'UCS-2',
    count: text.length
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isGSM && GSM7_EXTENDED_CHARS[char] !== undefined) segmentSize += 2;
    else segmentSize += 1;

    if (
      (!isGSM && segmentSize > UCS2_SINGLE_SEGMENT) ||
      (isGSM && segmentSize > GSM7_SINGLE_SEGMENT)
    ) {
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
    if (GSM7_REPLACEMENTS[char] !== undefined) accentedChars.add(char);
    if (isGSM && GSM7_EXTENDED_CHARS[char] !== undefined) {
      segmentSize += 2;
      count += 2;
    } else {
      segmentSize += 1;
      count += 1;
    }

    if (isGSM && segmentSize > GSM7_MULTI_SEGMENTS) {
      segmentSize -= GSM7_MULTI_SEGMENTS;
      segmentCount++;
    }
    if (!isGSM && segmentSize > UCS2_MULTI_SEGMENTS) {
      segmentSize -= UCS2_MULTI_SEGMENTS;
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
