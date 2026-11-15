const fs = require('fs');
const path = require('path');

const prodPath = path.join(__dirname, '../src/data/products.ts');
let code = fs.readFileSync(prodPath, 'utf8');
code = code.replace(
  'https://image.haier.com/bd/commercial-air-conditioners/W020250915659271322622_600.png',
  'https://image.haier.com/bd/air-conditioners/W020250915659271322622_600.png'
);
fs.writeFileSync(prodPath, code, 'utf8');

const reviewsPath = path.join(__dirname, '../data/admin-reviews.json');
if (fs.existsSync(reviewsPath)) {
  let revCode = fs.readFileSync(reviewsPath, 'utf8');
  revCode = revCode.replace(
    /https:\/\/image\.haier\.com\/bd\/commercial-air-conditioners\/W020250915659271322622_600\.png/g,
    'https://image.haier.com/bd/air-conditioners/W020250915659271322622_600.png'
  );
  fs.writeFileSync(reviewsPath, revCode, 'utf8');
}

const dbPath = path.join(__dirname, '../data/admin-db.json');
if (fs.existsSync(dbPath)) {
  let dbCode = fs.readFileSync(dbPath, 'utf8');
  dbCode = dbCode.replace(
    /https:\/\/image\.haier\.com\/bd\/commercial-air-conditioners\/W020250915659271322622_600\.png/g,
    'https://image.haier.com/bd/air-conditioners/W020250915659271322622_600.png'
  );
  fs.writeFileSync(dbPath, dbCode, 'utf8');
}

console.log('Fixed eb-ac-18 URL to valid 200 OK asset!');
