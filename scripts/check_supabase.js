const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

(async () => {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const spec = await res.json();
  console.log('OpenAPI paths:', Object.keys(spec.paths || {}));
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('orders').select('*').limit(3);
  console.log('Orders sample:', error ? error.message : data?.length, data?.[0] ? Object.keys(data[0]) : []);
})();
