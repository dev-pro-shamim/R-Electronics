const cats = require('./source_categories.json');
console.log('All source category slugs:');
cats.forEach(c => console.log(`id: ${c.id}, slug: "${c.slug}", name: "${c.name}", parent: ${c.parent}`));
