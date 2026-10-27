// app.js = LOGIKA SAJA. Semua tulisan ada di index.html (bagian <template>).
(()=>{
const C=window.AD_CONFIG,$=s=>document.querySelector(s),R=matchMedia('(prefers-reduced-motion:reduce)').matches;
const LS=localStorage,TK='ad_token',PK='ad_pending',fx=$('#fx');let running=false;
const lines=id=>[...$('#'+id).content.children].map(e=>({t:e.textContent.trim(),c:e.className}));
const pick=(id,k)=>$('#'+id).content.querySelector('[data-k="'+k+'"]').textContent.trim();
const tx=k=>pick('t-fx',k),NARR=lines('t-narr'),INIT=lines('t-init');
// sleep berhenti selama tab tersembunyi: narasi tidak pernah terlewat.
const sleep=ms=>new Promise(r=>setTimeout(r,ms)).then(()=>document.hidden?new Promise(r=>{const f=()=>{if(!document.hidden){removeEventListener('visibilitychange',f);r()}};addEventListener('visibilitychange',f)}):0);
async function api(a,p){try{const h={'content-type':'application/json',apikey:C.key};if(C.key.startsWith('eyJ'))h.authorization='Bearer '+C.key;const r=await fetch(C.url.replace(/\/$/,'')+'/rest/v1/rpc/'+a,{method:'POST',headers:h,body:JSON.stringify(p)});const j=await r.json();return r.ok?j:{error:1}}catch{return{error:1}}}
async function logs(el,L,gap,cls){for(const l of L){const e=document.createElement('div');e.textContent=l;if(cls)e.className=cls;el.appendChild(e);await sleep(gap)}}
function showStage(){$('#gate').hidden=true;const s=$('#stage');s.hidden=false;s.className='';s.style.visibility='';$('#log').innerHTML='';$('#log').className='mono';$('#doc').innerHTML='';fx.innerHTML=''}
async function init(){await logs($('#log'),INIT.map(x=>x.t),R?500:750);await sleep(1200);$('#log').classList.add('off')}
async function narrative(){const d=$('#doc');
 for(const n of NARR){const p=document.createElement('p');p.className=n.c;d.appendChild(p);
  for(const ch of n.t){p.textContent+=ch;d.scrollTop=d.scrollHeight;await sleep(24)}
  await sleep(900+n.t.split(' ').length*230)}}
// ---- efek glitch ----
const CH='▒░█#%/\\|',mk=(c,t)=>{const e=document.createElement('div');e.className=c;e.textContent=t;return e};
const cor=(t,p)=>[...t].map(c=>c!==' '&&Math.random()<p?CH[Math.random()*CH.length|0]:c).join('');
function band(e){const s=+e.dataset.s,y=Math.random()*100,h=4+Math.random()*28;e.style.transform=`translate(${(Math.random()-.5)*s}vw,${(Math.random()-.5)*s*.6}vh)`;e.style.clipPath=`inset(${y}% 0 ${Math.max(0,100-y-h)}% 0)`}
function ghosts(t,n,s,p){n=R?Math.ceil(n/3):n;for(let i=0;i<n;i++){const e=mk('g',cor(t,p*i/n));e.dataset.s=s;e.style.top=(10+Math.random()*75)+'%';e.style.left=(5+Math.random()*30)+'%';band(e);fx.appendChild(e)}}
const jit=ms=>new Promise(r=>{const t0=performance.now();let l=0;(function f(t){if(t-t0>ms)return r();if(t-l>(R?160:70)){l=t;fx.querySelectorAll('.g').forEach(band)}requestAnimationFrame(f)})(t0)});
const shake=ms=>{document.body.classList.add('shake');return sleep(ms).then(()=>document.body.classList.remove('shake'))};
async function destruction(){
 const st=$('#stage');st.classList.add('dim');await sleep(2300);await shake(160);
 const lg=mk('flog','');fx.appendChild(lg);                                     // A
 await logs(lg,[tx('start')],600);
 await logs(lg,[tx('c100'),tx('witness'),tx('memory')],300,'red');
 lg.classList.add('tear');for(let i=0;i<8;i++)await logs(lg,[tx('c100'),tx('memory')],70,'red');
 await sleep(400);fx.innerHTML='';st.style.visibility='hidden';
 const name=tx('name'),big=mk('big',name);fx.appendChild(big);await sleep(1000);  // B
 ghosts(name,10,40,.5);await jit(1800);
 big.textContent=cor(name,.4);ghosts(name,14,90,.8);await jit(900);await shake(400);fx.innerHTML='';
 for(let i=0;i<5;i++){const e=mk('big',cor(tx('fatal'),i*.17));e.style.top=(16+i*14)+'%';fx.appendChild(e);await sleep(280)} // C
 await sleep(500);fx.appendChild(mk('big',tx('sysfail'))).style.color='var(--rd)';await sleep(700);
 fx.querySelectorAll('.big').forEach(e=>e.style.transform=`translate(-50%,-50%) translateX(${(Math.random()-.5)*60}vw)`);
 ghosts(tx('sysfail'),12,100,.6);ghosts(tx('fatal'),12,100,.8);shake(700);await jit(900);fx.innerHTML='';await sleep(400);
 const o=mk('big',tx('offline1'));fx.appendChild(o);await sleep(1000);          // D
 ghosts(tx('offline1'),5,20,.3);await jit(450);fx.querySelectorAll('.g').forEach(e=>e.remove());
 o.textContent=tx('offline2');await sleep(900);o.textContent=tx('off');await sleep(1000);
 ghosts(tx('off'),18,100,.9);await shake(260);await jit(350);fx.innerHTML='';
 document.body.classList.add('black');await sleep(6000)}                         // E
async function finish(){const t=LS.getItem(TK);if(t){LS.setItem(PK,t);LS.removeItem(TK)}
 const tok=LS.getItem(PK);if(!tok)return;
 for(;;){const r=await api('ad_complete',{p_token:tok});if(!r.error)break;await sleep(5000)}  // coba lagi bila offline
 LS.removeItem(PK)}
async function play(){if(running)return;running=true;showStage();
 const hb=setInterval(()=>{const t=LS.getItem(TK);if(t)api('ad_resume',{p_token:t})},60000);
 try{await init();await narrative();await sleep(3000);await destruction()}finally{clearInterval(hb);running=false}}
async function begin(){await play();await finish()}
// ---- halaman kode ----
async function submit(){const b=$('#go'),m=$('#msg'),code=$('#code').value.trim();if(!code||b.disabled)return;b.disabled=true;m.textContent='';
 const r=await api('ad_start',{p_code:code});
 if(r.ok&&r.token){LS.setItem(TK,r.token);try{await document.documentElement.requestFullscreen()}catch{}begin();return}
 m.textContent=pick('t-msg',r.reason==='used'?'used':r.error?'error':'denied');
 await sleep(1200);b.disabled=false}
$('#go').onclick=submit;$('#code').onkeydown=e=>{if(e.key==='Enter')submit()};
(async()=>{ // pemulihan sesi saat reload / buka ulang browser
 if(LS.getItem(PK)){$('#gate').hidden=true;document.body.classList.add('black');await finish();return}
 const t=LS.getItem(TK);if(t){const r=await api('ad_resume',{p_token:t});if(r.ok){begin();return}if(!r.error)LS.removeItem(TK)}
})();
})();
