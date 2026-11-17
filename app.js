
const $=s=>document.querySelector(s),K='myenglish.v1';
let db;try{db=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!db||!Array.isArray(db.cols))db={cols:[],subs:[],items:[]};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(db))}catch(e){alert('Could not save data. Check available storage.')}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hl=(s,q)=>{s=String(s||'');const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');return s.split(re).map((p,i)=>i%2?'<mark>'+esc(p)+'</mark>':esc(p)).join('')};
const ICONS=['✧','♡','♥','☆','✦','📚','📖','🌿','🌸','🦋','☁️','🌙','⭐','💌','🪞','🕯️','🎀','🍓','🪻','🧸','🗝️','🪐','🫧','🖋️','💫'];
const COLS=['#E5EBE5','#EEE7E2','#EAE8EF','#EFEDE4'];
let st={col:null,sub:null,note:null,q:''},tm;
const desc=id=>[id,...db.subs.filter(s=>s.parentId===id).flatMap(s=>desc(s.id))];
const cnt=(c,s)=>{const ids=s&&desc(s);return db.items.filter(i=>i.col===c&&(!ids||ids.includes(i.sub))).length};
const empty=(i,t,s)=>`<div class=empty><div>${i}</div><b>${t}</b>${s}</div>`;

function go(c,s,n){
 st.col=c||null;st.sub=s||null;st.note=n||null;
 scrollTo(0,0);render();
}

function render(){
 const A=$('#app');
 $('.fab').style.display=st.note?'none':'';
 st.note?noteView(A):st.col?colView(A):homeView(A);
}

function back(){
 if(st.note){
  sv();
  const n=db.items.find(i=>i.id==st.note);
  if(n&&!n.t.trim()&&!n.c.trim()){
   db.items=db.items.filter(i=>i!=n);save();
  }
  st.note=null;
 }else if(st.sub){
  const s=db.subs.find(x=>x.id==st.sub);
  st.sub=s&&s.parentId||null;
 }else st.col=null;
 scrollTo(0,0);render();
}

/* sheets & forms */

function sheet(h,extraClass=''){
 close();
 const o=document.createElement('div');
 o.className='ov';
 o.innerHTML='<div class="sh '+extraClass+'"><i class=grab></i>'+h+'</div>';
 o.onclick=e=>{if(e.target===o)close()};
 document.body.appendChild(o);
}

function close(){
 document.querySelectorAll('.ov').forEach(o=>o.remove());
}

function form(title,F,v,ok,del){
 const h=F.map(f=>{
  const x=v[f.k]!=null?v[f.k]:(f.d||'');

  if(f.t==='icons'){
   return `<div class=lb>${f.l}</div>
   <div class=icon-choice>
    <button type=button class=emoji-trigger>
     <span class=chosen-emoji>${esc(x)}</span>
     <span>Choose an icon</span>
     <span class=emoji-arrow>›</span>
    </button>
   </div>
   <input type=hidden name="${f.k}" value="${esc(x)}">`;
  }

  if(f.t==='cols'){
   return `<div class=lb>${f.l}</div>
   <div class="pick cols" data-k="${f.k}">
    ${f.o.map(o=>`<button type=button data-v="${esc(o)}" class="${o===x?'sel':''}" style="background:${o}"></button>`).join('')}
   </div>
   <input type=hidden name="${f.k}" value="${esc(x)}">`;
  }

  return `<label class=lb>${f.l}
   ${f.t==='area'
    ?`<textarea name="${f.k}" rows=3>${esc(x)}</textarea>`
    :`<input type=text name="${f.k==='name'?'entry-title':f.k}" value="${esc(x)}" ${f.req?'required':''} autocomplete=off autocorrect=on autocapitalize=words spellcheck=true inputmode=text>`}
  </label>`;
 }).join('');

 const emojiScreen=`
 <div class=emoji-screen hidden>
  <div class=emoji-head>
   <button type=button class=emoji-back>‹ Back</button>
   <b>Choose an icon</b>
  </div>
  <div class=emoji-grid>
   ${ICONS.map(o=>`<button type=button class=emoji-option data-emoji="${esc(o)}">${o}</button>`).join('')}
  </div>
 </div>`;

 const aiType=F.some(f=>f.k==='ipa')?'word':
              F.some(f=>f.k==='n')?'phrase':null;

 sheet(`<h2>${title}</h2><div class=fields>${h}
   ${aiType?'<button type=button class="btn ghost" id=ai-fill>✨ Generate with AI</button>':''}
   <button type=button class=btn id=save-form>Save</button>
   ${del?'<button type=button class="btn ghost danger" id=del>Delete</button>':''}
  </div>${emojiScreen}`,title.toLowerCase().includes('phrase')?'phrase-sheet':'');

 const sh=$('.sh');
 const fm=sh.querySelector('.fields');
 const ep=sh.querySelector('.emoji-screen');

 fm.onclick=e=>{
  const emoji=e.target.closest('.emoji-trigger');
  if(emoji){
   fm.hidden=true;
   ep.hidden=false;
   return;
  }

  const b=e.target.closest('.pick.cols button');
  if(!b)return;

  const p=b.parentNode;
  p.querySelectorAll('button').forEach(z=>z.classList.remove('sel'));
  b.classList.add('sel');

  const input=fm.querySelector(`[name="${p.dataset.k}"]`);
  if(input)input.value=b.dataset.v;
 };

 ep.onclick=e=>{
  if(e.target.closest('.emoji-back')){
   ep.hidden=true;
   fm.hidden=false;
   return;
  }

  const b=e.target.closest('.emoji-option');
  if(!b)return;

  const input=fm.querySelector('[name="icon"]');
  if(input)input.value=b.dataset.emoji;

  fm.querySelector('.chosen-emoji').textContent=b.dataset.emoji;
  ep.hidden=true;
  fm.hidden=false;
 };

 if(aiType){
  $('#ai-fill').onclick=async()=>{
   const button=$('#ai-fill');
   const input=fm.querySelector('[name="t"]');
   const word=input.value.trim();

   if(!word){
    input.focus();
    return;
   }

   button.disabled=true;
   button.textContent='Generating...';

   try{
    const response=await fetch('https://friendly-muffin-6bf19e.netlify.app/.netlify/functions/ai',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({type:aiType,text:word})
    });

    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Something went wrong');

    const set=(name,value)=>{
     const field=fm.querySelector(`[name="${name}"]`);
     if(field&&value)field.value=value;
    };

    set('m',data.translation);

    if(aiType==='word'){
     set('ipa',data.ipa);
     set('ex',data.example);
     set('et',data.exampleTranslation);
    }
   }catch(error){
    alert(error.message||'Could not get an AI response. Please try again.');
   }finally{
    button.disabled=false;
    button.textContent='✨ Generate with AI';
   }
  };
 }

 $('#save-form').onclick=()=>{
  const d={};

  F.forEach(f=>{
   const key=f.k==='name'?'entry-title':f.k;
   const input=fm.querySelector(`[name="${key}"]`);
   d[f.k]=input?input.value.trim():'';
  });

  if(F.some(f=>f.req&&!d[f.k]))return;

  ok(d);
  save();
  close();
  render();
 };

 if(del)$('#del').onclick=()=>{
  if(confirm('Delete? All its contents will also be deleted. This action cannot be undone.')){
   del();
   save();
   close();
   render();
  }
 };
}

