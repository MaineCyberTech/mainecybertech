const fs = require('fs');
const path = require('path');

const productsPath = 'apps/web/lib/catalog/data/products.json';
const mapDir = 'scripts/content-map';
const fulfillmentMapDir = 'scripts/content-map-fulfillment';

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const map = {};
const fulfillmentMap = {};

// Load all category maps
for (const file of fs.readdirSync(mapDir).filter(f => f.endsWith('.json'))) {
  const chunk = JSON.parse(fs.readFileSync(path.join(mapDir, file), 'utf8'));
  for (const [id, content] of Object.entries(chunk)) {
    if (map[id]) throw new Error(`Duplicate id in maps: ${id} (${file})`);
    map[id] = content;
  }
}

// Load all fulfillment/internal-procedure maps
for (const file of fs.readdirSync(fulfillmentMapDir).filter(f => f.endsWith('.json'))) {
  const chunk = JSON.parse(fs.readFileSync(path.join(fulfillmentMapDir, file), 'utf8'));
  for (const [id, content] of Object.entries(chunk)) {
    if (fulfillmentMap[id]) throw new Error(`Duplicate fulfillment id in maps: ${id} (${file})`);
    fulfillmentMap[id] = content;
  }
}

// Apply content by id
let applied = 0;
let fulfillmentApplied = 0;
const missing = [];
const missingFulfillment = [];
for (const p of products) {
  const c = map[p.id];
  if (!c) { missing.push(p.id); continue; }
  if (c.marketingCopy !== undefined) p.marketingCopy = c.marketingCopy;
  if (c.bestFor !== undefined) p.bestFor = c.bestFor;
  if (c.whatIsIncluded !== undefined) p.whatIsIncluded = c.whatIsIncluded;
  if (c.customerOutcomes !== undefined) p.customerOutcomes = c.customerOutcomes;
  applied++;
  const f = fulfillmentMap[p.id];
  if (!f) { missingFulfillment.push(p.id); continue; }
  if (f.fulfillmentWorkflow !== undefined) p.fulfillmentWorkflow = f.fulfillmentWorkflow;
  if (f.internalProcedure !== undefined) p.internalProcedure = f.internalProcedure;
  fulfillmentApplied++;
}

if (missing.length) {
  console.log('MISSING CONTENT FOR ' + missing.length + ' products:');
  console.log(missing.join('\n'));
}
if (missingFulfillment.length) {
  console.log('MISSING FULFILLMENT CONTENT FOR ' + missingFulfillment.length + ' products:');
  console.log(missingFulfillment.join('\n'));
}

// Write via temp-file swap (avoids Windows file locks)
const tempPath = productsPath.replace('.json', '-temp.json');
fs.writeFileSync(tempPath, JSON.stringify(products, null, 2), 'utf8');
fs.unlinkSync(productsPath);
fs.renameSync(tempPath, productsPath);
console.log('Applied content to ' + applied + '/' + products.length + ' products');
console.log('Applied fulfillment content to ' + fulfillmentApplied + '/' + products.length + ' products');

// Verify uniqueness of each field
for (const key of ['marketingCopy', 'bestFor', 'customerOutcomes', 'whatIsIncluded', 'fulfillmentWorkflow']) {
  const seen = new Map();
  let dups = 0;
  for (const p of products) {
    const v = key === 'marketingCopy' ? p[key] : JSON.stringify(p[key]);
    if (seen.has(v)) { dups++; console.log('  DUP ' + key + ': ' + p.id + ' = ' + seen.get(v)); }
    seen.set(v, p.id);
  }
  console.log(key + ': ' + seen.size + '/' + products.length + ' unique (' + dups + ' dups)');
}

// Verify fulfillmentWorkflow is exactly 7 steps and internalProcedure is complete
let shapeBad = 0;
for (const p of products) {
  if (!Array.isArray(p.fulfillmentWorkflow) || p.fulfillmentWorkflow.length !== 7) {
    shapeBad++;
    console.log('  BAD fulfillmentWorkflow: ' + p.id + ' (' + (p.fulfillmentWorkflow && p.fulfillmentWorkflow.length) + ')');
  }
  const proc = p.internalProcedure;
  if (!proc) { shapeBad++; console.log('  BAD internalProcedure missing: ' + p.id); continue; }
  for (const phase of ['triage', 'delivery', 'documentation', 'qa', 'closeout']) {
    if (!Array.isArray(proc[phase]) || proc[phase].length < 3) {
      shapeBad++;
      console.log('  BAD internalProcedure.' + phase + ': ' + p.id + ' (' + (proc[phase] && proc[phase].length) + ')');
    }
  }
}
console.log('shape issues: ' + shapeBad);

// Length stats for marketingCopy
const lens = products.map(p => p.marketingCopy.length);
console.log('marketingCopy length min/avg/max: ' + Math.min(...lens) + '/' + Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) + '/' + Math.max(...lens));
