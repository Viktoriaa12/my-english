const $=s=>document.querySelector(s),K='myenglish.v1';
let db;try{db=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!db||!Array.isArray(db.cols))db={cols:[],subs:[],items:[]};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(db))}catch(e){alert('Не вдалося зберегти дані. Перевірте вільне місце.')}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hl=(s,q)=>{s=String(s||'');const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');return s.split(re).map((p,i)=>i%2?'<mark>'+esc(p)+'</mark>':esc(p)).join('')};
const ICONS=['✧','♡','♥','☆','✦','📚','📖','🌿','🌸','🦋','☁️','🌙','⭐','💌','🪞','🕯️','🎀','🍓','🪻','🧸','🗝️','🪐','🫧','🖋️','💫'];
const COLS=['#E5EBE5','#EEE7E2','#EAE8EF','#EFEDE4'];
let st={col:null,sub:null,note:null,q:''},tm;
const desc=id=>[id,...db.subs.filter(s=>s.parentId===id).flatMap(s=>desc(s.id))];
const cnt=(c,s)=>{const ids=s&&desc(s);return db.items.filter(i=>i.col===c&&(!ids||ids.includes(i.sub))).length};
const empty=(i,t,s)=>`<div class=empty><div>${i}</div><b>${t}</b>${s}</div>`;
function go(c,s,n){st.col=c||null;st.sub=s||null;st.note=n||null;scrollTo(0,0);render()}
function render(){const A=$('#app');$('.fab').style.display=st.note?'none':'';st.note?noteView(A):st.col?colView(A):homeView(A)}
function back(){if(st.note){sv();const n=db.items.find(i=>i.id==st.note);if(n&&!n.t.trim()&&!n.c.trim()){db.items=db.items.filter(i=>i!=n);save()}st.note=null}
 else if(st.sub){const s=db.subs.find(x=>x.id==st.sub);st.sub=s&&s.parentId||null}else st.col=null;scrollTo(0,0);render()}
/* sheets & forms */

function sheet(h,extraClass=''){
 close();

 const o=document.createElement('div');
 o.className='ov';
 o.innerHTML='<div class="sh '+extraClass+'"><i class=grab></i>'+h+'</div>';

 o.onclick=e=>{
  if(e.target===o)close();
 };

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
     <span>Обрати іконку</span>
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

  return `<label class=lb>${f.l}${f.req?'':' <em>(необов’язково)</em>'}
   ${f.t==='area'
    ?`<textarea name="${f.k}" rows=3>${esc(x)}</textarea>`
    :`<input type=text name="${f.k==='name'?'entry-title':f.k}" value="${esc(x)}" ${f.req?'required':''} autocomplete=off autocorrect=on autocapitalize=words spellcheck=true inputmode=text>`}
  </label>`;
 }).join('');

 const emojiScreen=`
 <div class=emoji-screen hidden>
  <div class=emoji-head>
   <button type=button class=emoji-back>‹ Назад</button>
   <b>Обрати іконку</b>
  </div>
  <div class=emoji-grid>
   ${ICONS.map(o=>`<button type=button class=emoji-option data-emoji="${esc(o)}">${o}</button>`).join('')}
  </div>
 </div>`;

 const aiType = F.some(f=>f.k==='ipa') ? 'word' :
               F.some(f=>f.k==='n') ? 'phrase' : null;

  sheet(`<h2>${title}</h2><div class=fields>${h}
   ${aiType ? '<button type=button class="btn ghost" id=ai-fill>✨ Заповнити за допомогою ШІ</button>' : ''}
   <button type=button class=btn id=save-form>Зберегти</button>
   ${del?'<button type=button class="btn ghost danger" id=del>Видалити</button>':''}
  </div>${emojiScreen}`,title.toLowerCase().includes('фраз')?'phrase-sheet':'');

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
    button.textContent='✨ Генерую...';

    try{
     const response=await fetch('/.netlify/functions/ai',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:aiType,text:word})
     });

     const data=await response.json();
     if(!response.ok)throw new Error(data.error||'Помилка');

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
     alert(error.message||'Не вдалося отримати відповідь від ШІ');
    }finally{
     button.disabled=false;
     button.textContent='✨ Заповнити за допомогою ШІ';
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
  if(confirm('Видалити? Разом із вмістом. Це не можна скасувати.')){
   del();
   save();
   close();
   render();
  }
 };
}