function colForm(id){
 const c=id&&db.cols.find(x=>x.id==id);
 form(c?'Edit collection':'New collection',[
  {k:'name',l:'Name',req:1},
  {k:'icon',l:'Icon',t:'icons',o:ICONS,d:'✧'},
  {k:'color',l:'Color',t:'cols',o:COLS,d:COLS[0]}
 ],c||{},
 d=>{c?Object.assign(c,d):db.cols.push({id:uid(),...d,createdAt:Date.now()})},
 c&&(()=>{
  db.items=db.items.filter(i=>i.col!=c.id);
  db.subs=db.subs.filter(s=>s.col!=c.id);
  db.cols=db.cols.filter(x=>x!=c);
  st.col=st.sub=null;
 })
 );
}

function subForm(id){
 const s=id&&db.subs.find(x=>x.id==id);
 form(s?'Rename subcategory':'New subcategory',[
  {k:'name',l:'Name',req:1}
 ],s||{},
 d=>{s?s.name=d.name:db.subs.push({id:uid(),col:st.col,parentId:st.sub||null,name:d.name,createdAt:Date.now()})},
 s&&(()=>{
  const ids=desc(s.id);
  db.items=db.items.filter(i=>!ids.includes(i.sub));
  db.subs=db.subs.filter(x=>!ids.includes(x.id));
  if(ids.includes(st.sub))st.sub=s.parentId||null;
 })
 );
}

