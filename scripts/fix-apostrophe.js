const fs = require("fs");
let c = fs.readFileSync("scripts/generate-fulfillment.js", "utf8");
c = c.replace("Customer's current policy documents", "Customer current policy documents");
fs.writeFileSync("scripts/generate-fulfillment.js", c);
console.log("Fixed apostrophe issue");
