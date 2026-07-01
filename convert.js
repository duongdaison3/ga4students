const fs = require('fs');
const text = fs.readFileSync('uni.txt', 'utf8');
const unis = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const content = `export const universities = ${JSON.stringify(unis, null, 2)};`;
fs.writeFileSync('src/lib/universities.ts', content);