function itemForm(type,id){
 const i=id&&db.items.find(x=>x.id==id),w=type=='word';
 const F=w?[
  {k:'t',l:'Word',req:1},
  {k:'ipa',l:'Pronunciation / IPA'},
  {k:'m',l:'Meaning / Translation'},
  {k:'ex',l:'Example sentence',t:'area'}
 ]:[
  {k:'t',l:'Phrase',req:1},
  {k:'m',l:'Translation'},
  {k:'n',l:'Additional note',t:'area'}
 ];

 form(i?(w?'Edit word':'Edit phrase'):(w?'New word':'New phrase'),F,i||{},
 d=>{
  const n=Date.now();
  i?Object.assign(i,d,{updatedAt:n}):db.items.push({
   id:uid(),type,col:st.col,sub:st.sub||null,...d,
   fav:false,createdAt:n,updatedAt:n
  });
 },
 i&&(()=>{db.items=db.items.filter(x=>x!=i)})
 );
}

function edit(id){
 const i=db.items.find(x=>x.id==id);
 if(!i)return;
 if(i.type=='note'){
  st.note=id;scrollTo(0,0);render();
 }else itemForm(i.type,id);
}

function fav(id){
 const i=db.items.find(x=>x.id==id);
 i.fav=!i.fav;save();render();
}

function plus(){
 const o=st.col?[
  ['▤','Add subcategory',()=>subForm()],
  ['Aa','Add word',()=>itemForm('word')],
  ['❝','Add phrase',()=>itemForm('phrase')],
  ['✎','Create note',newNote]
 ]:[
  ['❖','Add collection',()=>colForm()]
 ];

 sheet('<h2>Add new</h2>'+o.map((x,i)=>`<button class=opt data-i=${i}><span>${x[0]}</span>${x[1]}</button>`).join(''));

 $('.sh').onclick=e=>{
  const b=e.target.closest('.opt');
  if(b){
   const f=o[b.dataset.i][2];
   close();f();
  }
 };
}

/* views */

function homeView(A){
 A.innerHTML=`<header class=top><h1>My English</h1><button class=ic aria-label="Settings" onclick="settings()">⚙︎</button></header><input id=q class=search type=search placeholder="Search words, phrases, and notes" value="${esc(st.q)}"><div id=res></div>`;
 $('#q').oninput=e=>{st.q=e.target.value;res()};
 res();
}

function res(){
 const R=$('#res'),q=st.q.trim();

 if(!q){
  R.innerHTML=db.cols.length?`<div class=grid>${db.cols.map(c=>`<div class=cc style="background:${c.color}" onclick="go('${c.id}')"><div class=ci>${c.icon}</div><div><b>${esc(c.name)}</b><small>Entries: ${cnt(c.id)}</small></div></div>`).join('')}</div>`:empty('📖','Your notebook is empty','Tap + to create your first collection.');
  return;
 }

 const r=srch(q);let last='';
 R.innerHTML=r.length?r.map(x=>{
  const hd=x.k!=last?`<div class=sec>${x.k}</div>`:'';
  last=x.k;
  return hd+`<div class=res onclick="go('${x.c}','${x.s||''}','${x.n||''}')"><b>${hl(x.t,q)}</b>${x.sn?`<small>${hl(x.sn,q)}</small>`:''}</div>`;
 }).join(''):empty('🔍','Nothing found','Try another word.');
}

