const https = require('https');
const fs = require('fs');

function download(url, dest) {
  const file = fs.createWriteStream(dest);
  https.get(url, function(response) {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => console.log('Downloaded', dest));
      });
    } else {
      console.log('Failed:', response.statusCode, url);
    }
  }).on('error', function(err) {
    console.error('Error:', err.message);
  });
}

download('https://electronicsbangladesh.com/gift.gif', 'public/gift.gif');
download('https://electronicsbangladesh.com/favicon.ico', 'public/favicon.ico');
