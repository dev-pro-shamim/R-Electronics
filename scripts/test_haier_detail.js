async function testHaierDetail() {
  const url = 'https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  console.log('Haier detail status:', res.status, 'HTML length:', html.length);
  // Title
  const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1];
  console.log('Title:', title);
  // Look for model/name in meta tags or h1
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1];
  console.log('H1:', h1);
  // Look for images
  const imgs = (html.match(/https:\/\/[^"']+\.(?:jpg|png|webp)/gi) || []).filter(u => u.includes('haier.com'));
  console.log('Imgs found:', [...new Set(imgs)].slice(0, 5));
}
testHaierDetail();
