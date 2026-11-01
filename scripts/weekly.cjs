const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const root=path.resolve(__dirname,'..');const {prepare}=require('./data-rules.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));const mode=process.argv[2]||'context',data=read('data/products.json'),policy=read('data/update-policy.json');
if(mode==='context'){
 console.log(JSON.stringify({policy,lastBatch:data.batches?.at(-1)||null,existing:data.items.map(i=>[i.id,i.name]),interestProfile:require('./interest-profile.cjs').summarize(data),reviewQueue:data.items.filter(i=>i.launch?.status==='未上市').map(i=>({id:i.id,name:i.name,url:i.image_page||i.links[0]?.url,lastReview:i.lastReview||null}))},null,2));
}else if(['check','apply'].includes(mode)){
 const file=path.resolve(process.argv[3]||'');if(!fs.existsSync(file))throw Error('Provide candidate JSON path');const raw=fs.readFileSync(path.join(root,'data/products.json')),batch=JSON.parse(fs.readFileSync(file,'utf8')),result=prepare(data,batch,policy);
 if(result.noop){console.log('NOOP: already applied '+batch.id);process.exit(0);}
 if(mode==='apply'){
  const lock=path.join(root,'.weekly.lock'),fd=fs.openSync(lock,'wx');
  try{if(!raw.equals(fs.readFileSync(path.join(root,'data/products.json'))))throw Error('Data changed during preparation');const dir=path.join(root,'data/releases');fs.mkdirSync(dir,{recursive:true});const backup=path.join(dir,crypto.createHash('sha256').update(raw).digest('hex')+'.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,raw);const temp=path.join(root,'data/products.next.json');fs.writeFileSync(temp,JSON.stringify(result.data,null,2)+'\n');fs.renameSync(temp,path.join(root,'data/products.json'));}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
 }
 console.log(JSON.stringify({mode,...result.summary}));
}else throw Error('Use context, check or apply');
