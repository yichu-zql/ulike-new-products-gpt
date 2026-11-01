const fs = require('node:fs');
const path = require('node:path');
require('./validate.cjs');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
// Only generated output is replaced. Source data and history remain untouched.
if (path.dirname(dist)!==root || path.basename(dist)!=='dist') throw new Error('Unsafe output directory');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'assets'),{recursive:true});
for (const [from,to] of [['src/index.html','index.html'],['src/styles.css','assets/styles.css'],['src/app.js','assets/app.js']]) fs.copyFileSync(path.join(root,from),path.join(dist,to));
const data = JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8'));
fs.writeFileSync(path.join(dist,'assets/data.js'),`const DATA = ${JSON.stringify(data)};\n`);
fs.mkdirSync(path.join(dist,'assets/images'),{recursive:true});
for (const name of fs.readdirSync(path.join(root,'assets/images'))) fs.copyFileSync(path.join(root,'assets/images',name),path.join(dist,'assets/images',name));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log('Built dist with relative assets for GitHub Pages.');
