import fs from 'fs';
import path from 'path';

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export function processRawCSV(rawContent) {
  const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const seenUrls = new Set();
  const seenTitles = new Set();
  const uniqueItems = [];

  // Identify headers
  const headerCols = parseCSVLine(lines[0]).map(h => cleanText(h).toLowerCase());
  const titleIdx = headerCols.indexOf('title');
  const urlIdx = headerCols.indexOf('title_url');
  const imgIdx = headerCols.indexOf('image');
  const priceIdx = headerCols.indexOf('price');

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 4) continue;

    const rawTitle = row[titleIdx] || '';
    const rawUrl = row[urlIdx] || '';
    const rawImg = row[imgIdx] || '';
    const rawPrice = row[priceIdx] || '';

    const title = cleanText(rawTitle);
    const url = cleanText(rawUrl);
    const img = cleanText(rawImg);
    const price = cleanText(rawPrice);

    if (!title || !url) continue;

    const normUrl = url.toLowerCase().replace(/\/$/, '');
    const normTitle = title.toLowerCase();

    if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) {
      continue;
    }

    seenUrls.add(normUrl);
    seenTitles.add(normTitle);

    uniqueItems.push({
      title,
      price,
      url,
      image: img
    });
  }

  return uniqueItems;
}