function colForm(id){const c=id&&db.cols.find(x=>x.id==id);
 form(c?'Редагувати колекцію':'Нова колекція',[{k:'name',l:'Назва',req:1},{k:'icon',l:'Іконка',t:'icons',o:ICONS,d:'✧'},{k:'color',l:'Колір',t:'cols',o:COLS,d:COLS[0]}],c||{},
 d=>{c?Object.assign(c,d):db.cols.push({id:uid(),...d,createdAt:Date.now()})},
 c&&(()=>{db.items=db.items.filter(i=>i.col!=c.id);db.subs=db.subs.filter(s=>s.col!=c.id);db.cols=db.cols.filter(x=>x!=c);st.col=st.sub=null}))}
function subForm(id){const s=id&&db.subs.find(x=>x.id==id);
 form(s?'Перейменувати підкатегорію':'Нова підкатегорія',[{k:'name',l:'Назва',req:1}],s||{},
 d=>{s?s.name=d.name:db.subs.push({id:uid(),col:st.col,parentId:st.sub||null,name:d.name,createdAt:Date.now()})},
 s&&(()=>{const ids=desc(s.id);db.items=db.items.filter(i=>!ids.includes(i.sub));db.subs=db.subs.filter(x=>!ids.includes(x.id));if(ids.includes(st.sub))st.sub=s.parentId||null}))}
function itemForm(type,id){const i=id&&db.items.find(x=>x.id==id),w=type=='word';
 const F=w?[{k:'t',l:'Слово',req:1},{k:'ipa',l:'Вимова / IPA'},{k:'m',l:'Значення / переклад'},{k:'ex',l:'Приклад речення',t:'area'},{k:'et',l:'Переклад прикладу',t:'area'}]:[{k:'t',l:'Фраза',req:1},{k:'m',l:'Переклад'},{k:'n',l:'Додаткова примітка',t:'area'}];
 form(i?(w?'Редагувати слово':'Редагувати фразу'):(w?'Нове слово':'Нова фраза'),F,i||{},
 d=>{const n=Date.now();i?Object.assign(i,d,{updatedAt:n}):db.items.push({id:uid(),type,col:st.col,sub:st.sub||null,...d,fav:false,createdAt:n,updatedAt:n})},
 i&&(()=>{db.items=db.items.filter(x=>x!=i)}))}
function edit(id){const i=db.items.find(x=>x.id==id);if(!i)return;if(i.type=='note'){st.note=id;scrollTo(0,0);render()}else itemForm(i.type,id)}
function fav(id){const i=db.items.find(x=>x.id==id);i.fav=!i.fav;save();render()}
function plus(){const o=st.col?[['▤','Додати підкатегорію',()=>subForm()],['Aa','Додати слово',()=>itemForm('word')],['❝','Додати фразу',()=>itemForm('phrase')],['✎','Створити нотатку',newNote]]:[['❖','Додати колекцію',()=>colForm()]];
 sheet('<h2>Додати</h2>'+o.map((x,i)=>`<button class=opt data-i=${i}><span>${x[0]}</span>${x[1]}</button>`).join(''));
 $('.sh').onclick=e=>{const b=e.target.closest('.opt');if(b){const f=o[b.dataset.i][2];close();f()}}}
/* views */
function homeView(A){A.innerHTML=`<header class=top><h1>My English</h1><button class=ic aria-label="Налаштування" onclick="settings()">⚙︎</button></header><input id=q class=search type=search placeholder="Пошук слів, фраз і нотаток" value="${esc(st.q)}"><div id=res></div>`;
 $('#q').oninput=e=>{st.q=e.target.value;res()};res()}
