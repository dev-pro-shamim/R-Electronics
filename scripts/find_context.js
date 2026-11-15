async function findContext() {
  const url = 'https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const idx = html.indexOf('"Capacity(BTU)"');
  console.log(html.slice(idx - 400, idx + 400));
}
findContext();
