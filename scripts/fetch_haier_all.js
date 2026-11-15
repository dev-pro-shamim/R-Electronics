const fs = require('fs');

async function scrapeHaier() {
  const urls = JSON.parse(fs.readFileSync('haier_ac_urls.json', 'utf8'))
    .filter(u => u.endsWith('.shtml'));
  console.log(`Starting scrape of ${urls.length} Haier AC products...`);

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Fetching ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`Failed ${url}: ${res.status}`);
        continue;
      }
      const html = await res.text();

      // Extract interfaceMapPage
      const scriptMatch = html.match(/const\s+interfaceMapPage\s*=\s*(\{[\s\S]*?\n\};)/);
      let interfaceMap = null;
      if (scriptMatch) {
        try {
          // Remove single line comments
          const cleaned = scriptMatch[1]
            .replace(/\/\/.*$/gm, '')
            .replace(/,\s*\};/g, '}')
            .replace(/;\s*$/, '');
          interfaceMap = JSON.parse(cleaned);
        } catch (e) {
          // Fallback regex extraction of base info and specs
          const mrpMatch = html.match(/"mrp_price"\s*:\s*"([^"]+)"/);
          const modelMatch = html.match(/"modelno"\s*:\s*"([^"]+)"/);
          const pnameMatch = html.match(/"pname"\s*:\s*"([^"]+)"/);
          const appFileMatch = html.match(/"appFile"\s*:\s*"([^"]+)"/);

          interfaceMap = {
            productBaseInfo: {
              docPubUrl: url,
              pname: pnameMatch ? pnameMatch[1] : '',
              modelno: modelMatch ? modelMatch[1] : '',
              mrp_price: mrpMatch ? mrpMatch[1] : '',
              appFile: appFileMatch ? appFileMatch[1] : ''
            },
            specificities: []
          };

          // Try extract specificities block
          const specIdx = html.indexOf('"specificities":');
          if (specIdx !== -1) {
            const specEnd = html.indexOf('productDetailBanner', specIdx);
            const slice = html.slice(specIdx + 16, specEnd !== -1 ? specEnd : specIdx + 5000);
            const cleanSlice = slice.replace(/\/\/.*$/gm, '').trim().replace(/,\s*$/, '');
            try {
              interfaceMap.specificities = JSON.parse(cleanSlice);
            } catch (_) {}
          }
        }
      }

      // Title & Images
      const titleTag = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || '';
      const imgs = [...new Set(html.match(/https:\/\/image\.haier\.com\/bd\/air-conditioners\/[^"'\s]+/gi) || [])]
        .filter(u => !u.includes('header') && !u.includes('footer') && !u.includes('logo'));

      results.push({
        url,
        titleTag,
        interfaceMap,
        images: imgs
      });
    } catch (err) {
      console.error(`Error on ${url}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 60));
  }

  fs.writeFileSync('haier_acs_raw.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved ${results.length} Haier products to haier_acs_raw.json`);
}

scrapeHaier();
