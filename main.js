import './style.css';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {PDFDocument,degrees} from 'pdf-lib-plus-encrypt';
import {createWorker} from 'tesseract.js';
import JSZip from 'jszip';
const $=s=>document.querySelector(s);
pdfjsLib.GlobalWorkerOptions.workerSrc=workerUrl;
let bytes,doc,name='document',cur=0,Z=1.3,tool='edit',ann={},hist=[],redo=[],pend=null,tc={},vp,rt,tok=0,tmp=null,st=null,tt,ai=null,fmt={b:0,i:0,f:'sans'};
const O=$('#oc'),COL=()=>$('#col').value,SZ=()=>+$('#sz').value;
const LS={get(){try{return JSON.parse(localStorage.getItem('spe')||'{}')}catch(e){return{}}},set(o){try{localStorage.setItem('spe',JSON.stringify(o))}catch(e){}}};
const bump=k=>{const d=LS.get();d[k]=(d[k]||0)+1;LS.set(d)};
const esc=s=>s.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2800)}
function show(v){$('#dash').hidden=v!='dash';$('#ed').hidden=v!='ed';$('#dl').hidden=v!='ed';if(v=='dash')dash()}
function dash(){const d=LS.get();$('#st').innerHTML=[['Documents opened',d.o||0],['Edits made',d.e||0],['Downloads',d.d||0]].map(([k,v])=>`<div class="card"><b>${v}</b><span>${k}</span></div>`).join('');
 $('#rc').innerHTML=(d.r||[]).map(r=>`<li><span>${esc(r.n)}</span><em>${r.p} pages · ${new Date(r.t).toLocaleDateString()}</em></li>`).join('')||'<li><em>No documents yet. Upload one to get started.</em></li>'}

async function load(f){if(!f)return;try{bytes=new Uint8Array(await f.arrayBuffer());name=f.name.replace(/\.pdf$/i,'');ann={};hist=[];redo=[];cur=0;show('ed');await reload();
 const d=LS.get();d.o=(d.o||0)+1;d.r=[{n:f.name,p:doc.numPages,t:Date.now()},...(d.r||[])].slice(0,6);LS.set(d)}catch(e){show(doc?'ed':'dash');toast('Could not open this PDF. It may be damaged or password-protected.')}}
async function reload(){doc=await pdfjsLib.getDocument({data:bytes.slice()}).promise;tc={};if(cur>=doc.numPages)cur=doc.numPages-1;if(cur<0)cur=0;await draw();thumbs()}
async function draw(){if(ai)ai(0);const t=++tok,p=await doc.getPage(cur+1);if(rt){rt.cancel();try{await rt.promise}catch(e){}}if(t!=tok)return;
 vp=p.getViewport({scale:Z});const c=$('#pc');c.width=O.width=vp.width;c.height=O.height=vp.height;
 rt=p.render({canvasContext:c.getContext('2d'),viewport:vp});try{await rt.promise}catch(e){return}
 $('#pg').textContent=` ${cur+1} / ${doc.numPages} `;mark();paint()}
async function thumbs(){const s=$('#side');s.innerHTML='';for(let i=0;i<doc.numPages;i++){const p=await doc.getPage(i+1),v=p.getViewport({scale:.2}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
 await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const b=document.createElement('div');b.className='th';b.append(c);const n=document.createElement('span');n.textContent=i+1;b.append(n);b.onclick=()=>go(i);s.append(b)}mark()}
const mark=()=>document.querySelectorAll('.th').forEach((e,i)=>e.classList.toggle('on',i==cur));
function go(i){if(i<0||i>=doc.numPages)return;cur=i;draw()}

function drawAnn(x,a,k){x.save();
 if(a.t=='r'){x.globalAlpha=a.al;x.fillStyle=a.c;x.fillRect(a.x*k,a.y*k,a.w*k,a.h*k)}
 else if(a.t=='x'){x.fillStyle=a.c;x.font=`${a.i?'italic ':''}${a.b?'bold ':''}${a.s*k}px ${FAM[a.f]||FAM.sans}`;x.textBaseline='alphabetic';x.fillText(a.v,a.x*k,a.y*k)}
 else if(a.t=='p'){x.strokeStyle=a.c;x.lineWidth=a.w*k;x.lineCap=x.lineJoin='round';x.beginPath();a.p.forEach((q,i)=>x[i?'lineTo':'moveTo'](q[0]*k,q[1]*k));x.stroke()}
 else if(a.t=='i')x.drawImage(a.im,a.x*k,a.y*k,a.w*k,a.h*k);
 x.restore()}
function paint(){const x=O.getContext('2d');x.clearRect(0,0,O.width,O.height);(ann[cur]||[]).forEach(a=>drawAnn(x,a,Z));if(tmp)drawAnn(x,tmp,Z)}
const cl=a=>Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.slice()])),has=()=>Object.values(ann).some(v=>v.length);
function snap(){hist.push({b:bytes,a:cl(ann),c:cur});if(hist.length>40)hist.shift();redo=[]}
function add(...a){snap();(ann[cur]=ann[cur]||[]).push(...a);bump('e');paint()}
async function restore(h){const nb=h.b!==bytes;bytes=h.b;ann=cl(h.a);cur=h.c;nb?await reload():await draw()}
async function undo(){if(!hist.length)return;redo.push({b:bytes,a:cl(ann),c:cur});await restore(hist.pop())}
async function redoF(){if(!redo.length)return;hist.push({b:bytes,a:cl(ann),c:cur});await restore(redo.pop())}