function srch(q){
 const l=q.toLowerCase(),m=s=>String(s||'').toLowerCase().includes(l),r=[];

 db.cols.forEach(c=>m(c.name)&&r.push({g:0,k:'Collections',t:c.name,c:c.id}));
 db.subs.forEach(s=>m(s.name)&&r.push({g:1,k:'Subcategories',t:s.name,c:s.col,s:s.id}));

 db.items.forEach(i=>{
  const f=i.type=='note'?[i.t,i.c]:i.type=='word'?[i.t,i.ipa,i.m,i.ex,i.et]:[i.t,i.m,i.n],h=f.find(m);
  if(!h)return;

  const x=h.toLowerCase().indexOf(l),sn=h===i.t?(i.m||''):(h.length>90?'…'+h.slice(Math.max(0,x-30),x+60)+'…':h);

  r.push({
   g:{word:2,phrase:3,note:4}[i.type],
   k:{word:'Words',phrase:'Phrases',note:'Notes'}[i.type],
   t:i.t||'Untitled',sn,c:i.col,s:i.sub,n:i.type=='note'?i.id:''
  });
 });

 return r.sort((a,b)=>a.g-b.g);
}

const card=i=>i.type=='word'
 ?`<div class=card onclick="edit('${i.id}')"><div class=wh><b>${esc(i.t)}</b>${i.ipa?`<span class=ipa>${esc(/^[\/\[].*[\/\]]$/.test(i.ipa)?i.ipa:'/'+i.ipa+'/')}</span>`:''}<button class="star ${i.fav?'on':''}" aria-label="Favorites" onclick="event.stopPropagation();fav('${i.id}')">${i.fav?'★':'☆'}</button></div>${i.m?`<div class=wm>${esc(i.m)}</div>`:''}${i.ex?`<div class=ex>${esc(i.ex)}${i.et?`<small>${esc(i.et)}</small>`:''}</div>`:''}</div>`
 :i.type=='phrase'
 ?`<div class="card ph" onclick="edit('${i.id}')"><div class=pt>${esc(i.t)}</div>${i.m?`<div class=wm>${esc(i.m)}</div>`:''}${i.n?`<div class=pn>${esc(i.n)}</div>`:''}</div>`
 :`<div class="card nn" onclick="edit('${i.id}')"><b>✎ ${esc(i.t||'Untitled')}</b><p>${esc((i.c||'').slice(0,160))}</p></div>`;

function colView(A){
 const c=db.cols.find(x=>x.id==st.col);
 if(!c)return go();

 let sub=st.sub&&db.subs.find(x=>x.id==st.sub);
 if(!sub)st.sub=null;

 const par=sub&&sub.parentId&&db.subs.find(x=>x.id==sub.parentId),sid=sub?sub.id:null;
 const subs=db.subs.filter(s=>s.col===c.id&&(s.parentId||null)===sid);
 const its=db.items.filter(i=>i.col===c.id&&(i.sub||null)===sid).sort((a,b)=>b.createdAt-a.createdAt);

 A.innerHTML=`<header class=top><button class=back onclick="back()">‹ ${esc(sub?(par?par.name:c.name):'Collections')}</button><button class=ic aria-label="Edit" onclick="${sub?`subForm('${sub.id}')`:`colForm('${c.id}')`}">⋯</button></header>
<div class=ttl><span>${sub?'▤':c.icon}</span><h1>${esc(sub?sub.name:c.name)}</h1></div>
${subs.length?'<div class=sec>Subcategories</div>'+subs.map(s=>`<div class=sub onclick="go('${c.id}','${s.id}')"><div class=sx><b>${esc(s.name)}</b><small>Entries: ${cnt(c.id,s.id)}</small></div><button class=dots onclick="event.stopPropagation();subForm('${s.id}')">⋯</button><i>›</i></div>`).join(''):''}
${its.length?'<div class=sec>Entries</div>'+its.map(card).join(''):''}
${subs.length||its.length?'':empty('🌿','Nothing here yet','Tap + to add a word, phrase, note, or subcategory.')}`;
}

