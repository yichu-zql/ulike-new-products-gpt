const assert=require('node:assert/strict');
const allowed=['医美院线家用化','海外热门','销量起量','需求未满足','线下热销线上未起量'];
const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const url=x=>{try{return ['http:','https:'].includes(new URL(x).protocol);}catch{return false;}};
function validate(data){
 assert(Array.isArray(data.items)&&Array.isArray(data.days),'Invalid data shape');const ids=new Set(),names=new Set();
 for(const i of data.items){
  assert(/^[a-z0-9-]+$/i.test(i.id)&&!ids.has(i.id),'Duplicate/invalid ID '+i.id);ids.add(i.id);
  const name=i.name?.replace(/[\s（）()·「」]/g,'').toLowerCase();assert(name&&!names.has(name),'Duplicate name '+i.name);names.add(name);
  for(const k of ['name','category','reason','audience','points','why'])assert(typeof i[k]==='string'&&i[k].trim(),i.id+' missing '+k);
  assert(date(i.date)&&allowed.includes(i.direction),i.id+' invalid date/direction');
  assert(['推荐','谨慎推荐','观望'].includes(i.market?.verdict),i.id+' verdict');assert(['第一梯队','第二梯队','第三梯队','暂无统计'].includes(i.market?.tier),i.id+' tier');
  for(const k of ['brands','tech','platforms','links'])assert(Array.isArray(i[k]),i.id+' '+k);
  assert(i.links.length&&i.links.every(l=>url(l.url)),i.id+' missing source');
  assert((i.market.sources||[]).every(s=>url(s.url)&&s.title),i.id+' invalid market source');
  if(i.evidence)assert(i.evidence.length&&i.evidence.every(e=>url(e.url)&&e.claim&&date(e.checked)),i.id+' invalid evidence');
  if(i.shuyuan){const s=i.shuyuan;assert(s.primary==='skincare'&&s.deviceRole==='auxiliary'&&s.deviceTargetPriceCNY>0&&s.deviceTargetPriceCNY<=300&&s.priceStatus&&s.idInnovation&&s.problem,i.id+' positioning');assert(i.concept?.primary==='skin',i.id+' skincare must lead');}
  if(i.img)assert(!i.img.includes('..')&&i.img.startsWith('assets/images/'),i.id+' unsafe image path');
  if(i.decision){
   assert(['优先推进','定向验证','暂缓'].includes(i.decision.level),i.id+' invalid decision level');
   assert(date(i.decision.checked),i.id+' invalid decision date');
   for(const key of ['reason','gap','next','criteria'])assert(typeof i.decision[key]==='string'&&i.decision[key].trim(),i.id+' missing decision '+key);
   assert(i.img&&['reference','concept'].includes(i.imageKind),i.id+' decision requires a labeled image');
   for(const key of ['size','growth','demand'])assert(i.market[key]?.trim(),i.id+' missing market '+key);
  }
 }
 const dayIds=new Set();for(const d of data.days){assert(date(d.date)&&!dayIds.has(d.date),'Duplicate/invalid issue date');dayIds.add(d.date);for(const b of d.brief||[]){assert(url(b.url),'Invalid brief source');for(const id of b.items||[])assert(ids.has(id),'Broken reference '+id);}}
 return {items:data.items.length,issues:data.days.length};
}
function prepare(base,batch,policy){
 assert(date(batch.date)&&batch.id,'Batch ID and date required');if((base.batches||[]).some(b=>b.id===batch.id))return {noop:true,data:base};
 assert(typeof batch.checkedAt==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(batch.checkedAt)&&!isNaN(Date.parse(batch.checkedAt)),'Timestamp with timezone required');
 const data=structuredClone(base),existing=new Map(data.items.map(i=>[i.id,i])),added=batch.added||[],revised=batch.revisions||[],changed=[...added,...revised],used=new Set();
 for(const i of changed){assert(!used.has(i.id),'Duplicate batch ID '+i.id);used.add(i.id);assert(i.evidence?.some(e=>e.checked===batch.date),'Current evidence required '+i.id);}
 for(const i of added){assert(!existing.has(i.id),'Existing product must be revised '+i.id);assert(i.date===batch.date,'New item date mismatch');data.items.push(i);}
 for(const i of revised){assert(existing.has(i.id),'Missing revision target '+i.id);assert(i.date===existing.get(i.id).date,'Original date must be retained');data.items[data.items.findIndex(x=>x.id===i.id)]=i;}
 const counts=Object.fromEntries(Object.keys(policy.directionMinimums).map(k=>[k,added.filter(i=>i.direction===k).length]));
 for(const [k,min]of Object.entries(policy.directionMinimums))assert(counts[k]>=min,`${k}: ${counts[k]}/${min}`);
 assert(added.filter(i=>policy.recoveryCategories.includes(i.category)).length>=policy.recoveryMinimum,'Recovery quota unmet');
 const sy=changed.filter(i=>i.shuyuan);assert(sy.filter(i=>i.rank==='主推').length>=policy.shuyuan.mainMinimum,'Shuyuan primary quota unmet');assert(sy.filter(i=>i.rank==='次推').length>=policy.shuyuan.secondaryMinimum,'Shuyuan secondary quota unmet');
 for(const i of added)assert(i.decision?.checked===batch.date,i.id+' requires a current selection decision');
 for(const i of added.filter(i=>i.direction===policy.offlineDirection))assert(i.channelEvidence?.offlineSales&&i.channelEvidence?.onlineScope&&i.channelEvidence?.onlineEvidence,'Offline/online comparative evidence required');
 const reviews=batch.reviews||[],required=base.items.filter(i=>i.launch?.status==='未上市');
 for(const i of required){const r=reviews.find(r=>r.id===i.id);assert(r&&r.checked===batch.date&&url(r.url)&&r.note&&['verified','inconclusive','blocked'].includes(r.status),'Review missing '+i.id);assert(r.status!=='blocked','Review blocked '+i.id);}
 assert(new Set(reviews.map(r=>r.id)).size===reviews.length,'Duplicate review');
 for(const r of reviews){const item=data.items.find(i=>i.id===r.id);assert(required.some(i=>i.id===r.id),'Only prelaunch items may enter review queue');item.lastReview=r;}
 const day={date:batch.date,brief:batch.brief||[]},index=data.days.findIndex(d=>d.date===batch.date);if(index<0)data.days.push(day);else data.days[index]=day;
 data.batches=[...(data.batches||[]),{id:batch.id,date:batch.date,added:added.map(i=>i.id),revised:revised.map(i=>i.id),reviews:reviews.length,counts}];
 data.meta={schemaVersion:2,dataThrough:batch.date,checkedAt:batch.checkedAt,sourceBatch:batch.id};validate(data);return {noop:false,data,summary:data.batches.at(-1)};
}
module.exports={validate,prepare};
