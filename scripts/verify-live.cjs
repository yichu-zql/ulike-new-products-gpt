const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const root=path.resolve(__dirname,'../dist');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function main(){
 const files=['index.html','assets/app.js','assets/styles.css','assets/data.js','release.json'];
 const results=await Promise.all(files.map(async f=>{const r=await fetch('https://yichu-zql.github.io/ulike-new-products-gpt/'+f+'?release='+process.env.GITHUB_SHA,{signal:AbortSignal.timeout(30000)});const b=Buffer.from(await r.arrayBuffer());if(!r.ok||hash(b)!==hash(fs.readFileSync(path.join(root,f))))throw Error('Live mismatch: '+f);return f;}));
 console.log('Verified live release: '+results.join(', '));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
