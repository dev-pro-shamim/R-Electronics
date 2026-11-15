const fs = require('fs');

const catalogUrls = JSON.parse(fs.readFileSync('haier_catalog_urls.json', 'utf8'));

const targetFridges = [
  { model: 'HRF-578TPB', mrp: 149900, subcategory: 'side-by-side-refrigerator', type: 'T Door' },
  { model: 'HRF-622IBG', mrp: 145900, subcategory: 'side-by-side-refrigerator', type: 'SBS' },
  { model: 'HRF-622ICG', mrp: 144900, subcategory: 'side-by-side-refrigerator', type: 'SBS' },
  { model: 'HRF-386TBG', mrp: 79900, subcategory: 'non-frost-refrigerator', type: 'NF' },
  { model: 'HRF-362TBG', mrp: 75900, subcategory: 'non-frost-refrigerator', type: 'NF' },
  { model: 'HRF-500VBG', mrp: 114900, subcategory: 'non-frost-refrigerator', type: 'NF' },
  { model: 'HRF-500VMB', mrp: 108900, subcategory: 'non-frost-refrigerator', type: 'NF' },
  { model: 'HRF-475VBG', mrp: 107900, subcategory: 'non-frost-refrigerator', type: 'NF' },
  { model: 'HRF-475VMB', mrp: 102900, subcategory: 'non-frost-refrigerator', type: 'NF' },
];

const targetOvens = [
  { model: 'HMW-M2001BBD', mrp: 10990, subcategory: 'solo', type: 'Solo' },
  { model: 'HMW-E2301GBBD', mrp: 15990, subcategory: 'grill', type: 'Grill' },
  { model: 'HMW-E3001CBBD', mrp: 23990, subcategory: 'convection', type: 'Convection' },
];

const targetFreezers = [
  { model: 'HCF-420SME', mrp: 74900, capacity: '369L' },
  { model: 'HCF-340SM', mrp: 59400, capacity: '301L' },
  { model: 'HCF-290SM', mrp: 53400, capacity: '251L' },
  { model: 'HCF-230SGE', mrp: 51400, capacity: '200L' },
  { model: 'HCF-230SGM', mrp: 48400, capacity: '200L' },
  { model: 'HCF-230SGML', mrp: 48900, capacity: '200L' },
  { model: 'HCF-230SGEL', mrp: 51400, capacity: '200L' },
  { model: 'HCF-175SGE', mrp: 43900, capacity: '142L' },
  { model: 'HCF-175SGEL', mrp: 43900, capacity: '142L' },
];

console.log('Testing match against catalog URLs...');

function findUrlForModel(urls, model) {
  const cleanM = model.toLowerCase().replace(/[^a-z0-9]/g, '');
  return urls.find(u => {
    const slug = u.split('/').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    return slug.includes(cleanM) || cleanM.includes(slug.slice(0, 10));
  });
}

console.log('--- FRIDGE URL MATCHES ---');
for (const f of targetFridges) {
  const match = findUrlForModel(catalogUrls.fridges, f.model);
  console.log(f.model, '->', match || 'SEARCH NEEDED');
}

console.log('--- OVEN URL MATCHES ---');
for (const o of targetOvens) {
  const match = findUrlForModel(catalogUrls.ovens, o.model);
  console.log(o.model, '->', match || 'SEARCH NEEDED');
}

console.log('--- FREEZER URL MATCHES ---');
for (const f of targetFreezers) {
  const match = findUrlForModel(catalogUrls.freezers, f.model);
  console.log(f.model, '->', match || 'SEARCH NEEDED');
}
