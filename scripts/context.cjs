const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8'));
const site=JSON.parse(fs.readFileSync(path.join(root,'data/site.json'),'utf8'));
console.log(JSON.stringify({title:site.title,items:data.items.length,issues:data.days.length,latest:data.days.map(x=>x.date).sort().at(-1),entries:{title:'data/site.json',data:'data/products.json',behavior:'src/app.js',styles:'src/styles.css',layout:'src/index.html'},validate:'npm run build',publish:'push main → GitHub Actions → verify changed behavior'},null,2));
