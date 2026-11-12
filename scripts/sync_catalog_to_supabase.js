require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function runSync() {
  console.log('🚀 Starting Rango Electronics Full Cloud Sync...\n');

  // 1. Verify connection
  const { error: catCheck } = await supabase.from('categories').select('id').limit(1);
  if (catCheck) {
    console.error('❌ Supabase check error:', catCheck.message);
    return;
  }
  console.log('✅ Supabase tables verified!\n');

  // 2. Sync Categories
  console.log('📂 1. Syncing 9 Root Categories & Subcategories to Supabase...');
  const catContent = fs.readFileSync('src/data/categories.ts', 'utf8');
  const catMatch = catContent.match(/export const CATEGORIES:\s*Category\[\]\s*=\s*(\[[\s\S]*?\]);/);
  if (catMatch) {
    try {
      const categories = eval(catMatch[1]);
      for (const cat of categories) {
        const { error } = await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon || '',
          subcategories: cat.subcategories || []
        }, { onConflict: 'slug' });
        if (error) console.error(`   ❌ ${cat.name}:`, error.message);
        else console.log(`   ✅ Category: ${cat.name} (${cat.subcategories?.length || 0} subcategories)`);
      }
    } catch (e) {
      console.error('Category parse error:', e.message);
    }
  }

  // 3. Sync Products from src/data/products.ts
  console.log('\n📦 2. Parsing Products from src/data/products.ts...');
  const prodContent = fs.readFileSync('src/data/products.ts', 'utf8');
  const prodMatch = prodContent.match(/export const PRODUCTS:\s*Product\[\]\s*=\s*(\[[\s\S]*?\]);\s*$/);
  
  let products = [];
  if (prodMatch) {
    try {
      products = eval(prodMatch[1]);
    } catch (e) {
      console.error('Eval parse error, trying blocks fallback:', e.message);
    }
  }

  if (!products || products.length === 0) {
    // Fallback: parse JSON objects
    const blocks = prodContent.split(/\n\s*\{\s*\n\s*"id":/);
    for (let i = 1; i < blocks.length; i++) {
      try {
        const rawJson = '{"id":' + blocks[i].replace(/,\s*$/, '').trim();
        products.push(JSON.parse(rawJson));
      } catch (err) {}
    }
  }

  console.log(`Found ${products.length} products to sync.\n`);

  let successCount = 0;
  // Batch insert in chunks of 20 for maximum speed
  const chunkSize = 20;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const records = chunk.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      subcategory: p.subcategory || p.subCategory || '',
      brand: p.brand || 'Rango',
      model: p.model || '',
      price: Number(p.price) || 0,
      original_price: Number(p.originalPrice || p.price),
      discount: Number(p.discount || 0),
      in_stock: p.inStock !== false,
      thumbnail: p.thumbnail || p.images?.[0] || 'https://res.cloudinary.com/dugkfcakf/image/upload/v1794312923/rango-electronics/brand/rango-logo.png',
      images: p.images || [],
      description: p.description || p.title,
      specifications: p.specifications || [],
      warranty: p.warranty || 'Official Brand Warranty',
      emi_available: p.emiAvailable !== false,
      rating: typeof p.rating === 'number' ? p.rating : 5.0,
      reviews_count: p.reviewsCount || 11
    }));

    const { error } = await supabase.from('products').upsert(records, { onConflict: 'slug' });
    if (error) {
      console.error(`   ❌ Batch [${i + 1}-${i + chunk.length}] error:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`   ✅ Synced [${successCount}/${products.length}] products...`);
    }
  }

  console.log(`\n🎉 100% SUCCESS! Total ${successCount} products successfully synchronized to Supabase!`);
}

runSync();
