#!/usr/bin/env python3
"""
Builds src/data/fassilProducts.json from a raw fassil.shop CSV export
(columns: Title, Title_URL, Image, onsale, Type, Price) and assigns every
product to one of the store categories (Arabic names, see CATEGORIES below).

Usage:
    python3 scripts/build_fassil_catalog.py path/to/fassil.shop.csv

Keep the category names in sync with src/utils/productClassifier.ts and
src/data/categories.ts.
"""
import csv
import json
import re
import sys
from collections import Counter

CATEGORIES = {
    'coffee': 'ماكينات القهوة والاسبريسو',
    'vacuum': 'المكانس والروبوتات الذكية',
    'steam': 'التنظيف بالبخار وغسل السجاد',
    'pool': 'روبوتات ومعدات المسابح',
    'airfryer': 'المقالي الهوائية والطباخات المتعددة',
    'blender': 'الخلاطات والمفرومات والعصارات',
    'robot': 'روبوتات الطبخ والعجانات',
    'grill': 'الشوايات والبلانشا والطبخ الكهربائي',
    'breakfast': 'الغلايات والمحمصات وأجهزة الفطور',
    'cookware': 'أواني الطبخ والطناجر والسكاكين',
    'ice': 'المثلجات والمشروبات الباردة',
    'large': 'الأفران والأجهزة الكبيرة والتدفئة',
    'hair': 'العناية بالشعر والتصفيف',
    'grooming': 'الحلاقة والإزالة والعناية الشخصية',
    'iron': 'الكي والخياطة',
    'electronics': 'إلكترونيات ورياضة وأطفال',
    'parts': 'قطع غيار وإكسسوارات',
    'general': 'عام',
}


def norm(s):
    s = s.replace('\xa0', ' ').replace('​', '').replace('‎', '')
    return re.sub(r'\s+', ' ', s).strip()


def has(t, *words):
    return any(w in t for w in words)


