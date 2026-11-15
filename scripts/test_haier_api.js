async function testHaierApi() {
  const url = 'https://www.haier.com/igs/front/overseas_product/getProduct?siteId=158&chnlId=43604&pageNo=1&pageSize=50';
  console.log('Testing Haier getProduct API:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.haier.com/bd/air-conditioners/?spm=bd.Homepage_pc.headerLeft-20261020.1'
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Haier data keys:', Object.keys(data));
    console.log('Total / count:', data.total || data.count || data.pageInfo?.total || (Array.isArray(data.list) ? data.list.length : null));
    if (data.list && data.list.length > 0) {
      console.log('Sample product item:', JSON.stringify(data.list[0], null, 2));
    } else if (data.data) {
      console.log('Sample data:', JSON.stringify(data.data, null, 2).slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testHaierApi();
