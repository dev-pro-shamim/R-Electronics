const https = require('https');

https.get('https://electronicsbangladesh.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/https:\/\/[^"'\s]+\.(?:png|jpg|svg|webp)/gi) || [];
    const authImgs = matches.filter(m => m.toLowerCase().includes('login') || m.toLowerCase().includes('auth') || m.toLowerCase().includes('modal') || m.toLowerCase().includes('security') || m.toLowerCase().includes('vector'));
    console.log('Auth related images:', authImgs.slice(0, 10));
  });
}).on('error', err => console.error(err.message));
