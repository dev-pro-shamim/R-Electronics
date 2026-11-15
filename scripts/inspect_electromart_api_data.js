async function inspectElectromartApiData() {
  const url = 'https://admin.electromart.store/api/products?category=air-conditioner&page=1';
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const data = await res.json();
  console.log('data keys:', Object.keys(data.data));
  console.log('data.products:', data.data.products ? Object.keys(data.data.products) : 'no products');
  if (data.data.products?.data) {
    console.log('Total in data.products:', data.data.products.total, 'current page count:', data.data.products.data.length);
    console.log('Sample product:', data.data.products.data[0]);
  }
}

inspectElectromartApiData();
