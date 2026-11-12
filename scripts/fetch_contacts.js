const fs = require('fs');

async function fetchContacts() {
  try {
    const res = await fetch('https://rangoelectronics.com/our-contacts/');
    const html = await res.text();
    fs.writeFileSync('scripts/contacts_page.html', html, 'utf8');
    console.log('Saved contacts_page.html, size:', html.length);

    // Extract social links
    const socialMatches = html.match(/https?:\/\/(?:www\.)?(?:facebook|fb|youtube|instagram|twitter|x|linkedin|tiktok|pinterest)\.com\/[^\s"'>]+/gi);
    console.log('Social matches:', socialMatches);

    // Extract emails
    const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    console.log('Emails:', emails);

    // Extract phones
    const phones = html.match(/(?:\+?88\s*)?01[3-9]\d{2}[-\s]?\d{6}/g);
    console.log('Phones:', phones);

    // Extract map iframe
    const iframeMatch = html.match(/<iframe[^>]+google\.com\/maps[^>]+>/i);
    console.log('Map iframe:', iframeMatch ? iframeMatch[0] : 'None');
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

fetchContacts();
