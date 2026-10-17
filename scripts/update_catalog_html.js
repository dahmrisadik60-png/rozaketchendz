import fs from 'fs';

const products = JSON.parse(fs.readFileSync('src/data/fassilProducts.json', 'utf8'));

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>كتالوج منتجات fassil.shop مصنفة حسب الأقسام - Roza DZ</title>
  <style>
    :root {
      --primary: #d94f86;
      --primary-hover: #c93d78;
      --primary-light: #fdeaf1;
      --text-main: #4a2b3d;
      --text-muted: #8a6b7a;
      --gold: #c9a45c;
      --border: #f7dfe8;
      --bg: #fffbf9;
      --white: #ffffff;
      --radius: 16px;
      --shadow: 0 4px 15px rgba(217, 79, 134, 0.08);
      --shadow-hover: 0 10px 30px rgba(217, 79, 134, 0.18);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text-main); padding: 30px 15px; line-height: 1.5; }
    .container { max-width: 1240px; margin: 0 auto; }
    .catalog-header { text-align: center; margin-bottom: 25px; }
    .catalog-header .badge { display: inline-block; padding: 4px 14px; background: var(--primary-light); color: var(--primary); border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 10px; }
    .catalog-header h1 { font-size: 26px; font-weight: 900; color: var(--text-main); margin-bottom: 8px; }
    .catalog-header p { font-size: 14px; color: var(--text-muted); max-width: 650px; margin: 0 auto; }
    .controls-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 25px; background: var(--white); padding: 14px 20px; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); }
    .filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { background: var(--primary-light); color: var(--text-main); border: none; padding: 7px 15px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
    .filter-btn:hover, .filter-btn.active { background: var(--primary); color: var(--white); }
    .view-toggles { display: flex; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .view-btn { background: transparent; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .view-btn.active { background: var(--white); color: var(--primary); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    .search-input { padding: 8px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13px; outline: none; min-width: 220px; }
    .download-csv-btn { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .product-card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: transform 0.3s ease; }
    .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
    .card-badge { position: absolute; top: 12px; right: 12px; background: var(--primary); color: var(--white); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; z-index: 2; }
    .card-image-wrap { width: 100%; height: 210px; background: #fdf6f9; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .card-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .card-content { padding: 16px; display: flex; flex-direction: column; justify-content: space-between; flex: 1; gap: 10px; }
    .card-cat { font-size: 11px; font-weight: 800; color: var(--gold); }
    .card-title { font-size: 13px; font-weight: 700; color: var(--text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 36px; }
    .card-footer { border-top: 1px solid var(--border); padding-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .new-price { font-size: 15px; font-weight: 900; color: var(--primary); }
    .buy-btn { background: var(--primary); color: var(--white); border: none; padding: 7px 13px; border-radius: 10px; font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .table-container { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); overflow-x: auto; margin-bottom: 20px; }
    .clean-table { width: 100%; border-collapse: collapse; text-align: right; font-size: 13px; }
    .clean-table th { background: #faf5f8; color: var(--text-main); padding: 13px 15px; font-weight: 800; border-bottom: 2px solid var(--border); white-space: nowrap; }
    .clean-table td { padding: 12px 15px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .clean-table tr:hover { background: #fff8fb; }
    .table-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); }
    .cat-pill { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #fdeaf1; color: var(--primary); }
    @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .controls-bar { flex-direction: column; align-items: stretch; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="catalog-header">
      <span class="badge">كتالوج fassil.shop مصنف تلقائياً (55 منتج فريد)</span>
      <h1>توزيع منتجات المتجر حسب الأقسام</h1>
      <p>تم تصنيف وتوزيع المنتجات على الأقسام الأربعة (أجهزة المطبخ، الأجهزة الكهرومنزلية، العناية والتجميل، إلكترونيات وألعاب).</p>
    </div>

    <div class="controls-bar">
      <div class="filter-buttons">
        <button class="filter-btn active" onclick="filterCat('all')">الكل (<span id="count-all">55</span>)</button>
        <button class="filter-btn" onclick="filterCat('أجهزة المطبخ')">أجهزة المطبخ (25)</button>
        <button class="filter-btn" onclick="filterCat('الأجهزة الكهرومنزلية')">الأجهزة الكهرومنزلية (24)</button>
        <button class="filter-btn" onclick="filterCat('العناية والتجميل')">العناية والتجميل (5)</button>
        <button class="filter-btn" onclick="filterCat('إلكترونيات وألعاب')">إلكترونيات وألعاب (1)</button>
      </div>

      <div class="view-toggles">
        <button id="gridToggle" class="view-btn active" onclick="switchView('grid')">
          <span>🎴 شبكة البطاقات</span>
        </button>
        <button id="tableToggle" class="view-btn" onclick="switchView('table')">
          <span>📋 جدول البيانات المبوب</span>
        </button>
      </div>

      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <a href="/cleaned_fassil.csv" download="cleaned_fassil.csv" class="download-csv-btn">
          <span>📥 تحميل CSV المصنف (UTF-8)</span>
        </a>
        <input type="text" id="searchInput" class="search-input" placeholder="بحث عن منتج..." oninput="handleSearch()" />
      </div>
    </div>

    <div id="productsGrid" class="products-grid"></div>

    <div id="productsTableContainer" class="table-container" style="display: none;">
      <table class="clean-table">
        <thead>
          <tr>
            <th style="width: 45px;">#</th>
            <th style="width: 70px;">الصورة</th>
            <th>اسم المنتج (Title)</th>
            <th style="width: 150px;">القسم (Category)</th>
            <th style="width: 130px;">السعر (Price)</th>
            <th style="width: 110px;">رابط المنتج (Title_URL)</th>
          </tr>
        </thead>
        <tbody id="productsTableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const products = ${JSON.stringify(products)};
    let currentFilter = 'all';
    let currentView = 'grid';
    let searchQuery = '';

    function switchView(view) {
      currentView = view;
      document.getElementById('gridToggle').classList.toggle('active', view === 'grid');
      document.getElementById('tableToggle').classList.toggle('active', view === 'table');
      document.getElementById('productsGrid').style.display = view === 'grid' ? 'grid' : 'none';
      document.getElementById('productsTableContainer').style.display = view === 'table' ? 'block' : 'none';
      renderView();
    }

    function getFilteredProducts() {
      return products.filter(p => {
        const matchesCat = currentFilter === 'all' || p.category === currentFilter;
        const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
      });
    }

    function renderView() {
      const filtered = getFilteredProducts();
      document.getElementById('count-all').innerText = products.length;

      if (currentView === 'grid') {
        const grid = document.getElementById('productsGrid');
        if (filtered.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8a6b7a;">لا توجد منتجات مطابقة</div>';
          return;
        }

        grid.innerHTML = filtered.map(item => \`
          <div class="product-card">
            <div class="card-badge">\${item.category}</div>
            <div class="card-image-wrap">
              <img src="\${item.image}" alt="\${item.title}" loading="lazy" />
            </div>
            <div class="card-content">
              <div>
                <div class="card-cat">\${item.category}</div>
                <h3 class="card-title" title="\${item.title}">\${item.title}</h3>
              </div>
              <div class="card-footer">
                <span class="new-price">\${item.price}</span>
                <a href="\${item.url}" target="_blank" class="buy-btn">عرض</a>
              </div>
            </div>
          </div>
        \`).join('');
      } else {
        const tbody = document.getElementById('productsTableBody');
        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #8a6b7a;">لا توجد منتجات</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map((item, idx) => \`
          <tr>
            <td style="color: #8a6b7a; font-weight: bold;">\${idx + 1}</td>
            <td><img src="\${item.image}" alt="\${item.title}" class="table-thumb" loading="lazy" /></td>
            <td><strong>\${item.title}</strong></td>
            <td><span class="cat-pill">\${item.category}</span></td>
            <td style="font-weight: 900; color: #d94f86;">\${item.price}</td>
            <td><a href="\${item.url}" target="_blank" class="buy-btn" style="padding: 4px 10px; font-size: 11px;">زيارة الرابط</a></td>
          </tr>
        \`).join('');
      }
    }

    function filterCat(cat) {
      currentFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      renderView();
    }

    function handleSearch() {
      searchQuery = document.getElementById('searchInput').value.trim();
      renderView();
    }

    renderView();
  </script>
</body>
</html>`;

fs.writeFileSync('public/products-catalog.html', html, 'utf8');
console.log('Successfully updated public/products-catalog.html with the categorized 55 products');
