async function inspectEBProducts() {
  const url = 'https://electronicsbangladesh.com/category/air-conditioner';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  // Parse product cards
  const links = (html.match(/href="https:\/\/electronicsbangladesh\.com\/product\/[^"]+"/gi) || [])
    .map(s => s.replace('href="', '').replace('"', ''));
  const uniqueLinks = [...new Set(links)];

  console.log(`Found ${uniqueLinks.length} products on Electronics Bangladesh`);
  for (const l of uniqueLinks.slice(0, 5)) {
    const pRes = await fetch(l, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pHtml = await pRes.text();
    const titleMatch = pHtml.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>(.*?)<\/h1>/i) || pHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Price
    const delPrice = pHtml.match(/<del[^>]*>[\s\S]*?<bdi[^>]*>([\s\S]*?)<\/bdi>/i);
    const insPrice = pHtml.match(/<ins[^>]*>[\s\S]*?<bdi[^>]*>([\s\S]*?)<\/bdi>/i);
    const singlePrice = pHtml.match(/<span[^>]*class="[^"]*amount[^"]*"[^>]*><bdi[^>]*>([\s\S]*?)<\/bdi>/i);

    const priceText = (delPrice || insPrice || singlePrice || ['','0'])[1].replace(/[^0-9]/g, '');

    // Img
    const imgMatch = pHtml.match(/<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/i) || pHtml.match(/data-large_image="([^"]+)"/i);

    console.log({
      url: l,
      title,
      price: priceText,
      img: imgMatch ? imgMatch[1] : null
    });
  }
}
inspectEBProducts();