async function bake(){const ks=Object.keys(ann).filter(k=>ann[k].length);if(!ks.length)return;const d=await PDFDocument.load(bytes),K=3;
 for(const k of ks){const pg=d.getPage(+k),{width:W,height:H}=pg.getSize(),R=((pg.getRotation().angle%360)+360)%360,sw=R%180?H:W,sh=R%180?W:H;
  const c=document.createElement('canvas');c.width=sw*K;c.height=sh*K;const x=c.getContext('2d');ann[k].forEach(a=>drawAnn(x,a,K));
  const png=await d.embedPng(await new Promise(r=>c.toBlob(r)).then(b=>b.arrayBuffer())),o={0:[0,0],90:[W,0],180:[W,H],270:[0,H]}[R];
  pg.drawImage(png,{x:o[0],y:o[1],width:sw,height:sh,rotate:degrees(R)})}
 bytes=await d.save();ann={};tc={}}
async function pageOp(fn,msg){try{snap();await bake();const d=await PDFDocument.load(bytes);await fn(d);bytes=await d.save();await reload();if(msg)toast(msg)}catch(e){toast('That action failed for this PDF.')}}
async function save(fn,data){dlBlob(fn,data);bump('d');toast('Downloaded')}

const FAM={sans:'Helvetica,Arial,sans-serif',serif:'"Times New Roman",Times,serif',mono:'"Courier New",Courier,monospace'},FN={sans:'Sans',serif:'Serif',mono:'Mono'};
function ask(px,py,init,cb,sz){const i=document.createElement('input');i.value=init||'';i.placeholder='Type, then press Enter';
 Object.assign(i.style,{position:'absolute',left:px*Z+'px',top:py*Z+'px',padding:'2px 4px',border:'2px solid #e11d1d',minWidth:'170px',zIndex:5,color:'#000',background:'#fff'});
 const sty=()=>{i.style.font=`${fmt.i?'italic ':''}${fmt.b?'bold ':''}${Math.max(13,Math.min(40,(sz||SZ())*Z))}px ${FAM[fmt.f]}`};
 $('#wrap').append(i);sty();i.focus();i.select();
 const f=ok=>{if(ai!==f)return;ai=null;const v=i.value;i.remove();if(ok&&v)cb(v)};f.sty=sty;ai=f;
 i.onkeydown=e=>{if(e.key=='Enter')f(1);if(e.key=='Escape')f(0)}}
async function items(){if(!tc[cur]){const p=await doc.getPage(cur+1),v=p.getViewport({scale:1}),t=await p.getTextContent();
 tc[cur]=t.items.filter(i=>i.str.trim()).map(i=>{const m=pdfjsLib.Util.transform(v.transform,i.transform);let nm='',fo={};try{fo=p.commonObjs.get(i.fontName)||{};nm=fo.name||''}catch(e){}
  const fa=(t.styles[i.fontName]||{}).fontFamily||'',mono=/courier|mono|consol|typewriter/i.test(nm)||fa=='monospace',sans=/sans|arial|helvet|calibri|verdana|tahoma|segoe|roboto|gothic/i.test(nm),ser=/times|serif|georgia|garamond|palatino|cambria|minion|roman|century|book/i.test(nm);
  return{v:i.str,x:m[4],y:m[5],w:i.width,s:Math.hypot(m[2],m[3]),b:!!fo.bold||/bold|black|heavy|semibold|demi/i.test(nm),i:!!fo.italic||/italic|oblique/i.test(nm),f:mono?'mono':sans?'sans':(ser||(/serif/.test(fa)&&!/sans/.test(fa)))?'serif':'sans'}})}return tc[cur]}
