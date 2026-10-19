#!/usr/bin/env python3
"""
Generate fassil_products_album.json from cleaned_fassil.csv
Supports multiple images per product (Album) with fallback to single image.
Works seamlessly with both standard library (csv, json) and pandas (if installed).
"""
import os
import re
import json

def get_csv_path():
    candidates = ['cleaned_fassil.csv', 'public/cleaned_fassil.csv', '../public/cleaned_fassil.csv']
    for p in candidates:
        if os.path.isfile(p):
            return p
    return 'cleaned_fassil.csv'

def parse_images_from_val(val):
    if not val:
        return []
    s = str(val).strip()
    if not s or s.lower() == 'nan' or s.lower() == 'none':
        return []
    # Check if JSON array like ["url1", "url2"] or ['url1', 'url2']
    if (s.startswith('[') and s.endswith(']')) or (s.startswith('(') and s.endswith(')')):
        try:
            parsed = json.loads(s.replace("'", '"'))
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
        # Fallback split
        clean_inner = s.strip('[]()')
        return [x.strip().strip('\'"') for x in clean_inner.split(',') if x.strip().strip('\'"')]
    
    # Check if multiple URLs separated by comma or semicolon or newline
    if ',' in s or ';' in s or '\n' in s:
        parts = re.split(r'[,;\n]+', s)
        return [p.strip() for p in parts if p.strip().startswith('http')]
    
    return [s]

def main():
    csv_file = get_csv_path()
    products = []
    
    # Try with pandas if installed, otherwise standard library csv
    try:
        import pandas as pd
        df = pd.read_csv(csv_file)
        
        for _, row in df.iterrows():
            images_list = []
            
            # Check all columns with 'image' in their name
            for col in df.columns:
                if 'image' in col.lower() and pd.notna(row[col]):
                    for img in parse_images_from_val(row[col]):
                        if img and img not in images_list:
                            images_list.append(img)
            
            # Also check if there's a dedicated 'Images' column
            if 'Images' in df.columns and pd.notna(row.get('Images')):
                for img in parse_images_from_val(row.get('Images')):
                    if img and img not in images_list:
                        images_list.append(img)
            
            product = {
                "title": str(row.get('Title', '') or '').strip(),
                "price": str(row.get('Price', '') or '').strip(),
                "category": str(row.get('Category', '') or '').strip(),
                "url": str(row.get('Title_URL', '') or '').strip(),
                "images": images_list,
                "image": images_list[0] if images_list else ""
            }
            products.append(product)
            
    except ImportError:
        # Fallback to standard library csv
        import csv
        with open(csv_file, mode='r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                images_list = []
                for k, v in row.items():
                    if k and 'image' in k.lower() and v:
                        for img in parse_images_from_val(v):
                            if img and img not in images_list:
                                images_list.append(img)
                
                product = {
                    "title": (row.get('Title') or '').strip(),
                    "price": (row.get('Price') or '').strip(),
                    "category": (row.get('Category') or '').strip(),
                    "url": (row.get('Title_URL') or '').strip(),
                    "images": images_list,
                    "image": images_list[0] if images_list else ""
                }
                products.append(product)

    # Save to fassil_products_album.json in root, public, and src/data
    out_files = [
        'fassil_products_album.json',
        'public/fassil_products_album.json',
        'src/data/fassil_products_album.json'
    ]
    
    for out_path in out_files:
        os.makedirs(os.path.dirname(out_path) if os.path.dirname(out_path) else '.', exist_ok=True)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"تم تجميع {len(products)} منتج بنظام الألبوم (عدة صور لكل منتج) بنجاح!")

if __name__ == '__main__':
    main()
