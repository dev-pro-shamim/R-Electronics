const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream("public/banners/clean-11-11-banner.gif");
https.get("https://adminapi.electronicsbangladesh.com/storage/media/large/GIF-Banner-2733.gif", function(response) {
  response.pipe(file);
  file.on("finish", function() {
    file.close(() => console.log("Clean banner downloaded!"));
  });
}).on("error", (err) => console.error(err));
