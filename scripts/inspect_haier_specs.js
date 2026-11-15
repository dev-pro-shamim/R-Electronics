async function inspectHaierSpecs() {
  const url = 'https://www.haier.com/bd/air-conditioners/hsu-12turboaqua-fix--pro--x6-.shtml';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  // Find occurrences of "Capacity" or "BTU" or "Inverter" or "Power"
  const snippets = [];
  const idx = html.indexOf('BTU');
  if (idx !== -1) {
    snippets.push(html.slice(Math.max(0, idx - 200), Math.min(html.length, idx + 300)));
  }
  const idx2 = html.indexOf('Specification');
  if (idx2 !== -1) {
    snippets.push(html.slice(Math.max(0, idx2 - 100), Math.min(html.length, idx2 + 400)));
  }

  console.log('Snippets:', snippets);
}
inspectHaierSpecs();
