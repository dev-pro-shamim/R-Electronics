const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tables = [
  'orders', 'products', 'categories', 'brands', 'coupons',
  'accounts', 'financial_transactions', 'expenses', 'income',
  'audit_logs', 'admin_users', 'cms_pages', 'popups', 'banners',
  'contact_inquiries', 'chat_conversations', '__nonexistent_xyz__'
];

(async () => {
  for (const t of tables) {
    const { data, error } = await s.from(t).select('*').limit(1);
    console.log(t, '->', error ? `ERR(${error.code}: ${error.message})` : `ROWS(${data?.length ?? 0}) keys=${data?.[0] ? Object.keys(data[0]).join(',') : 'empty'}`);
  }
})();
