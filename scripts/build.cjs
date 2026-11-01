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
const site = JSON.parse(fs.readFileSync(path.join(root,'data/site.json'),'utf8'));
const escapedTitle = site.title.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
fs.writeFileSync(path.join(dist,'index.html'),fs.readFileSync(path.join(root,'src/index.html'),'utf8').replaceAll('{{SITE_TITLE}}',escapedTitle));
fs.writeFileSync(path.join(dist,'assets/app.js'),'const SITE_TITLE = '+JSON.stringify(site.title)+';\n'+fs.readFileSync(path.join(root,'src/app.js'),'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8'));
fs.writeFileSync(path.join(dist,'assets/data.js'),`const DATA = ${JSON.stringify(data)};\n`);
fs.mkdirSync(path.join(dist,'assets/images'),{recursive:true});
for (const name of fs.readdirSync(path.join(root,'assets/images'))) fs.copyFileSync(path.join(root,'assets/images',name),path.join(dist,'assets/images',name));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log('Built dist with relative assets for GitHub Pages.');

const {execFileSync}=require('node:child_process');
let commit=process.env.GITHUB_SHA||'local';try{if(commit==='local')commit=execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
fs.writeFileSync(path.join(dist,'release.json'),JSON.stringify({commit,dataThrough:data.meta?.dataThrough||data.days.map(d=>d.date).sort().at(-1),batch:data.meta?.sourceBatch||null,publishedAt:new Date().toISOString()}));
