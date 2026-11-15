const fs = require('fs');
const path = require('path');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function classifyAcSubcategory(title, specsText = '') {
  const combined = (title + ' ' + specsText).toLowerCase();
  if (combined.includes('cassette')) return 'cassette-ac';
  if (combined.includes('ceiling')) return 'ceiling-ac';
  if (combined.includes('portable') || combined.includes('floor stand') || combined.includes('floor type')) return 'portable-ac';
  if (combined.includes('2.5 ton') || combined.includes('2.5ton')) return '2-5-ton-ac';
  if (combined.includes('2 ton') || combined.includes('2.0 ton') || combined.includes('24000') || combined.includes('24k') || combined.includes('hsu-24') || combined.includes('gs-24') || combined.includes('2.0ton')) return '2-ton-ac';
  if (combined.includes('1.5 ton') || combined.includes('18000') || combined.includes('18k') || combined.includes('hsu-18') || combined.includes('hsu-19') || combined.includes('gs-18') || combined.includes('1.5ton')) return '1-5-ton-ac';
  if (combined.includes('1 ton') || combined.includes('1.0 ton') || combined.includes('1.1 ton') || combined.includes('12000') || combined.includes('12k') || combined.includes('hsu-12') || combined.includes('hsu-13') || combined.includes('gs-12') || combined.includes('1.0ton')) return '1-ton-ac';
  return '1-5-ton-ac';
}

function cleanHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .trim();
}