function sample(it){try{const c=$('#pc'),X=Math.max(0,Math.floor(it.x*Z)),Y=Math.max(0,Math.floor((it.y-it.s)*Z)),W=Math.min(c.width-X,Math.ceil(it.w*Z)),H=Math.min(c.height-Y,Math.ceil(it.s*1.2*Z)),d=c.getContext('2d').getImageData(X,Y,W,H).data,h=(r,g,b)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
 const bg=[d[0],d[1],d[2]];let best=0,fg=bg;for(let k=0;k<d.length;k+=4){const q=Math.abs(d[k]-bg[0])+Math.abs(d[k+1]-bg[1])+Math.abs(d[k+2]-bg[2]);if(q>best){best=q;fg=[d[k],d[k+1],d[k+2]]}}
 return[best>90?h(...fg):h(...bg.map(v=>255-v)),h(...bg)]}catch(e){return['#000000','#ffffff']}}

const pt=e=>{const r=O.getBoundingClientRect();return[(e.clientX-r.left)/Z,(e.clientY-r.top)/Z]};
O.onpointerdown=e=>{if(!doc)return;const q=pt(e);
 if(tool=='white'||tool=='hl'){st=q;tmp={t:'r',x:q[0],y:q[1],w:0,h:0,c:tool=='hl'?'#ffd400':'#ffffff',al:tool=='hl'?.4:1}}
 else if(tool=='pen')tmp={t:'p',p:[q],c:COL(),w:Math.max(1,SZ()/6)};else return;O.setPointerCapture(e.pointerId)};
O.onpointermove=e=>{if(!tmp)return;const q=pt(e);if(tmp.t=='r'){tmp.x=Math.min(st[0],q[0]);tmp.y=Math.min(st[1],q[1]);tmp.w=Math.abs(q[0]-st[0]);tmp.h=Math.abs(q[1]-st[1])}else tmp.p.push(q);paint()};
O.onpointerup=()=>{if(!tmp)return;const a=tmp;tmp=null;(a.t=='p'?a.p.length>1:a.w>2&&a.h>2)?add(a):paint()};
O.onclick=async e=>{if(!doc)return;if(ai){ai(1);return}const[x,y]=pt(e);
 if(tool=='text')ask(x,y,'',v=>{const s=SZ();add({t:'x',x,y:y+s*.8,s,v,c:COL(),b:fmt.b,i:fmt.i,f:fmt.f})});
 else if(tool=='edit'){const it=(await items()).find(i=>x>=i.x-2&&x<=i.x+i.w+2&&y>=i.y-i.s&&y<=i.y+i.s*.3);if(!it)return toast('Click directly on existing text. Scanned pages have no text to edit.');
  const[fg,bg]=sample(it);Object.assign(fmt,{b:it.b,i:it.i,f:it.f});$('#col').value=fg;$('#sz').max=Math.max(48,Math.ceil(it.s));$('#sz').value=Math.round(it.s);syncFmt();
  ask(it.x,it.y-it.s,it.v,v=>{const s=SZ();add({t:'r',x:it.x-1,y:it.y-it.s*.95,w:it.w+2,h:it.s*1.25,c:bg,al:1},{t:'x',x:it.x,y:it.y,s,v,c:COL(),b:fmt.b,i:fmt.i,f:fmt.f})},it.s)}
 else if(tool=='img'){if(!pend)return toast('Choose an image or draw a signature first.');const s=SZ(),w=s*10,h=w*pend.height/pend.width;add({t:'i',im:pend,x:x-w/2,y:y-h/2,w,h})}};

