/**
 * Automatic Category Classifier for Products based on Title Keywords
 */

export interface CategoryInfo {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
}

export const MAIN_CATEGORIES: Record<string, CategoryInfo> = {
  KITCHEN: {
    id: 'cat-kitchen',
    name: 'أجهزة المطبخ',
    nameEn: 'Kitchen Appliances',
    slug: 'kitchen-appliances',
    icon: 'UtensilsCrossed'
  },
  HOME: {
    id: 'cat-home',
    name: 'الأجهزة الكهرومنزلية',
    nameEn: 'Home Appliances',
    slug: 'home-appliances',
    icon: 'Home'
  },
  BEAUTY: {
    id: 'cat-beauty',
    name: 'العناية والتجميل',
    nameEn: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    icon: 'Sparkles'
  },
  ELECTRONICS: {
    id: 'cat-electronics',
    name: 'إلكترونيات وألعاب',
    nameEn: 'Electronics & Gaming',
    slug: 'electronics-gaming',
    icon: 'Gamepad2'
  },
  GENERAL: {
    id: 'cat-general',
    name: 'عام',
    nameEn: 'General',
    slug: 'general',
    icon: 'Package'
  }
};

/**
 * Categorizes any product title into one of the 5 required categories.
 */
export function categorizeProductTitle(title: string): CategoryInfo {
  if (!title || typeof title !== 'string') return MAIN_CATEGORIES.GENERAL;

  const t = title.toLowerCase();

  // 1. Electronics & Gaming
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
    return MAIN_CATEGORIES.ELECTRONICS;
  }

  // 2. Beauty & Personal Care
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
    return MAIN_CATEGORIES.BEAUTY;
  }

  // 3. Kitchen Appliances
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
    return MAIN_CATEGORIES.KITCHEN;
  }

  // 4. Home Appliances
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
    return MAIN_CATEGORIES.HOME;
  }

  return MAIN_CATEGORIES.GENERAL;
}
