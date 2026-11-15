async function testElectromartApi() {
  const url = 'https://admin.electromart.store/api/products?category=air-conditioner&page=1';
  console.log('Testing', url);
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Keys in response:', Object.keys(data));
    if (data.data) {
      console.log('Items in data:', data.data.length || (data.data.data ? data.data.data.length : 'not array'));
      if (Array.isArray(data.data)) {
        console.log('Sample item:', data.data[0]?.name, 'mrp:', data.data[0]?.mrp, 'slug:', data.data[0]?.slug);
      } else if (data.data.data) {
        console.log('Sample item:', data.data.data[0]?.name, 'mrp:', data.data.data[0]?.mrp, 'slug:', data.data.data[0]?.slug);
        console.log('Pagination total:', data.data.total, 'last_page:', data.data.last_page);
      }
    }
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testElectromartApi();
