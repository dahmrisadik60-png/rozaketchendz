import fs from 'fs';

// Let's create a script to process and clean fassil catalog CSV
export function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[«»]/g, '"')
    .trim();
}

export function parsePrice(priceStr) {
  if (!priceStr) return { numeric: 0, text: '0 د.ج' };
  const clean = cleanText(priceStr).replace(/\u00a0/g, ' ');
  const numMatch = clean.replace(/[^0-9]/g, '');
  const numeric = numMatch ? parseInt(numMatch, 10) : 0;
  return { numeric, text: `${numeric.toLocaleString('ar-DZ')} د.ج` };
}
