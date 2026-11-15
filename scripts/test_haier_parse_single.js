async function parseHaierPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();

  // Model from title or URL
  // e.g. /hsu-12turboaqua-fix--pro--x6-.shtml
  const slug = url.split('/').pop().replace('.shtml', '');
  const titleTag = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
  const h1Tag = (html.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1] || '';

  // Extract model name from titleTag
  // e.g. "Haier HSU-12TurboAqua(FIX)(Pro)(X6)-TurboAqua/ AquaCool Pro-Haier Bangladesh"
  const modelMatch = titleTag.match(/Haier\s+([^-\|]+)/i);
  const model = modelMatch ? modelMatch[1].trim() : slug.toUpperCase();

  // Clean full title
  const cleanTitle = `Haier ${model} ${h1Tag ? cleanHtml(h1Tag) : ''} Air Conditioner`.replace(/\s+/g, ' ').trim();

  // Extract images
  const imgMatches = (html.match(/https:\/\/image\.haier\.com\/bd\/air-conditioners\/[^"'\s]+/gi) || []);
  const cleanImgs = [...new Set(imgMatches)].filter(u => !u.includes('header') && !u.includes('footer') && !u.includes('logo'));

  // Specs extraction
  const specs = [];
  // Look for spec rows: <div class="...item..."><div class="name">...</div><div class="val">...</div>
  const specItems = [];
  const rowMatches = html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  for (const r of rowMatches) {
    const tds = [...r[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cleanHtml(m[1]));
    if (tds.length >= 2 && tds[0] && tds[1]) {
      specItems.push({ key: tds[0], value: tds[1] });
    }
  }

  // Also check list/dt-dd or div based specs
  const liMatches = html.matchAll(/<li[^>]*class="[^"]*spec[^"]*"[^>]*>([\s\S]*?)<\/li>/gi);
  for (const li of liMatches) {
    const text = cleanHtml(li[1]);
    const parts = text.split(/[:：]/);
    if (parts.length >= 2) {
      specItems.push({ key: parts[0].trim(), value: parts.slice(1).join(':').trim() });
    }
  }

  console.log('Result for:', slug, {
    model,
    cleanTitle,
    imgsCount: cleanImgs.length,
    specsCount: specItems.length,
    sampleImg: cleanImgs[0]
  });
}

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

parseHaierPage('https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml');
