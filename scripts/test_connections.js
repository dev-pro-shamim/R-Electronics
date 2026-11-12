require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');
const { createClient } = require('@supabase/supabase-js');

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

async function testAll() {
  console.log('Testing Cloudinary Connection...');
  try {
    const res = await cloudinary.api.ping();
    console.log('✅ Cloudinary Ping Successful:', res);
  } catch (err) {
    console.error('❌ Cloudinary Error:', err.message);
  }

  console.log('\nTesting Supabase Connection...');
  try {
    // Try pinging or querying any table (e.g. products)
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.log('ℹ️ Supabase Response (Table status):', error.message);
    } else {
      console.log('✅ Supabase Query Successful, items count:', data.length);
    }
  } catch (err) {
    console.error('❌ Supabase Error:', err.message);
  }
}

testAll();