function run() {
  console.log('--- Merging all AC products into catalog ---');

  const electromartRaw = JSON.parse(fs.readFileSync('electromart_acs_raw.json', 'utf8'));
  const haierRaw = JSON.parse(fs.readFileSync('haier_acs_raw.json', 'utf8'));
  const ebRaw = JSON.parse(fs.readFileSync('eb_acs_unique.json', 'utf8'));

  const newProducts = [];
  const seenSlugs = new Set();

  // 1. Convert Electromart Products (70 items)
  for (let i = 0; i < electromartRaw.length; i++) {
    const p = electromartRaw[i];
    const mrp = Math.round(Number(p.mrp || p.selling_price || 65000));
    const price = Math.round(mrp * 0.9); // 10% discount from MRP
    const originalPrice = mrp;
    const discount = 10;

    let baseSlug = slugify(p.slug || p.name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (seenSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    seenSlugs.add(finalSlug);

    const title = p.name;
    const brand = p.brand?.name || 'Gree';
    const model = p.sku || `EM-${p.id}`;

    // Images
    const imgs = [];
    if (p.thumbnail_img_url) imgs.push(p.thumbnail_img_url);
    if (Array.isArray(p.product_images)) {
      for (const img of p.product_images) {
        if (img.img_url && !imgs.includes(img.img_url)) {
          imgs.push(img.img_url);
        }
      }
    }
    if (imgs.length === 0) {
      imgs.push('https://d2ttkd7jwwn4uz.cloudfront.net/public/media/602/GS-12XSMA4VBA.png');
    }

    // Specifications
    const specGroups = [];
    if (Array.isArray(p.specifications) && p.specifications.length > 0) {
      const items = p.specifications.map(s => ({
        key: s.filter?.name || 'Specification',
        value: s.specification_text || s.filter_option?.name || 'Standard'
      }));
      specGroups.push({ group: 'Technical Specifications', items });
    } else {
      specGroups.push({
        group: 'Specifications',
        items: [
          { key: 'Brand', value: brand },
          { key: 'Model', value: model },
          { key: 'Product Type', value: 'Air Conditioner' },
          { key: 'Warranty', value: '10 Years Compressor, 1 Year Parts & Service' }
        ]
      });
    }

    const subcategory = classifyAcSubcategory(title, p.short_desc || '');

    const description = p.long_desc || p.short_desc || `<p>${title} is an official ${brand} air conditioner distributed by Electromart, featuring premium energy efficiency, advanced air purification, and durable cooling performance.</p>`;

    newProducts.push({
      id: `em-${p.id}`,
      slug: finalSlug,
      title,
      category: 'air-conditioner',
      subcategory,
      brand,
      model,
      price,
      originalPrice,
      discount,
      rating: 4.8,
      ratingCount: Math.floor(Math.random() * 20) + 5,
      inStock: true,
      stockCount: 15,
      badge: '10% OFF',
      thumbnail: imgs[0],
      images: imgs,
      shortDescription: cleanHtml(p.short_desc || `${brand} ${model} Air Conditioner with 10% discount.`),
      description: cleanHtml(description),
      specifications: specGroups,
      warranty: '10 Years Compressor, 1 Year Spare Parts, 1 Year Free Service',
      emiAvailable: true,
      emiStartingFrom: Math.round(price / 12),
      freeDelivery: true,
      installationIncluded: true,
      reviews: []
    });
  }

  // 2. Convert Haier Products (39 items)
  for (let i = 0; i < haierRaw.length; i++) {
    const h = haierRaw[i];
    const baseInfo = h.interfaceMap?.productBaseInfo || {};
    const rawMrp = Number(baseInfo.mrp_price || baseInfo.mop_price || 0);

    let mrp = rawMrp;
    if (!mrp || mrp < 10000) {
      const t = (baseInfo.modelno || h.url).toLowerCase();
      if (t.includes('48') || t.includes('4 ton') || t.includes('ceiling') || t.includes('cassette')) mrp = 195000;
      else if (t.includes('36') || t.includes('3 ton')) mrp = 155000;
      else if (t.includes('24') || t.includes('2 ton')) mrp = 92000;
      else if (t.includes('18') || t.includes('19') || t.includes('1.5 ton')) mrp = 75000;
      else mrp = 56000;
    }

    const price = Math.round(mrp * 0.9); // 10% discount from MRP
    const originalPrice = mrp;
    const discount = 10;

    const model = baseInfo.modelno || h.url.split('/').pop().replace('.shtml', '').toUpperCase();
    const seriesName = baseInfo.pname || 'Haier Smart Cool';
    const title = `Haier ${model} ${seriesName} Air Conditioner`.replace(/\s+/g, ' ');

    let baseSlug = slugify(`haier-${model}-${seriesName}`);
    let finalSlug = baseSlug;
    let counter = 1;
    while (seenSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    seenSlugs.add(finalSlug);

    const imgs = [];
    if (baseInfo.appFile) imgs.push(baseInfo.appFile);
    if (Array.isArray(h.images)) {
      for (const img of h.images) {
        if (!imgs.includes(img)) imgs.push(img);
      }
    }
    if (imgs.length === 0) {
      imgs.push('https://image.haier.com/bd/air-conditioners/W020250915659271322622_600.png');
    }

    // Specifications
    const specGroups = [];
    if (Array.isArray(h.interfaceMap?.specificities) && h.interfaceMap.specificities.length > 0) {
      for (const grp of h.interfaceMap.specificities) {
        if (grp.title && Array.isArray(grp.list)) {
          specGroups.push({
            group: grp.title,
            items: grp.list.map(item => ({ key: item.name || 'Feature', value: item.value || 'Yes' }))
          });
        }
      }
    }
    if (specGroups.length === 0) {
      specGroups.push({
        group: 'General Specifications',
        items: [
          { key: 'Brand', value: 'Haier' },
          { key: 'Model', value: model },
          { key: 'Series', value: seriesName },
          { key: 'Official Warranty', value: '10 Years Compressor, 1 Year Parts & Service' }
        ]
      });
    }

    const subcategory = classifyAcSubcategory(title, JSON.stringify(specGroups));

    newProducts.push({
      id: `haier-ac-${i + 1}`,
      slug: finalSlug,
      title,
      category: 'air-conditioner',
      subcategory,
      brand: 'Haier',
      model,
      price,
      originalPrice,
      discount,
      rating: 4.9,
      ratingCount: Math.floor(Math.random() * 25) + 6,
      inStock: true,
      stockCount: 12,
      badge: '10% OFF',
      thumbnail: imgs[0],
      images: imgs.slice(0, 6),
      shortDescription: `Haier ${model} ${seriesName} official inverter air conditioner with 10% instant discount.`,
      description: `<p>Haier ${model} ${seriesName} delivers revolutionary cooling performance, self-clean technology, high ambient cooling, and triple inverter power saving. 100% genuine with official Haier Bangladesh warranty.</p>`,
      specifications: specGroups,
      warranty: '10 Years Compressor Warranty, 1 Year Spare Parts, 1 Year Free Service',
      emiAvailable: true,
      emiStartingFrom: Math.round(price / 12),
      freeDelivery: true,
      installationIncluded: true,
      reviews: []
    });
  }

  // 3. Convert Electronics Bangladesh Unique Products (18 items)
  for (let i = 0; i < ebRaw.length; i++) {
    const item = ebRaw[i];
    const mrp = item.mrp || 68000;
    const price = Math.round(mrp * 0.9); // 10% discount from MRP
    const originalPrice = mrp;
    const discount = 10;

    let baseSlug = slugify(item.title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (seenSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    seenSlugs.add(finalSlug);

    const modelMatch = item.title.match(/[\(\[]([^\)\]]+)[\)\]]/);
    const model = modelMatch ? modelMatch[1].trim() : `EB-AC-${i + 1}`;

    const imgs = item.images && item.images.length > 0 ? item.images : [
      'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/602/GS-12XSMA4VBA.png'
    ];

    const subcategory = classifyAcSubcategory(item.title, item.description || '');

    newProducts.push({
      id: `eb-ac-${i + 1}`,
      slug: finalSlug,
      title: item.title,
      category: 'air-conditioner',
      subcategory,
      brand: item.brand || 'Walton',
      model,
      price,
      originalPrice,
      discount,
      rating: 4.8,
      ratingCount: Math.floor(Math.random() * 18) + 4,
      inStock: true,
      stockCount: 14,
      badge: '10% OFF',
      thumbnail: imgs[0],
      images: imgs.slice(0, 5),
      shortDescription: `${item.title} with 10% discount and official warranty.`,
      description: cleanHtml(item.description),
      specifications: [
        {
          group: 'Product Details',
          items: [
            { key: 'Brand', value: item.brand || 'Walton' },
            { key: 'Model', value: model },
            { key: 'Category', value: 'Air Conditioner' },
            { key: 'Official Warranty', value: '10 Years Compressor, 1 Year Parts & Service' }
          ]
        }
      ],
      warranty: '10 Years Compressor, 1 Year Spare Parts, 1 Year Free Service',
      emiAvailable: true,
      emiStartingFrom: Math.round(price / 12),
      freeDelivery: true,
      installationIncluded: true,
      reviews: []
    });
  }

  console.log(`Total new AC products compiled: ${newProducts.length}`);
  console.log('Sample product:', newProducts[0].title, 'Price:', newProducts[0].price, 'MRP:', newProducts[0].originalPrice);

  // Now read existing src/data/products.ts
  const prodFilePath = path.join(process.cwd(), 'src/data/products.ts');
  const existingCode = fs.readFileSync(prodFilePath, 'utf8');

  // Insert into PRODUCTS array
  const marker = 'export const PRODUCTS: Product[] = [';
  const markerIdx = existingCode.indexOf(marker);
  if (markerIdx === -1) {
    throw new Error('Could not find PRODUCTS declaration marker in src/data/products.ts');
  }

  const jsonSnippet = newProducts.map(p => JSON.stringify(p, null, 2)).join(',\n') + ',\n';
  const newCode = existingCode.slice(0, markerIdx + marker.length) + '\n' + jsonSnippet + existingCode.slice(markerIdx + marker.length);

  fs.writeFileSync(prodFilePath, newCode, 'utf8');
  console.log(`Successfully inserted ${newProducts.length} new AC products into src/data/products.ts!`);

  // Also update data/admin-db.json if it exists
  const adminDbPath = path.join(process.cwd(), 'data/admin-db.json');
  if (fs.existsSync(adminDbPath)) {
    const adminDb = JSON.parse(fs.readFileSync(adminDbPath, 'utf8'));
    // Make sure all brands (Gree, Daikin, Haiko, Walton, General, Itel) are in adminDb.brands
    const existingBrandNames = new Set((adminDb.brands || []).map(b => b.name.toLowerCase()));
    const newBrandNames = ['Gree', 'Haier', 'Daikin', 'Haiko', 'Walton', 'General', 'Itel', 'LG', 'Hisense'];
    for (const b of newBrandNames) {
      if (!existingBrandNames.has(b.toLowerCase())) {
        adminDb.brands.push({
          id: slugify(b),
          name: b,
          slug: slugify(b),
          logo: `/brands/${slugify(b)}.webp`,
          authorized: true,
          description: `Official authorized ${b} dealer in Bangladesh with genuine warranty.`
        });
      }
    }
    fs.writeFileSync(adminDbPath, JSON.stringify(adminDb, null, 2), 'utf8');
    console.log('Updated brands in data/admin-db.json');
  }
}

run();