function setTool(t){tool=t;document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==t));
 O.style.touchAction=['white','hl','pen'].includes(t)?'none':'auto';O.style.cursor=t=='text'||t=='edit'?'text':'crosshair'}
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{setTool(b.dataset.t);if(b.dataset.t=='img')$('#fi').click()});
$('#fi').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{pend=im;toast('Click on the page to place the image. Use the size slider to scale.')};im.src=r.result};r.readAsDataURL(f)};

const sc=$('#sc'),sx=sc.getContext('2d');let sd=false;sx.lineWidth=3;sx.lineCap='round';
sc.onpointerdown=e=>{sd=true;sc.setPointerCapture(e.pointerId);const r=sc.getBoundingClientRect();sx.strokeStyle=COL();sx.beginPath();sx.moveTo((e.clientX-r.left)*sc.width/r.width,(e.clientY-r.top)*sc.height/r.height)};
sc.onpointermove=e=>{if(!sd)return;const r=sc.getBoundingClientRect();sx.lineTo((e.clientX-r.left)*sc.width/r.width,(e.clientY-r.top)*sc.height/r.height);sx.stroke()};sc.onpointerup=()=>sd=false;
$('#sig').onclick=()=>{sx.clearRect(0,0,sc.width,sc.height);$('#sg').hidden=false};$('#sx').onclick=()=>sx.clearRect(0,0,sc.width,sc.height);$('#sn').onclick=()=>$('#sg').hidden=true;
$('#so').onclick=()=>{const im=new Image();im.onload=()=>{pend=im;$('#sg').hidden=true;setTool('img');toast('Click on the page to place your signature.')};im.src=sc.toDataURL()};

$('#up').onclick=$('#up2').onclick=()=>$('#f').click();$('#f').onchange=e=>{load(e.target.files[0]);e.target.value=''};
$('#hd').onclick=()=>show('dash');
const dz=$('#dz');dz.ondragover=e=>{e.preventDefault();dz.classList.add('hv')};dz.ondragleave=()=>dz.classList.remove('hv');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('hv');load(e.dataTransfer.files[0])};
$('#un').onclick=undo;$('#re').onclick=redoF;$('#zi').onclick=()=>{Z=Math.min(3,Z+.2);doc&&draw()};$('#zo').onclick=()=>{Z=Math.max(.5,Z-.2);doc&&draw()};
$('#pv').onclick=()=>go(cur-1);$('#nx').onclick=()=>go(cur+1);
$('#ro').onclick=()=>pageOp(d=>{const p=d.getPage(cur);p.setRotation(degrees((p.getRotation().angle+90)%360))});
$('#de').onclick=()=>doc.numPages<2?toast('A PDF needs at least one page.'):pageOp(d=>d.removePage(cur));
$('#mu').onclick=()=>cur>0&&pageOp(async d=>{const[c]=await d.copyPages(d,[cur]);d.insertPage(cur-1,c);d.removePage(cur+1);cur--});
$('#md').onclick=()=>cur<doc.numPages-1&&pageOp(async d=>{const[c]=await d.copyPages(d,[cur]);d.insertPage(cur+2,c);d.removePage(cur);cur++});
$('#ab').onclick=()=>pageOp(d=>{const s=d.getPage(cur).getSize();d.insertPage(cur+1,[s.width,s.height]);cur++});
$('#mg').onclick=()=>$('#fm').click();
$('#fm').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const buf=await f.arrayBuffer();pageOp(async d=>{const o=await PDFDocument.load(buf),ps=await d.copyPages(o,o.getPageIndices());ps.forEach(p=>d.addPage(p))},'PDF merged at the end')};
$('#dl').onclick=async()=>{try{if(ai)ai(1);if(has())snap();await bake();await reload();save(`${name}-edited.pdf`,bytes)}catch(e){toast('Could not build the PDF.')}};
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key=='z'&&!/INPUT/.test(document.activeElement.tagName)){e.preventDefault();e.shiftKey?redoF():undo()}});
setTool('edit');dash();