function res(){const R=$('#res'),q=st.q.trim();
 if(!q){R.innerHTML=db.cols.length?`<div class=grid>${db.cols.map(c=>`<div class=cc style="background:${c.color}" onclick="go('${c.id}')"><div class=ci>${c.icon}</div><div><b>${esc(c.name)}</b><small>Записів: ${cnt(c.id)}</small></div></div>`).join('')}</div>`:empty('📖','Зошит ще порожній','Натисніть +, щоб створити першу колекцію.');return}
 const r=srch(q);let last='';
 R.innerHTML=r.length?r.map(x=>{const hd=x.k!=last?`<div class=sec>${x.k}</div>`:'';last=x.k;return hd+`<div class=res onclick="go('${x.c}','${x.s||''}','${x.n||''}')"><b>${hl(x.t,q)}</b>${x.sn?`<small>${hl(x.sn,q)}</small>`:''}</div>`}).join(''):empty('🔍','Нічого не знайдено','Спробуйте інше слово.')}
function srch(q){const l=q.toLowerCase(),m=s=>String(s||'').toLowerCase().includes(l),r=[];
 db.cols.forEach(c=>m(c.name)&&r.push({g:0,k:'Колекції',t:c.name,c:c.id}));
 db.subs.forEach(s=>m(s.name)&&r.push({g:1,k:'Підкатегорії',t:s.name,c:s.col,s:s.id}));
 db.items.forEach(i=>{const f=i.type=='note'?[i.t,i.c]:i.type=='word'?[i.t,i.ipa,i.m,i.ex,i.et]:[i.t,i.m,i.n],h=f.find(m);if(!h)return;
  const x=h.toLowerCase().indexOf(l),sn=h===i.t?(i.m||''):(h.length>90?'…'+h.slice(Math.max(0,x-30),x+60)+'…':h);
  r.push({g:{word:2,phrase:3,note:4}[i.type],k:{word:'Слова',phrase:'Фрази',note:'Нотатки'}[i.type],t:i.t||'Без назви',sn,c:i.col,s:i.sub,n:i.type=='note'?i.id:''})});
 return r.sort((a,b)=>a.g-b.g)}
