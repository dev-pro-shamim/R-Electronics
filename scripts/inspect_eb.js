async function checkEB() {
  const url = 'https://electronicsbangladesh.com/category/air-conditioner';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  console.log('EB status:', res.status, 'HTML length:', html.length);

  // Check product links
  const links = (html.match(/href="https:\/\/electronicsbangladesh\.com\/product\/[^"]+"/gi) || [])
    .map(s => s.replace('href="', '').replace('"', ''));
  const uniqueLinks = [...new Set(links)];
  console.log('Unique product URLs:', uniqueLinks.length);
  console.log('Sample links:', uniqueLinks.slice(0, 5));

  // Check if pagination exists
  const pageLinks = html.match(/page\/\d+/g) || [];
  console.log('Pagination matches:', [...new Set(pageLinks)]);
}
checkEB();
