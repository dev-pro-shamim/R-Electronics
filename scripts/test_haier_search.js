async function testHaierSearch() {
  const params = new URLSearchParams({
    code: '1eaeaea5ed7a4ff8a01c759c1c82cbeb',
    searchWord: '',
    pageNo: '1',
    pageSize: '50',
    siteId: '37',
    searchColumns: 'outline,mopPrice,mrpPrice',
    orderBy: 'docOrderPri:desc,docOrder:desc',
    filterJsonUrl: 'https://www.haier.com/bd/air-conditioners/filter_es.json',
    filter: '',
    defaultSearch: '(channelId=43604) and (psale=1)',
    retFilterJson: 'yes'
  });

  const urls = [
    `https://www.haier.com/igs/front/overseas_product/getProduct?${params.toString()}`,
    `https://www.haier.com/igs/front/filter_search/getMerge?${params.toString()}`
  ];

  for (const u of urls) {
    console.log('Testing:', u);
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.haier.com/bd/air-conditioners/?spm=bd.Homepage_pc.headerLeft-20261020.1'
        }
      });
      console.log('Status:', res.status, res.headers.get('content-type'));
      const text = await res.text();
      console.log('Body length:', text.length);
      if (text.startsWith('{') || text.startsWith('[')) {
        console.log('JSON start:', text.slice(0, 400));
        fs.writeFileSync('haier_api_result.json', text);
      } else {
        console.log('Non-JSON text start:', text.slice(0, 200));
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

testHaierSearch();
