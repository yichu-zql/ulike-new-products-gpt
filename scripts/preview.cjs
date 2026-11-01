const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const prefix = '/ulike-new-products-gpt/';
http.createServer((req,res)=>{
  let url;
  try {url = decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400).end();return;}
  if(url==='/') {res.writeHead(302,{Location:prefix}).end();return;}
  if(!url.startsWith(prefix)) {res.writeHead(404).end();return;}
  const file = path.resolve(root,url.slice(prefix.length)||'index.html');
  if(!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/ulike-new-products-gpt/'));
