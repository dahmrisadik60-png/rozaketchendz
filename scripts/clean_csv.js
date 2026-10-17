import fs from 'fs';
import path from 'path';

// Complete CSV list of coffee machines requested by user
const sampleData = `"Product Name","Current Price","Old Price","Main Image URL"
"BOSCH – Expresso encastrable , Série 8, tout automatique, CTL7181B0","540000 د.ج","560000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-26.webp?w=2318&ssl=1"
"SIEMENS Expresso Encastrable IQ700- CT636LES6","420000 د.ج","450000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-27.webp?w=2318&ssl=1"
"Siemens Machine à Café Série EQ.8 900","399000 د.ج","405000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-20.webp?w=2318&ssl=1"
"Sage Machine expresso the Barista Pro SES878BST","299000 د.ج","310000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/10/FASSIL-SHOP-22.webp?w=2318&ssl=1"
"SMEG Machine à café Expresso Crème Cold Brew – Infusion à froid Esthétique Années 50 ECF03CREU","155000 د.ج","199000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/09/FASSIL-SHOP-11-1.webp?w=2318&ssl=1"
"SMEG Machine à café Expresso Crème PLUS MOUSSEUR A LAIT Esthétique Années 50 ECF12CREU","139900 د.ج","145000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-35.webp?w=2318&ssl=1"
"KRUPS Classic Edition Machine à Café Automatique avec Broyeur et Cappuccino One-Touch – EA89Z","128000 د.ج","149000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/10/FFF.webp?w=2318&ssl=1"
"Nespresso Lattissima One Machine à café De’Longhi pour dosettes de café originales, latte, cappuccino, mousseur à lait intégré, EN510.GR, vert sauge","68000 د.ج","79000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/09/FASSIL-SHOP-Recovered-07-1.webp?w=2318&ssl=1"
"DeLonghi Dedica Style Machine à Expresso Compacte EC 685.BK + Moulins a café  90g de grains KG200","59000 د.ج","67000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-19.webp?w=2318&ssl=1"
"L’OR BARISTA Sublime par la maison Alessi","34000 د.ج","39000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/10/FASSIL-SHOP-01-11.webp?w=2318&ssl=1"
"DeLonghi Clessidra – Cafetière filtre 10 Tasses Gris | Infusion 2-en-1 par Versement et Filtre","23500 د.ج","26000 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/10/FASSIL-SHOP-01-16.webp?w=2318&ssl=1"
"Krups Nescafé Dolce Gusto Mini Me Machine à café expresso","22500 د.ج","25500 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-02-14.webp?w=2318&ssl=1"
"Kenwood Machine à café jusqu’à 12 tasses cafetière pour café goutte à goutte CMM10.000BM","14900 د.ج","15600 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-05-4.webp?w=2319&ssl=1"
"DeLonghi Machine à café à filtre ICM 2.1B","11800 د.ج","12800 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/10/FASSIL-SHOP-8.webp?w=2318&ssl=1"
"PHILIPS Cafetière Daily Mini Filtration 0,6 L HD7432/20","11800 د.ج","12800 د.ج","https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/DDD.webp?w=2318&ssl=1"`;

// Robust CSV parser handling quotes and line breaks
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentStr = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentStr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentStr.trim());
      currentStr = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentStr.trim());
      currentStr = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      currentStr += char;
    }
  }
  if (currentStr.length > 0 || row.length > 0) {
    row.push(currentStr.trim());
    lines.push(row);
  }
  return lines;
}

function processAndDeduplicateCSV(csvText) {
  const parsed = parseCSV(csvText);
  if (!parsed || parsed.length === 0) return [];

  const headers = parsed[0].map(h => h.trim().toLowerCase());
  
  let titleIdx = headers.indexOf('product name');
  if (titleIdx === -1) titleIdx = headers.indexOf('data');
  if (titleIdx === -1) titleIdx = headers.findIndex(h => h.includes('item-title') || h.includes('title') || h.includes('name'));

  let currentPriceIdx = headers.indexOf('current price');
  if (currentPriceIdx === -1) currentPriceIdx = headers.indexOf('data2');
  if (currentPriceIdx === -1) currentPriceIdx = headers.findIndex(h => h.includes('woocommerce-price-amount 2') || h.includes('new_price') || h.includes('sale_price') || h.includes('price 2'));
  if (currentPriceIdx === -1) currentPriceIdx = headers.findIndex(h => h.includes('price') && !h.includes('regular') && !h.includes('old'));

  let oldPriceIdx = headers.indexOf('old price');
  if (oldPriceIdx === -1) oldPriceIdx = headers.indexOf('data3');
  if (oldPriceIdx === -1) oldPriceIdx = headers.findIndex(h => h.includes('woocommerce-price-amount') && !h.includes('2'));
  if (oldPriceIdx === -1) oldPriceIdx = headers.findIndex(h => h.includes('old') || h.includes('regular'));

  let imageIdx = headers.indexOf('main image url');
  if (imageIdx === -1) imageIdx = headers.indexOf('image');
  if (imageIdx === -1) imageIdx = headers.findIndex(h => h.includes('thumbnail') || h.includes('img') || h.includes('src'));

  const seen = new Map();
  let duplicatesRemoved = 0;

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (!row || row.length === 0) continue;

    const title = (row[titleIdx] || '').trim();
    if (!title) continue;

    const normalizedKey = title.toLowerCase().replace(/\s+/g, ' ');

    if (seen.has(normalizedKey)) {
      duplicatesRemoved++;
      continue;
    }

    const currentPrice = (row[currentPriceIdx] || '').trim();
    const oldPrice = (row[oldPriceIdx] || '').trim();
    const image = (row[imageIdx] || '').trim();

    seen.set(normalizedKey, {
      title,
      currentPrice,
      oldPrice,
      image
    });
  }

  const uniqueProducts = Array.from(seen.values());
  console.log(`Processed ${parsed.length - 1} rows. Found ${uniqueProducts.length} unique products. Removed ${duplicatesRemoved} duplicates.`);
  return uniqueProducts;
}

const cleanedProducts = processAndDeduplicateCSV(sampleData);

// Generate clean CSV with UTF-8 BOM (\uFEFF)
let csvOutput = '\uFEFF"Product Name","Current Price","Old Price","Main Image URL"\r\n';
for (const p of cleanedProducts) {
  csvOutput += `"${p.title.replace(/"/g, '""')}","${p.currentPrice.replace(/"/g, '""')}","${p.oldPrice.replace(/"/g, '""')}","${p.image.replace(/"/g, '""')}"\r\n`;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/cleaned_products.csv', csvOutput, 'utf8');
fs.writeFileSync('cleaned_products.json', JSON.stringify(cleanedProducts, null, 2), 'utf8');

console.log('Successfully wrote public/cleaned_products.csv and cleaned_products.json with all 15 coffee machine products');
