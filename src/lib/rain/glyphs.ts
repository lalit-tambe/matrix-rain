// Half-width Katakana: U+FF66 to U+FF9D
// Digits: 0-9
// Some basic latin characters

const KATAKANA_START = 0xFF66;
const KATAKANA_END = 0xFF9D;

const getKatakana = () => String.fromCharCode(KATAKANA_START + Math.floor(Math.random() * (KATAKANA_END - KATAKANA_START + 1)));
const getDigit = () => String.fromCharCode(0x30 + Math.floor(Math.random() * 10)); // 0-9

// A-Z and a-z
const getLatin = () => {
  const isUpper = Math.random() > 0.5;
  const start = isUpper ? 0x41 : 0x61;
  return String.fromCharCode(start + Math.floor(Math.random() * 26));
};

export const getRandomGlyph = () => {
  const rand = Math.random();
  // 70% Latin, 20% Katakana, 10% Digits
  if (rand < 0.70) {
    return getLatin();
  } else if (rand < 0.90) {
    return getKatakana();
  } else {
    return getDigit();
  }
};
