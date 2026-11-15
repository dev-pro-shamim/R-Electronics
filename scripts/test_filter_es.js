const fs = require('fs');

async function testFilterEs() {
  const url = 'https://www.haier.com/bd/air-conditioners/filter_es.json';
  console.log('Fetching', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Length:', text.length);
    fs.writeFileSync('haier_filter_es.json', text);
    console.log('First 500 chars:', text.slice(0, 500));
  } catch (err) {
    console.error(err.message);
  }
}

testFilterEs();
