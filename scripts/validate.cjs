const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file), 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const data = JSON.parse(read('data/products.json'));
const provenance = JSON.parse(read('data/provenance.json'));
const ids = new Set();
for (const item of data.items) {
  assert.match(item.id,/^[a-z0-9-]+$/i);
  assert(!ids.has(item.id),`Duplicate ID: ${item.id}`); ids.add(item.id);
  for (const key of ['name','date','category','reason','audience','points','why']) assert(item[key],`${item.id}: missing ${key}`);
  assert.match(item.date,/^\d{4}-\d{2}-\d{2}$/);
  assert(['推荐','谨慎推荐','观望'].includes(item.market.verdict));
  assert(['第一梯队','第二梯队','第三梯队','暂无统计'].includes(item.market.tier));
  for (const link of [...item.links,...(item.market.sources||[]),...(item.launch?.sources||[])]) assert(['http:','https:'].includes(new URL(link.url).protocol));
}
for (const day of data.days) for (const brief of day.brief) for (const id of brief.items||[]) assert(ids.has(id),`Missing brief reference ${id}`);
const restored = structuredClone(data);
for (const entry of provenance.images) {
  const bytes = fs.readFileSync(path.join(root,entry.path));
  assert.equal(hash(bytes),entry.sha256,`Image changed: ${entry.id}`);
  const item = restored.items.find(x=>x.id===entry.id);
  assert.equal(item.img,entry.path);
  item.img = `data:${entry.mime};base64,${bytes.toString('base64')}`;
}
assert.equal(hash(JSON.stringify(restored)),provenance.sourceDataSHA256,'Source data parity changed; review and update provenance for an intentional data revision');
assert.equal(hash(read('src/styles.css')),provenance.sourceCSSSHA256,'Source visual styling changed');
const sourceApp = read('src/app.js').replace(': SITE_TITLE;', ': "机会新品库";').replaceAll('"ulike-new-products-gpt:view:v1"','"oppview"').replaceAll('数据截至2026-10-28','每周一上午8:05更新');
assert.equal(hash(sourceApp),provenance.sourceAppSHA256,'Source behavior changed');
new vm.Script(read('src/app.js'));
assert.equal(data.items.length,129);
assert.equal(data.days.length,8);
assert.equal(data.items.filter(x=>x.rank).length,17);
assert.equal(data.items.filter(x=>x.rank==='主推').length,5);
assert.equal(data.items.filter(x=>x.launch?.status==='未上市').length,2);
assert.equal(data.items.filter(x=>x.picked).length,17);
console.log('PASS: 129 records, 8 issues, 127 lossless images, references, source data/CSS/behavior parity and JS syntax.');
