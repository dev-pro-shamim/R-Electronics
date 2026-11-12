require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function testUpload() {
  console.log('Uploading Rango logo to Cloudinary...');
  try {
    const res = await cloudinary.uploader.upload('public/logo.png', {
      folder: 'rango-electronics/brand',
      public_id: 'rango-logo'
    });
    console.log('✅ Upload Successful!');
    console.log('Cloudinary CDN URL:', res.secure_url);
  } catch (err) {
    console.error('❌ Upload Error:', err);
  }
}

testUpload();
