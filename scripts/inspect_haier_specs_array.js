async function findJsonVar() {
  const url = 'https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  // Find JSON array containing "title" and "list"
  const m = html.match(/(\[\s*\{\s*"title"\s*:\s*"[\s\S]*?\}\s*\])\s*;/);
  if (m) {
    try {
      const parsed = JSON.parse(m[1]);
      console.log('Parsed groups:', parsed.length);
      console.log('Group titles:', parsed.map(g => g.title));
      console.log('Sample group items:', parsed[0].list);
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
  } else {
    console.log('Pattern not matched');
  }
}
findJsonVar();