def classify(title):
    t = title.lower()

    # ---- 1. spare parts / consumables / accessories (checked first) ----
    if (
        re.search(r'\(pièce\)|\bpièce\)', t)
        or re.match(r'^(seb )?(joint|poignée|soupape|seb accessoires|seb poignée)', t)
        or has(t, 'poignée de cuve', 'joint coocotte', 'joint pour',
               'boitier de commande', 'cartouche filtrante', 'cartridge filter',
               'fleece filter', 'détartrant', 'detartrant', 'kit brosse', 'rouleau brosse',
               'rouleau de brosse', 'filtre rechange', 'set de chiffons',
               'produit nettoyant', 'detergent lotion', 'détergent', 'lotion pour',
               'wash & protect', 'lot de 4 bacs', 'lot de 4 pots', 'creami pots',
               'kit de 3 accessoires', 'accessoire robot', 'accessoire spaghetti',
               'accessoire pour robot', 'accessoires – hachoir', 'bol mélangeur')
        or t.startswith('valberg detergent')
        or t.startswith('tefal ingenio poignée')
        or (t.startswith('kitchenaid accessoires'))
        or t.startswith('kenwood rouleau xl')
    ):
        return 'parts'

    # ---- 2. pool ----
    if has(t, 'piscine', 'pool skimmer', 'aiper', 'zodiac robot', 'pooleco', 'bocxi'):
        return 'pool'

    # ---- 3. coffee ----
    if has(t, 'machine à café', 'machine a cafe', 'machine á café', 'machine café', 'cafetera',
           'cafetière', 'cafetiere', 'cafetière', 'expresso', 'espresso', 'nespresso',
           "l'or barista", 'l’or barista', "l'or ", 'l’or machine', 'lor barista',
           'dolce gusto', 'a modo mio', 'moulin à café', 'moulin a cafe', 'moulin à grain',
           'mousseur à lait', 'mousseur a lait', 'mousseurs à lait', 'milk twister',
           'aeroccino', 'milk frother', 'clessidra', 'lattissima', 'dedica style',
           'magnifica', 'barista pro', 'the oracle', 'creatista', 'rivelia',
           'primadonna', 'eletta', 'dinamica plus', 'specialista', 'maestosa',
           'ecceluxe', 'graef estessa', 'machine à café'):
        # skip kitchen items that only mention espresso incidentally
        return 'coffee'

    # ---- 4. hair care ----
    if has(t, 'airwrap', 'airstrait', 'sèche cheveux', 'sèche-cheveux', 'seche-cheveux',
           'supersonic', 'lisseur', 'one-step', 'brosse soufflante', 'flexstyle',
           'steampod', 'set de coiffage', 'multi-styler', 'multi styler'):
        return 'hair'

    # ---- 5. grooming / personal care / baby / fragrance ----
    if re.search(r'\bipl\b', t) or has(t, 'épilateur', 'epilateur', 'lumière pulsée', 'lumiere pulsee',
           'silk·expert', 'silk-expert', 'silk expert', 'skin i-expert', 'rasoir électrique',
           'rasoir electrique', 'oneblade', 'body groomer', 'tondeuse', 'oral-b',
           'dentifrice', 'perfume', 'feminine in a bottle', 'series 7 rasoir', 'one blade'):
        if 'rasoir anti' in t:
            return 'iron'
        return 'grooming'
    if t.startswith('sense georgina') or 'marvis' in t:
        return 'grooming'

    # ---- 6. electronics / sports / kids ----
    if has(t, 'scooter', 'trottinette', 'vélo', 'velo ', 'vidéoprojecteur', 'videoprojecteur',
           'siège auto', 'chauffe biberon', 'neopix'):
        return 'electronics'

    # ---- 7. ironing / garment steamers / sewing ----
    if has(t, 'machine à coudre', 'machine a coudre', 'fer à repasser', 'fer a repasser',
           'défroisseur', 'defroisseur', 'défroisser', 'centrale vapeur', 'steam iron',
           'solution de repassage', 'rasoir anti bouloche', 'iron travel'):
        return 'iron'

    # ---- 8. ice cream / frozen drinks / ice machines / water filter ----
    if has(t, 'creami', 'slushi', 'machine à glaçons', 'machine à glace', 'machine à crème glacée',
           'machine à glaces', 'ice cream', 'hydrasense', 'machine à boissons glacées',
           'glaçons', 'freezi', 'dolci'):
        return 'ice'

    if 'crosswave' in t:
        return 'vacuum'

    # ---- 9. steam / carpet / stain / pressure washers ----
    if has(t, 'nettoyeur vapeur', 'nettoyeur à vapeur', 'vapori jet', 'xsteam',
           'nettoyeur haute pression', 'steam nettoyeur', 'spotclean', 'shampouineuse',
           'détacheur', 'detacheur', 'stainforce', 'stainstriker', 'nettoyeur de tapis',
           'proheat', 'powerfresh', 'hydrosteam', 'nettoyeur de taches', 'clean it',
           'injecteur/extracteur', 'se 3-18', 'icute', 'nettoyeur à vapeur',
           'aspirateur nettoyeur vapeur', 'steam pro', 's7 steam', 'stretch steam'):
        return 'steam'

    # ---- 10. vacuums / robots / window cleaners ----
    if has(t, 'aspirateur', 'robot vacuum', 'vacuum', 'roborock', 'ecovacs', 'roomba',
           'dreame', 'mova ', 'tineco', 'shark ai', 'balai serpillière', 'nettoyeur de vitres',
           'laveur de sol', 'dyson car', 'winbot', 'deebot', 'robot laveur de vitres',
           'karcher fcv', 'karcher ewm', 'rowenta x-force', 'rowenta x-clean', 'x-force flex', 'aspirateur-laveur') and not has(
               t, 'blender', 'friteuse', 'tasti', 'grille-pain'):
        return 'vacuum'

    if 'ez506820' in t:
        return 'airfryer'

    # ---- 11. air fryers / multicookers ----
    if has(t, 'air fryer', 'airfryer', 'friteuse', 'cookeo', 'multicuiseur', 'autocuiseur électrique',
           'ninja combi', 'ninja speedi', 'hyperheat', 'foodi grill', 'foodi flexdrawer',
           'foodi max dual', 'dual zone', 'double stack', 'crispi', 'cuiseur riz',
           'appareil électroménager 2 en 1', 'dual easy fry', 'easy fry', 'twinfry',
           'turbo tower', 'oleoclean', 'ez506820') and 'woodfire' not in t:
        return 'airfryer'

    # ---- 12. kettles / toasters / waffles / breakfast ----
    if has(t, 'bouilloire', 'grille-pain', 'grille pain', 'grill pain', 'toaster', 'gaufrier',
           'crêpière', 'crepiere', 'yaourtière', 'yaourtiere', 'break time'):
        return 'breakfast'

    # ---- 13. robots patissiers / food processors / dough / pasta / bread ----
    if has(t, 'robot pâtissier', 'robots pâtissiers', 'robot patissier', 'robot cuiseur',
           'robot culinaire', 'robot multifonction', 'robot de cuisine', 'robot cuisine',
           'robot multi-fonctions', 'processeur alimentaire', 'cooking chef', 'thermomix',
           'pétrin', 'petrin', 'machine à pâtes', 'machine à pain', 'machine à petits pains',
           'kmix', 'chef xl', 'chef baker', 'heavy duty robot', 'multipro', 'robot techwood',
           'robot pétrin', 'robot moulinex', 'robot ninja', 'i-companion', 'robot 3en 1',
           'ninja 3en 1', 'robot multifonction double force',
           'découpe-légumes') and not has(t, 'pâtissier accessoire'):
        return 'robot'

    # ---- 14. blenders / mixers / choppers / juicers / grinders ----
    if has(t, 'blender', 'mixeur', 'batteur', 'hachoir', 'moulinette', 'multimoulinette',
           'extracteur de jus', 'centrifugeuse', 'presse-agrume', 'presse agrume',
           'espremedor', 'juicer', 'juice', 'pied mixeur', 'bras mixeur', 'nutribullet',
           'broyeur', 'easy milker', 'moulin', 'smeg multifonction'):
        return 'blender'

    if has(t, 'micro onde', 'micro-onde', 'micro-ondes'):
        return 'large'

    if has(t, 'batterie de cuisine', 'cocotte', 'autocuiseur', 'casserole'):
        return 'cookware'

    # ---- 15. grills / plancha / raclette / barbecue / induction ----
    if has(t, 'plancha', 'raclette', 'grill', 'barbecue', 'induction', 'optigrill',
           'supergrill', 'calentador de buffet', 'woodfire', 'gril ', 'gril électrique'):
        return 'grill'

    # ---- 16. large appliances / ovens / heaters ----
    if has(t, 'micro onde', 'micro-onde', 'micro-ondes', 'mini four', 'four multifonction',
           'lave vaisselle', 'lave-vaisselle', 'table de cuisson', 'tables de cuisson',
           'plaque gaz', 'plaque de cuisson', 'radiateur', 'réchauffeur', 'chauffage'):
        return 'large'

    # ---- 17. cookware / utensils / knives ----
    if has(t, 'batterie de cuisine', 'cocotte', 'casserole', 'poêle', 'poele', 'faitout',
           'wok', 'couteau', 'couteaux', 'spatule', 'balance', 'thermos', 'cookware',
           'autocuiseur', 'cuiseur vapeur', 'nutricook', 'clipso', 'ustensiles'):
        return 'cookware'

    return 'general'


def main():
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else 'src/data/fassilProducts.json'
    rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))

    seen = set()
    products = []
    for r in rows:
        title = norm(r['Title'])
        url = norm(r['Title_URL'])
        if not title or url in seen:
            continue
        seen.add(url)
        price = norm(r['Price'])
        products.append({
            'title': title,
            'price': price,
            'url': url,
            'image': norm(r['Image']),
            'category': CATEGORIES[classify(title)],
        })

    json.dump(products, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    stats = Counter(p['category'] for p in products)
    print(f'{len(products)} products written to {out}')
    for name, n in stats.most_common():
        print(f'  {n:4d}  {name}')


if __name__ == '__main__':
    main()
