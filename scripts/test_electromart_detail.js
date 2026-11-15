async function testDetail(slug) {
  const url = `https://admin.electromart.store/api/products/${encodeURIComponent(slug)}`;
  console.log('Testing detail for:', url);
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Keys:', Object.keys(data.data || {}));
  console.log('Product details sample:', {
    name: data.data?.name,
    sku: data.data?.sku,
    mrp: data.data?.mrp,
    description: data.data?.description ? data.data.description.slice(0, 200) : null,
    specifications: data.data?.specifications?.length || data.data?.product_specifications?.length || Object.keys(data.data?.attributes || {}),
    specSample: (data.data?.product_specifications || data.data?.specifications || []).slice(0, 3)
  });
}

testDetail('gree-shimo-split-air-conditioner-1-0-ton-inverter New');
