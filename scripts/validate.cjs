const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const {validate}=require('./data-rules.cjs');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8'));
const result=validate(data);for(const i of data.items)if(i.img)assert(fs.existsSync(path.join(root,i.img)),'Missing image '+i.id);
const site=JSON.parse(fs.readFileSync(path.join(root,'data/site.json'),'utf8'));assert(typeof site.title==='string'&&site.title.trim(),'Missing title');
new vm.Script(fs.readFileSync(path.join(root,'src/app.js'),'utf8'));
console.log('PASS: '+JSON.stringify(result)+'; IDs, fields, evidence, links, images and script syntax. Original provenance retained separately.');
