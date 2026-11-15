const fs = require('fs');

const ITEMS = [
  // Water Heaters
  {
    type: 'wh',
    model: 'ES30H-CK3 (BD)',
    material: 'GA0SJHE00',
    capacity: '30L',
    mrp: 13300,
    url: 'https://www.haier.com/bd/water-heaters/es30h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES40H-CK3(BD)',
    material: 'GA0G8WE00',
    capacity: '40L',
    mrp: 14800,
    url: 'https://www.haier.com/bd/water-heaters/es40h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES50H-CK3(BD)',
    material: 'GA0G8VE00',
    capacity: '50L',
    mrp: 16300,
    url: 'https://www.haier.com/bd/water-heaters/es50h-ck3-bd-.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES35H-Tigris',
    material: 'GA0UM0E04',
    capacity: '35L',
    mrp: 13800,
    url: 'https://www.haier.com/bd/water-heaters/es35h-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES45H-Tigris',
    material: 'GA0UM1E04',
    capacity: '45L',
    mrp: 15500,
    url: 'https://www.haier.com/bd/water-heaters/es45h-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },
  {
    type: 'wh',
    model: 'ES30V-Tigris',
    material: 'GA0UAAE02',
    capacity: '30L',
    mrp: 14300,
    url: 'https://www.haier.com/bd/water-heaters/es30v-tigris.shtml',
    cat: 'geyser-water-heaters',
    subcat: 'haier-geyser-water-heaters'
  },

  // TVs
  {
    type: 'tv',
    size: 32,
    model: 'H32S80GFX',
    material: 'DH20H5Z01',
    spec: 'QLED FHD Google TV',
    mrp: 35900,
    url: 'https://www.haier.com/bd/tvs/h32s80gfx.shtml',
    cat: 'television',
    subcat: '32-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S80GFX',
    material: 'DH20GCZ01',
    spec: 'QLED FHD Google TV, 1G+8G',
    mrp: 46900,
    url: 'https://www.haier.com/bd/tvs/h43s80gfx.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S80GUX',
    material: 'DH20QEZ00',
    spec: 'QLED 4K Google TV, 2G+32G',
    mrp: 57900,
    url: 'https://www.haier.com/bd/tvs/h43s80gux.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: '43P7 PRO',
    material: 'DH20P7Z00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 62900,
    url: 'https://www.haier.com/bd/tvs/43p7pro.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 43,
    model: 'H43S85GUX',
    material: 'DH20P8Z00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 63900,
    url: 'https://www.haier.com/bd/tvs/43s85gux.shtml',
    cat: 'television',
    subcat: '43-inch'
  },
  {
    type: 'tv',
    size: 50,
    model: '50P7 PRO',
    material: 'DH20N8Z00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 76900,
    url: 'https://www.haier.com/bd/tvs/50p7pro.shtml',
    cat: 'television',
    subcat: '50-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: '55P7 PRO',
    material: 'DH20MGZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 91900,
    url: 'https://www.haier.com/bd/tvs/55p7pro.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: 'H55S85GUX',
    material: 'DH20MHZ00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 92900,
    url: 'https://www.haier.com/bd/tvs/55s85gux.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: '65P7 PRO',
    material: 'DH20LJZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 123900,
    url: 'https://www.haier.com/bd/tvs/65p7pro.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: 'H65S85GUX',
    material: 'DH20LKZ00',
    spec: 'QLED, 120Hz, Hands Free, 2G+32G',
    mrp: 124900,
    url: 'https://www.haier.com/bd/tvs/65s85gux.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 75,
    model: '75P7 PRO',
    material: 'DH20KJZ00',
    spec: 'HQLED, Google TV, 2G+32G, Hands Free Voice',
    mrp: 164900,
    url: 'https://www.haier.com/bd/tvs/75p7pro.shtml',
    cat: 'television',
    subcat: '75-inch'
  },
  {
    type: 'tv',
    size: 55,
    model: 'H55M80GUX',
    material: 'DH210FZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 109900,
    url: 'https://www.haier.com/bd/tvs/h55m80gux.shtml',
    cat: 'television',
    subcat: '55-inch'
  },
  {
    type: 'tv',
    size: 65,
    model: 'H65M80GUX',
    material: 'DH20ZEZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 145900,
    url: 'https://www.haier.com/bd/tvs/h65m80gux.shtml',
    cat: 'television',
    subcat: '65-inch'
  },
  {
    type: 'tv',
    size: 75,
    model: 'H75M80GUX',
    material: 'DH20YEZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 197900,
    url: 'https://www.haier.com/bd/tvs/h75m80gux.shtml',
    cat: 'television',
    subcat: '75-inch'
  },
  {
    type: 'tv',
    size: 85,
    model: 'H85M80GUX',
    material: 'DH20XBZ00',
    spec: 'MiniLED, 120Hz, KEF Sound',
    mrp: 259900,
    url: 'https://www.haier.com/bd/tvs/h85m80gux.shtml',
    cat: 'television',
    subcat: '85-inch'
  },
  {
    type: 'tv',
    size: 100,
    model: 'H100S90FUX',
    material: 'DH20EME00',
    spec: 'MiniLED, 144Hz, 55W KEF Sound',
    mrp: 499900,
    url: 'https://www.haier.com/bd/tvs/h100s90fux.shtml',
    cat: 'television',
    subcat: '100-inch-tv'
  }
];

async function testAll() {
  console.log(`Testing all ${ITEMS.length} URLs...`);
  const results = [];
  for (const item of ITEMS) {
    try {
      const res = await fetch(item.url);
      const html = await res.text();
      const titleM = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleM ? titleM[1].replace(/-Haier Bangladesh/i, '').trim() : item.model;
      
      const imgs = (html.match(/https:\/\/image\.haier\.com\/bd\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi) || []);
      const productImgs = [...new Set(imgs)].filter(u => 
        !u.includes('header') && !u.includes('footer') && !u.includes('logo') && !u.includes('icon')
      );

      results.push({
        model: item.model,
        status: res.status,
        title,
        imgsCount: productImgs.length,
        thumb: productImgs[0] || null
      });
      console.log(`[${res.status}] ${item.model} -> ${title} (${productImgs.length} imgs, thumb: ${productImgs[0] ? 'OK' : 'NONE'})`);
    } catch (err) {
      console.log(`[ERR] ${item.model}: ${err.message}`);
    }
  }
}

testAll();