const card=i=>i.type=='word'?`<div class=card onclick="edit('${i.id}')"><div class=wh><b>${esc(i.t)}</b>${i.ipa?`<span class=ipa>${esc(/^[\/\[].*[\/\]]$/.test(i.ipa)?i.ipa:'/'+i.ipa+'/')}</span>`:''}<button class="star ${i.fav?'on':''}" aria-label="Обране" onclick="event.stopPropagation();fav('${i.id}')">${i.fav?'★':'☆'}</button></div>${i.m?`<div class=wm>${esc(i.m)}</div>`:''}${i.ex?`<div class=ex>${esc(i.ex)}${i.et?`<small>${esc(i.et)}</small>`:''}</div>`:''}</div>`
:i.type=='phrase'?`<div class="card ph" onclick="edit('${i.id}')"><div class=pt>${esc(i.t)}</div>${i.m?`<div class=wm>${esc(i.m)}</div>`:''}${i.n?`<div class=pn>${esc(i.n)}</div>`:''}</div>`
:`<div class="card nn" onclick="edit('${i.id}')"><b>✎ ${esc(i.t||'Без назви')}</b><p>${esc((i.c||'').slice(0,160))}</p></div>`;
function colView(A){const c=db.cols.find(x=>x.id==st.col);if(!c)return go();
 let sub=st.sub&&db.subs.find(x=>x.id==st.sub);if(!sub)st.sub=null;
 const par=sub&&sub.parentId&&db.subs.find(x=>x.id==sub.parentId),sid=sub?sub.id:null;
 const subs=db.subs.filter(s=>s.col===c.id&&(s.parentId||null)===sid),its=db.items.filter(i=>i.col===c.id&&(i.sub||null)===sid).sort((a,b)=>b.createdAt-a.createdAt);
 A.innerHTML=`<header class=top><button class=back onclick="back()">‹ ${esc(sub?(par?par.name:c.name):'Колекції')}</button><button class=ic aria-label="Змінити" onclick="${sub?`subForm('${sub.id}')`:`colForm('${c.id}')`}">⋯</button></header>
<div class=ttl><span>${sub?'▤':c.icon}</span><h1>${esc(sub?sub.name:c.name)}</h1></div>
${subs.length?'<div class=sec>Підкатегорії</div>'+subs.map(s=>`<div class=sub onclick="go('${c.id}','${s.id}')"><div class=sx><b>${esc(s.name)}</b><small>Записів: ${cnt(c.id,s.id)}</small></div><button class=dots onclick="event.stopPropagation();subForm('${s.id}')">⋯</button><i>›</i></div>`).join(''):''}
${its.length?'<div class=sec>Записи</div>'+its.map(card).join(''):''}
${subs.length||its.length?'':empty('🌿','Тут поки порожньо','Натисніть +, щоб додати слово, фразу, нотатку чи підкатегорію.')}`}
}
/* notes */
function newNote(){const n=Date.now(),o={id:uid(),type:'note',col:st.col,sub:st.sub||null,t:'',c:'',createdAt:n,updatedAt:n};db.items.push(o);st.note=o.id;scrollTo(0,0);render()}
function sv(){clearTimeout(tm);const n=db.items.find(i=>i.id==st.note),t=$('#nt');if(!n||!t)return;n.t=t.value;n.c=$('#nc').value;n.updatedAt=Date.now();save();$('#ss').textContent='Збережено'}
const grow=()=>{const a=$('#nc');a.style.height='auto';a.style.height=Math.max(a.scrollHeight,innerHeight*.55)+'px'};
function noteView(A){const n=db.items.find(i=>i.id==st.note);if(!n){st.note=null;return render()}
 A.innerHTML=`<header class=top><button class=back onclick="back()">‹ Назад</button><span id=ss class=ss>Збережено</span><button class=pill onclick="sv()">Зберегти</button><button class=ic aria-label="Видалити" onclick="delNote()">🗑</button></header><input id=nt class=nt placeholder="Заголовок" value="${esc(n.t)}"><textarea id=nc class=nc placeholder="Почніть писати…">${esc(n.c)}</textarea>`;
 const au=()=>{$('#ss').textContent='…';clearTimeout(tm);tm=setTimeout(sv,400);grow()};
 $('#nt').oninput=$('#nc').oninput=au;grow();if(!n.t&&!n.c)$('#nc').focus()}
function delNote(){if(!confirm('Видалити нотатку? Це не можна скасувати.'))return;clearTimeout(tm);db.items=db.items.filter(i=>i.id!=st.note);save();st.note=null;render()}
addEventListener('pagehide',sv);document.addEventListener('visibilitychange',()=>document.hidden&&sv());
/* backup */
function settings(){sheet(`<h2>Налаштування</h2><button class=opt id=ex><span>⇪</span>Експортувати резервну копію</button><button class=opt id=im><span>⇩</span>Імпортувати з файлу</button><input type=file id=fi accept=".json,application/json" hidden><p class=hint>Дані зберігаються лише на цьому пристрої. Час від часу робіть резервну копію.</p>`);
 $('#ex').onclick=exp;$('#im').onclick=()=>$('#fi').click();$('#fi').onchange=imp}
function exp(){const nm='my-english-'+new Date().toISOString().slice(0,10)+'.json',js=JSON.stringify(db,null,1),f=new File([js],nm,{type:'application/json'});
 if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f]}).catch(()=>{});
 else{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=nm;a.click()}}
function imp(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{let d;try{d=JSON.parse(r.result);if(![d.cols,d.subs,d.items].every(Array.isArray)||d.cols.some(c=>!c.id||!c.name)||d.subs.some(s=>!s.id||!s.col)||d.items.some(i=>!i.id||!i.col||!['word','phrase','note'].includes(i.type)))throw 0}catch(x){alert('Файл не схожий на резервну копію My English.');return}
  if(!confirm(`Замінити поточні дані даними з файлу? Колекцій у файлі: ${d.cols.length}.`))return;db=d;save();close();go()};r.readAsText(f)}
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
render();
