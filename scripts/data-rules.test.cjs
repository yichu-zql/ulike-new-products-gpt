const test=require('node:test'),assert=require('node:assert/strict');const {prepare,validate}=require('./data-rules.cjs');
const base=require('../data/products.json'),policy=require('../data/update-policy.json');
test('legacy baseline remains readable',()=>assert.ok(validate(base).items>=129));
test('duplicate IDs rejected',()=>{const copy=structuredClone(base);copy.items.push(copy.items[0]);assert.throws(()=>validate(copy),/Duplicate/);});
test('short batches do not alter the input',()=>{const before=JSON.stringify(base);assert.throws(()=>prepare(base,{id:'test-short',date:'2026-11-01',checkedAt:'2026-11-01T08:05:00+08:00',added:[]},policy),/医美院线/);assert.equal(JSON.stringify(base),before);});
test('repeated batch is an idempotent no-op',()=>{const copy=structuredClone(base);copy.batches=[{id:'test-repeat'}];assert.equal(prepare(copy,{id:'test-repeat',date:'2026-11-01'},policy).noop,true);});
test('auxiliary device price over 300 rejected',()=>{const copy=structuredClone(base);copy.items[0].shuyuan={primary:'skincare',deviceRole:'auxiliary',deviceTargetPriceCNY:301};assert.throws(()=>validate(copy),/positioning/);});
function fixture(){
 const b=structuredClone(base);b.batches=[];
 const p=structuredClone(policy);p.directionMinimums={};p.recoveryMinimum=0;p.shuyuan.mainMinimum=0;p.shuyuan.secondaryMinimum=0;
 const batch={id:'test-valid',date:'2026-11-01',checkedAt:'2026-11-01T08:05:00+08:00',reviews:b.items.filter(i=>i.launch?.status==='未上市').map(i=>({id:i.id,checked:'2026-11-01',status:'inconclusive',url:i.links[0].url,note:'Checked source; retail status remains unknown.'}))};
 return {b,p,batch};
}
test('inconclusive prelaunch evidence preserves launch status; interests are not reviewed',()=>{const {b,p,batch}=fixture();const result=prepare(b,batch,p);assert.equal(result.noop,false);for(const i of b.items.filter(i=>i.picked&&!i.launch))assert.deepEqual(result.data.items.find(x=>x.id===i.id),i);assert.equal(result.summary.reviews,batch.reviews.length);assert.equal(prepare(result.data,batch,p).noop,true);});
test('missing or blocked prelaunch checks cannot publish',()=>{const {b,p,batch}=fixture();const before=JSON.stringify(b);assert.throws(()=>prepare(b,{...batch,reviews:[]},p),/Review missing/);batch.reviews[0].status='blocked';assert.throws(()=>prepare(b,batch,p),/Review blocked/);assert.equal(JSON.stringify(b),before);});
test('picked-only records cannot be submitted as followups',()=>{const {b,p,batch}=fixture();batch.reviews.push({id:b.items.find(i=>i.picked&&!i.launch).id});assert.throws(()=>prepare(b,batch,p),/Only prelaunch/);});
test('impossible calendar dates rejected',()=>{const b=structuredClone(base);b.items[0].date='2026-02-30';assert.throws(()=>validate(b),/invalid date/);});