/* notes */

function newNote(){
 const n=Date.now(),o={
  id:uid(),type:'note',col:st.col,sub:st.sub||null,
  t:'',c:'',createdAt:n,updatedAt:n
 };
 db.items.push(o);st.note=o.id;scrollTo(0,0);render();
}

function sv(){
 clearTimeout(tm);
 const n=db.items.find(i=>i.id==st.note),t=$('#nt');
 if(!n||!t)return;
 n.t=t.value;n.c=$('#nc').value;n.updatedAt=Date.now();save();
 $('#ss').textContent='Saved';
}

const grow=()=>{
 const a=$('#nc');
 a.style.height='auto';
 a.style.height=Math.max(a.scrollHeight,innerHeight*.55)+'px';
};

function noteView(A){
 const n=db.items.find(i=>i.id==st.note);
 if(!n){st.note=null;return render()}

 A.innerHTML=`<header class=top><button class=back onclick="back()">‹ Back</button><span id=ss class=ss>Saved</span><button class=pill onclick="sv()">Save</button><button class=ic aria-label="Delete" onclick="delNote()">🗑</button></header><input id=nt class=nt placeholder="Title" value="${esc(n.t)}"><textarea id=nc class=nc placeholder="Start writing...">${esc(n.c)}</textarea>`;

 const au=()=>{
  $('#ss').textContent='Saving...';
  clearTimeout(tm);tm=setTimeout(sv,400);grow();
 };

 $('#nt').oninput=$('#nc').oninput=au;
 grow();
 if(!n.t&&!n.c)$('#nc').focus();
}

function delNote(){
 if(!confirm('Delete this note? This action cannot be undone.'))return;
 clearTimeout(tm);
 db.items=db.items.filter(i=>i.id!=st.note);
 save();st.note=null;render();
}

addEventListener('pagehide',sv);
document.addEventListener('visibilitychange',()=>document.hidden&&sv());

/* backup */

function settings(){
 sheet(`<h2>Settings</h2><button class=opt id=ex><span>⇪</span>Export backup</button><button class=opt id=im><span>⇩</span>Import from file</button><input type=file id=fi accept=".json,application/json" hidden><p class=hint>Your data is stored only on this device. Remember to create backups from time to time.</p>`);
 $('#ex').onclick=exp;
 $('#im').onclick=()=>$('#fi').click();
 $('#fi').onchange=imp;
}

function exp(){
 const nm='my-english-'+new Date().toISOString().slice(0,10)+'.json';
 const js=JSON.stringify(db,null,1),f=new File([js],nm,{type:'application/json'});

 if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f]}).catch(()=>{});
 else{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(f);a.download=nm;a.click();
 }
}

function imp(e){
 const f=e.target.files[0];
 if(!f)return;

 const r=new FileReader();
 r.onload=()=>{
  let d;
  try{
   d=JSON.parse(r.result);
   if(![d.cols,d.subs,d.items].every(Array.isArray)||d.cols.some(c=>!c.id||!c.name)||d.subs.some(s=>!s.id||!s.col)||d.items.some(i=>!i.id||!i.col||!['word','phrase','note'].includes(i.type)))throw 0;
  }catch(x){
   alert('This file does not look like a My English backup.');
   return;
  }

  if(!confirm(`Replace your current data with the data from this file? Collections in the file: ${d.cols.length}.`))return;
  db=d;save();close();go();
 };
 r.readAsText(f);
}

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));

render();
