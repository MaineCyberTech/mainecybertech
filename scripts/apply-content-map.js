const fs = require('fs');
const path = require('path');

const productsPath = 'apps/web/lib/catalog/data/products.json';
const mapDir = 'scripts/content-map';

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const map = {};

// Load all category maps
for (const file of fs.readdirSync(mapDir).filter(f => f.endsWith('.json'))) {
  const chunk = JSON.parse(fs.readFileSync(path.join(mapDir, file), 'utf8'));
  for (const [id, content] of Object.entries(chunk)) {
    if (map[id]) throw new Error(`Duplicate id in maps: ${id} (${file})`);
    map[id] = content;
  }
}

// Apply content by id
let applied = 0;
const missing = [];
for (const p of products) {
  const c = map[p.id];
  if (!c) { missing.push(p.id); continue; }
  if (c.marketingCopy !== undefined) p.marketingCopy = c.marketingCopy;
  if (c.bestFor !== undefined) p.bestFor = c.bestFor;
  if (c.whatIsIncluded !== undefined) p.whatIsIncluded = c.whatIsIncluded;
  if (c.customerOutcomes !== undefined) p.customerOutcomes = c.customerOutcomes;
  applied++;
}

if (missing.length) {
  console.log('MISSING CONTENT FOR ' + missing.length + ' products:');
  console.log(missing.join('\n'));
}

// Write via temp-file swap (avoids Windows file locks)
const tempPath = productsPath.replace('.json', '-temp.json');
fs.writeFileSync(tempPath, JSON.stringify(products, null, 2), 'utf8');
fs.unlinkSync(productsPath);
fs.renameSync(tempPath, productsPath);
console.log('Applied content to ' + applied + '/' + products.length + ' products');

// Verify uniqueness of each field
for (const key of ['marketingCopy', 'bestFor', 'customerOutcomes', 'whatIsIncluded']) {
  const seen = new Map();
  let dups = 0;
  for (const p of products) {
    const v = key === 'marketingCopy' ? p[key] : JSON.stringify(p[key]);
    if (seen.has(v)) { dups++; console.log('  DUP ' + key + ': ' + p.id + ' = ' + seen.get(v)); }
    seen.set(v, p.id);
  }
  console.log(key + ': ' + seen.size + '/' + products.length + ' unique (' + dups + ' dups)');
}

// Length stats for marketingCopy
const lens = products.map(p => p.marketingCopy.length);
console.log('marketingCopy length min/avg/max: ' + Math.min(...lens) + '/' + Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) + '/' + Math.max(...lens));
