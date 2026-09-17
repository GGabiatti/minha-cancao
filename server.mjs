import http from 'node:http';import {readFile,writeFile,rename} from 'node:fs/promises';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve('dist');const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1:4173').pathname);
if(pathname==='/api/content'){
 if(req.method!=='POST'||req.headers.origin!=='http://127.0.0.1:4173'||req.headers.host!=='127.0.0.1:4173'||req.headers['content-type']!=='application/json'){res.writeHead(403);return res.end()}
 let body='';for await(const chunk of req){body+=chunk;if(body.length>50000){res.writeHead(413);return res.end()}}
 const {faq}=JSON.parse(body);if(!Array.isArray(faq)||faq.length!==9||!faq.every(x=>Array.isArray(x)&&x.length===2&&x.every(v=>typeof v==='string'&&v.length>0&&v.length<=3000))){res.writeHead(400);return res.end()}
 const context={window:{}};vm.runInNewContext(await readFile(path.join(root,'content.js'),'utf8'),context,{timeout:500});context.window.SITE_CONTENT.faq=faq;const dest=path.join(root,'content.js');await writeFile(dest+'.tmp','window.SITE_CONTENT = '+JSON.stringify(context.window.SITE_CONTENT,null,2)+';\n');await rename(dest+'.tmp',dest);res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"saved":true}')
}
if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}if(pathname==='/admin')file=path.join(root,'admin.html');else if(!path.extname(file))file=path.join(root,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data)}catch{res.writeHead(404);res.end('Página não encontrada')}}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
