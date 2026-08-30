const fs = require("fs");
const products = JSON.parse(fs.readFileSync("apps/web/lib/catalog/data/products.json", "utf8"));

const toFix = {
  "MCT Secure Care": "Everything in Business Care",
  "MCT Complete Care": "Everything in Secure Care",
  "Cyber Complete": "Everything in Cyber Plus",
};

let removed = 0;
for (const p of products) {
  const dup = toFix[p.name];
  if (dup && p.whatIsIncluded.includes(dup)) {
    p.whatIsIncluded = p.whatIsIncluded.filter((i) => i !== dup);
    removed++;
    console.log(p.name + ": removed duplicate line");
  }
}

fs.writeFileSync(
  "apps/web/lib/catalog/data/products.json",
  JSON.stringify(products, null, 2),
  "utf8",
);
console.log("Total duplicate lines removed: " + removed);
