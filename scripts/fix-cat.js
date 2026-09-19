const fs = require('fs');
let content = fs.readFileSync('scripts/generate-fulfillment.js', 'utf8');

// Fix all instances of 'cat' that should be 'c' (category variable)
// The function uses 'c' for category but some lines use 'cat'
let fixed = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Replace standalone 'cat ===' or 'cat.' with 'c ===' or 'c.'
  // Only in context where it's clearly a variable reference (not in strings/comments)
  if (lines[i].includes('cat ===') || lines[i].includes('cat.')) {
    lines[i] = lines[i].replace(/\bcat\b/g, 'c');
    fixed++;
  }
}

content = lines.join('\n');
fs.writeFileSync('scripts/generate-fulfillment.js', content);
console.log('Fixed ' + fixed + ' lines with cat->c references');
