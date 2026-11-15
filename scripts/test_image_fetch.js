const samples = {
  'haier': 'https://image.haier.com/bd/refrigerators/W020251230634687442105_1200_q.png',
  'cloudfront_electromart': 'https://d2ttkd7jwwn4uz.cloudfront.net/public/media/602/GS-12XSMA4VBA.png',
  'electronicsbd': 'https://electronicsbangladesh.com/wp-content/uploads/2025/05/Walton-2-Ton-Inverter-Air-Conditioner-WSI-INVERNA-SUPERSAVER-24H-SMART-PLASMA.webp',
  'rango': 'https://rangoelectronics.com/wp-content/uploads/2026/05/image-3.webp'
};

async function testAll() {
  for (const [name, url] of Object.entries(samples)) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://rango-electronics.vercel.app/'
        }
      });
      console.log(`[${name}] Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}, Length: ${res.headers.get('content-length')}`);
    } catch (e) {
      console.error(`[${name}] Fetch error:`, e.message);
    }
  }
}

testAll();
