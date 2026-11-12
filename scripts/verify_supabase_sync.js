require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function verify() {
  const { count: prodCount, error: pErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: catCount, error: cErr } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { data: sampleProducts } = await supabase.from('products').select('title, price, category, subcategory').limit(5);

  console.log(`📊 Supabase Live Product Count: ${prodCount}`);
  console.log(`📊 Supabase Live Category Count: ${catCount}`);
  console.log('\nSample Live Products in Supabase:');
  sampleProducts.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.title} - ৳${p.price} [${p.category} > ${p.subcategory}]`);
  });
}

verify();
