const fs = require('fs');

async function inspectHaierJs() {
  const html = fs.readFileSync('analysis_haier.html', 'utf8');
  
  // Find any API call or JSON endpoints inside the scripts
  const apis = html.match(/https?:\/\/[^\s"']+/gi) || [];
  console.log('Haier URLs in HTML:', apis.filter(u => u.includes('search') || u.includes('api') || u.includes('product') || u.includes('json') || u.includes('data')));

  // Let's also fetch haier2025_product_list.js
  const jsRes = await fetch('https://www.haier.com/bd/images/haier2025_product_list.js');
  const jsText = await jsRes.text();
  console.log('haier2025_product_list.js length:', jsText.length);
  fs.writeFileSync('haier2025_product_list.js', jsText);
  
  // Check any product list API url inside jsText
  const jsApis = jsText.match(/https?:\/\/[^\s"']+/gi) || [];
  console.log('URLs in product_list.js:', Array.from(new Set(jsApis)));
  
  // Also check inline scripts in analysis_haier.html for product model numbers or json
  const modelMatches = html.match(/HSU-[A-Za-z0-9\-]+/gi) || [];
  console.log('Model matches in html:', Array.from(new Set(modelMatches)));
}

inspectHaierJs();