/* ---- extra tools: download helper, extract, split, OCR, compress, protect ---- */
function dlBlob(fn,data,type='application/pdf'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=fn;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const bakeR=async()=>{if(!has())return;snap();await bake();await reload()};
function ranges(s,n){const o=new Set();s.split(',').forEach(p=>{const m=p.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)return;let a=+m[1],b=+(m[2]||m[1]);if(a>b)[a,b]=[b,a];for(let i=Math.max(1,a);i<=Math.min(n,b);i++)o.add(i-1)});return[...o].sort((a,b)=>a-b)}
$('#ex').onclick=async()=>{if(!doc)return;const s=prompt(`Pages to extract, e.g. 1-3,5 (this PDF has ${doc.numPages} pages)`,String(cur+1));if(!s)return;
 try{await bakeR();const d=await PDFDocument.load(bytes),ix=ranges(s,doc.numPages);if(!ix.length)return toast('No valid pages found.');const n=await PDFDocument.create();(await n.copyPages(d,ix)).forEach(p=>n.addPage(p));save(`${name}-pages.pdf`,await n.save())}catch(e){toast('Could not extract pages.')}};
$('#sp').onclick=async()=>{if(!doc)return;try{await bakeR();const d=await PDFDocument.load(bytes),z=new JSZip();
 for(let i=0;i<d.getPageCount();i++){const n=await PDFDocument.create(),[p]=await n.copyPages(d,[i]);n.addPage(p);z.file(`${name}-page-${i+1}.pdf`,await n.save())}
 dlBlob(`${name}-split.zip`,await z.generateAsync({type:'blob'}),'application/zip');bump('d');toast('Split into one PDF per page')}catch(e){toast('Could not split this PDF.')}};
let wk;
$('#ocr').onclick=async()=>{if(!doc)return;const b=$('#ocr');b.disabled=true;
 try{toast('Reading the page. The first run downloads language data.');wk=wk||await createWorker('eng');const S=2,p=await doc.getPage(cur+1),v=p.getViewport({scale:S}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
  await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const{data}=await wk.recognize(c);
  tc[cur]=data.lines.filter(l=>l.text.trim()).map(l=>{const h=(l.bbox.y1-l.bbox.y0)/S;return{v:l.text.trim(),x:l.bbox.x0/S,y:l.bbox.y1/S-h*.2,w:(l.bbox.x1-l.bbox.x0)/S,s:h*.85,b:false,i:false,f:'sans'}});
  setTool('edit');toast(`Found ${tc[cur].length} lines. Use Edit text and click a line to change it.`)}catch(e){toast('OCR failed. Check your internet connection and try again.')}b.disabled=false};
$('#cp').onclick=async()=>{if(!doc)return;try{await bakeR();toast('Compressing…');const n=await PDFDocument.create();
 for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),v=p.getViewport({scale:1.5}),o=p.getViewport({scale:1}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
  await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const j=await n.embedJpg(await new Promise(r=>c.toBlob(r,'image/jpeg',.6)).then(x=>x.arrayBuffer()));n.addPage([o.width,o.height]).drawImage(j,{x:0,y:0,width:o.width,height:o.height})}
 const out=await n.save(),kb=x=>Math.round(x/1024)+' KB';if(out.length>=bytes.length)return toast('This PDF is already small. Compression would not help.');
 dlBlob(`${name}-compressed.pdf`,out);bump('d');toast(`${kb(bytes.length)} to ${kb(out.length)}. Text in the compressed copy is no longer selectable.`)}catch(e){toast('Could not compress this PDF.')}};
$('#pw').onclick=async()=>{if(!doc)return;const pw=prompt('Set a password for the downloaded PDF');if(!pw)return;
 try{await bakeR();const d=await PDFDocument.load(bytes);d.encrypt({userPassword:pw,ownerPassword:crypto.randomUUID(),permissions:{printing:'highResolution',copying:true,modifying:false,annotating:false}});save(`${name}-protected.pdf`,await d.save())}catch(e){toast('Could not protect this PDF.')}};

/* ---- font style controls ---- */
function syncFmt(){$('#bo').classList.toggle('on',!!fmt.b);$('#it').classList.toggle('on',!!fmt.i);$('#ff').textContent=FN[fmt.f];if(ai)ai.sty()}
['#bo','#it','#ff'].forEach(q=>$(q).onmousedown=e=>e.preventDefault());
$('#bo').onclick=()=>{fmt.b=!fmt.b;syncFmt()};$('#it').onclick=()=>{fmt.i=!fmt.i;syncFmt()};$('#ff').onclick=()=>{fmt.f={sans:'serif',serif:'mono',mono:'sans'}[fmt.f];syncFmt()};
$('#col').oninput=()=>{if(ai)ai.sty()};syncFmt();
