import fs from 'fs';
import path from 'path';

// Define the 5 target categories and their Arabic / English names
export const CATEGORY_DEFINITIONS = {
  KITCHEN: {
    id: 'cat-kitchen',
    name: 'أجهزة المطبخ',
    nameEn: 'Kitchen Appliances',
    slug: 'kitchen-appliances'
  },
  HOME: {
    id: 'cat-home',
    name: 'الأجهزة الكهرومنزلية',
    nameEn: 'Home Appliances',
    slug: 'home-appliances'
  },
  BEAUTY: {
    id: 'cat-beauty',
    name: 'العناية والتجميل',
    nameEn: 'Beauty & Personal Care',
    slug: 'beauty-personal-care'
  },
  ELECTRONICS: {
    id: 'cat-electronics',
    name: 'إلكترونيات وألعاب',
    nameEn: 'Electronics & Gaming',
    slug: 'electronics-gaming'
  },
  GENERAL: {
    id: 'cat-general',
    name: 'عام',
    nameEn: 'General',
    slug: 'general'
  }
};

/**
 * Classifies a product title into one of the designated categories based on keywords.
 * @param {string} title 
 * @returns {string} The Arabic category name
 */
export function classifyProductTitle(title) {
  if (!title || typeof title !== 'string') return CATEGORY_DEFINITIONS.GENERAL.name;

  const t = title.toLowerCase();

  // 1. Electronics & Gaming (Scooters, Consoles, Gaming, Drones, etc.)
  if (
    t.includes('scooter') ||
    t.includes('gokido') ||
    t.includes('trottinette') ||
    t.includes('gaming') ||
    t.includes('jeu') ||
    t.includes('playstation') ||
    t.includes('xbox') ||
    t.includes('console')
  ) {
    return CATEGORY_DEFINITIONS.ELECTRONICS.name;
  }

  // 2. Beauty & Personal Care (Hair styling, Dryers, Epilators, Shavers, IPL, Oral-B, etc.)
  if (
    t.includes('airwrap') ||
    t.includes('lisseur') ||
    t.includes('airstrait') ||
    t.includes('sèche cheveux') ||
    t.includes('seche-cheveux') ||
    t.includes('sèche-cheveux') ||
    t.includes('supersonic') ||
    t.includes('styler') ||
    t.includes('épilateur') ||
    t.includes('epilateur') ||
    t.includes('rasoir') ||
    t.includes('ipl') ||
    t.includes('lumiere pulsee') ||
    t.includes('lumière pulsée') ||
    t.includes('silk·expert') ||
    t.includes('silk-expert') ||
    t.includes('shaver') ||
    t.includes('tondeuse') ||
    t.includes('oral-b') ||
    t.includes('brosse à dents') ||
    t.includes('dentifrice')
  ) {
    return CATEGORY_DEFINITIONS.BEAUTY.name;
  }

  // 3. Kitchen Appliances (Air fryers, Blenders, Mixers, Beaters, Coffee Machines, Cookeo, Cookware)
  if (
    t.includes('air fryer') ||
    t.includes('friteuse') ||
    t.includes('blender') ||
    t.includes('mixeur') ||
    t.includes('batteur') ||
    t.includes('pétrin') ||
    t.includes('petrin') ||
    t.includes('expresso') ||
    t.includes('espresso') ||
    t.includes('café') ||
    t.includes('cafe') ||
    t.includes('cafetiere') ||
    t.includes('cafetière') ||
    t.includes('nespresso') ||
    t.includes('barista') ||
    t.includes('broyeur') ||
    t.includes('moulin') ||
    t.includes('delonghi') ||
    t.includes('de’longhi') ||
    t.includes('smeg') ||
    t.includes('krups') ||
    t.includes('dolce gusto') ||
    t.includes('clessidra') ||
    t.includes('l’or') ||
    t.includes('lor barista') ||
    t.includes('cookeo') ||
    t.includes('hachoir') ||
    t.includes('moulinex') ||
    t.includes('multicuiseur') ||
    t.includes('kitchenaid') ||
    t.includes('bouilloire') ||
    t.includes('grill') ||
    t.includes('grille-pain') ||
    t.includes('toaster') ||
    t.includes('plancha') ||
    t.includes('raclette') ||
    t.includes('gaufrier') ||
    t.includes('presse-agrume') ||
    t.includes('extracteur') ||
    t.includes('centrifugeuse') ||
    t.includes('mousseur') ||
    t.includes('batterie de cuisine') ||
    t.includes('cocotte') ||
    t.includes('casserole') ||
    t.includes('poele') ||
    t.includes('poêle')
  ) {
    return CATEGORY_DEFINITIONS.KITCHEN.name;
  }

  // 4. Home Appliances (Vacuums, Robot Cleaners, Steam Cleaners, Pool Cleaners, Irons)
  if (
    t.includes('aspirateur') ||
    t.includes('robot') ||
    t.includes('laveur') ||
    t.includes('piscine') ||
    t.includes('pool') ||
    t.includes('skimmer') ||
    t.includes('scuba') ||
    t.includes('seagull') ||
    t.includes('bissell') ||
    t.includes('crosswave') ||
    t.includes('spotclean') ||
    t.includes('nettoyeur') ||
    t.includes('vapeur') ||
    t.includes('steam') ||
    t.includes('défroisseur') ||
    t.includes('defroisseur') ||
    t.includes('fer à repasser') ||
    t.includes('centrale vapeur') ||
    t.includes('rowenta') ||
    t.includes('karcher') ||
    t.includes('kärcher') ||
    t.includes('tineco') ||
    t.includes('dreame') ||
    t.includes('roborock') ||
    t.includes('ecovacs') ||
    t.includes('roomba') ||
    t.includes('irobot') ||
    t.includes('shampouineuse') ||
    t.includes('lave-vaisselle') ||
    t.includes('radiateur') ||
    t.includes('climatiseur')
  ) {
    return CATEGORY_DEFINITIONS.HOME.name;
  }

  // 5. Default Fallback
  return CATEGORY_DEFINITIONS.GENERAL.name;
}

// Read fassilProducts.json and classify
const jsonPath = path.resolve('src/data/fassilProducts.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const products = JSON.parse(rawData);

const categoryStats = {};

const categorizedProducts = products.map((item) => {
  const category = classifyProductTitle(item.title);
  categoryStats[category] = (categoryStats[category] || 0) + 1;
  return {
    ...item,
    category
  };
});

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(categorizedProducts, null, 2), 'utf8');

// Also update cleaned_fassil.csv to include category
let csvOutput = '\uFEFF"Title","Price","Category","Title_URL","Image"\r\n';
for (const p of categorizedProducts) {
  csvOutput += `"${p.title.replace(/"/g, '""')}","${p.price.replace(/"/g, '""')}","${p.category.replace(/"/g, '""')}","${p.url.replace(/"/g, '""')}","${p.image.replace(/"/g, '""')}"\r\n`;
}
fs.writeFileSync('public/cleaned_fassil.csv', csvOutput, 'utf8');

console.log('Category breakdown:', categoryStats);
console.log(`Successfully classified ${categorizedProducts.length} products and updated fassilProducts.json & cleaned_fassil.csv`);
