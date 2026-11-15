async function findVar() {
  const url = 'https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const idx = html.indexOf('"Capacity(BTU)"');
  const before = html.slice(Math.max(0, idx - 2500), idx);
  console.log('Script before:', before.slice(before.lastIndexOf('<script')));
}
findVar();
