/* ============ DZEN · Энергия · ядро (общее для всех версий) ============ */
'use strict';
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
function todayStr(d){d=d||new Date();var m=d.getMonth()+1,day=d.getDate();
  return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(day<10?'0':'')+day;}
function addDays(str,n){var p=str.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return todayStr(d);}
function weekKey(str){var p=str.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);
  var day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+3);
  var y=d.getFullYear();var j=new Date(y,0,4);var wk=1+Math.round(((d-j)/864e5-3+((j.getDay()+6)%7))/7);
  return y+'-W'+wk;}
function daysBetween(a,b){var pa=a.split('-'),pb=b.split('-');
  return Math.round((new Date(+pb[0],+pb[1]-1,+pb[2])-new Date(+pa[0],+pa[1]-1,+pa[2]))/864e5);}
function plural(n,one,few,many){n=Math.abs(n)%100;var d=n%10;
  if(n>10&&n<20)return many;if(d===1)return one;if(d>1&&d<5)return few;return many;}

/* звук */
var AC=null;function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
var _lt=0;
function tick(){var c=ac();if(!c)return;var t=c.currentTime;if(t-_lt<0.05)return;_lt=t;
  var o=c.createOscillator(),g=c.createGain();o.frequency.value=880;
  g.gain.setValueAtTime(0.02,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+0.08);}
function pshh(){var c=ac();if(!c)return;var t=c.currentTime;
  var b=c.createBuffer(1,c.sampleRate*0.5,c.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.2);
  var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=b;f.type='highpass';f.frequency.value=3000;g.gain.value=0.1;
  s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);}

/* привычки */
var HABITS=[
 {id:'sleep',title:'Лечь до 23:00',img:'poster_sleep',line:'вместо второго сезона, который сам себя не досмотрит',daily:'Вчера-сегодня лёг до 23:00?',why:'Сон — главный завод энергии. Всё остальное — филиалы.'},
 {id:'sugar',title:'День без сладкого',img:'poster_sugar',line:'печенье переживёт эту разлуку. а ты станешь ровнее',daily:'Сегодня обошёлся без сладкого?',why:'Сахарные качели съедают энергию быстрее, чем дают.'},
 {id:'move',title:'20 минут движения',img:'poster_move',line:'прогулка тоже считается. диван подождёт',daily:'Сегодня было 20 минут движения?',why:'Движение — самый честный способ разогнать энергию.'},
 {id:'phone',title:'Вечер без ленты',img:'poster_phone',line:'лента бесконечна. твой вечер — нет',daily:'Вечер прошёл без залипания в телефон?',why:'Лента перед сном ворует и вечер, и завтрашнее утро.'},
 {id:'drink',title:'Без сахарных напитков',img:'poster_drink',line:'пузырьки можно оставить. сахар — нет',daily:'Сегодня без сладкой газировки?',why:'Жидкий сахар — самый незаметный слив энергии.'},
 {id:'news',title:'Новости 1 раз в день',img:'poster_news',line:'мир подождёт. он никуда не денется',daily:'Заглянул в новости не больше раза?',why:'Каждый заход в новости — маленький налог на нервы.'}];
function habit(id){for(var i=0;i<HABITS.length;i++)if(HABITS[i].id===id)return HABITS[i];return HABITS[0];}

/* состояние (общее для всех версий на этом домене) */
var KEY=window.DZEN_KEY||'dzen10';
var S=loadState();
function loadState(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)return s;}catch(e){}
  return {v:1,quiz:null,habits:[],days:{},streak:0,best:0,lastCheck:null,freezes:{},achv:{},remind:'21:30',demo:false};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
try{localStorage.setItem('dzen10.variant',location.pathname);}catch(e){}

/* индекс */
function factors(a){return [
 {id:'energy',name:'Заряд сейчас',v:a.energy},
 {id:'sleep',name:'Сон',v:Math.round(a.sleep/7*100)},
 {id:'sugar',name:'Сахар',v:Math.round(a.sugar/7*100)},
 {id:'screen',name:'Экраны',v:Math.round((7-a.screen)/7*100)},
 {id:'move',name:'Движение',v:Math.round(a.move/7*100)},
 {id:'stress',name:'Внешний фон',v:100-a.stress}];}
var WEIGHTS={energy:.30,sleep:.14,sugar:.12,screen:.10,move:.14,stress:.20};
function calcIndex(a){var fs=factors(a),s=0;fs.forEach(function(f){s+=f.v*WEIGHTS[f.id];});
  return Math.max(0,Math.min(100,Math.round(s)));}
var LEAK2HABIT={energy:'sleep',sleep:'sleep',sugar:'sugar',screen:'phone',move:'move',stress:'news'};
function verdict(i){
 if(i<20)return ['Резерв почти на нуле','Ты едешь на честном слове и кофе. Ниже уже некуда — дальше только вверх.'];
 if(i<40)return ['Держишься на морали','Заряд утекает быстрее, чем приходит. Чиним не всё сразу, а одну дырку.'];
 if(i<60)return ['Рабочий режим, без запаса','На жизнь хватает, на кайф — впритык. Один точный ход это меняет.'];
 if(i<80)return ['Ты в ресурсе','Редкий зверь. Осталось сделать так, чтобы это не было случайностью.'];
 return ['Фонтан. Поделись рецептом','Такой заряд надо не тратить, а инвестировать.'];}
function energyWord(v){return v<10?'полный ноль':v<25?'еле тлею':v<45?'на остатках':v<65?'рабочий режим':v<85?'хорошо заряжен':'фонтан энергии';}

/* замер дня: серия + ачивки. Возвращает {finale, streak, res} */
function checkInDay(rec){
  var t=todayStr();S.days[t]=rec;
  if(S.lastCheck===t){}
  else if(S.lastCheck===addDays(t,-1)){S.streak++;}
  else if(S.lastCheck===addDays(t,-2)&&!S.freezes[weekKey(t)]){S.freezes[weekKey(t)]=addDays(t,-1);S.streak++;}
  else{S.streak=1;}
  S.lastCheck=t;if(S.streak>S.best)S.best=S.streak;
  if(!S.achv.d1)S.achv.d1=t;
  if(S.streak>=3&&!S.achv.d3)S.achv.d3=t;
  var finale=null;
  [[7,'d7'],[14,'d14'],[21,'d21'],[30,'d30']].forEach(function(p){
    if(S.streak>=p[0]&&!S.achv[p[1]]){S.achv[p[1]]=t;finale=p[0];}});
  save();return {finale:finale,streak:S.streak};}
function dayVerdict(rec){
  var k=rec.kept.length?rec.kept.reduce(function(a,b){return a+b;},0)/rec.kept.length:100;
  if(k>=70)return {em:'🏆',ti:'Красавчик. Без вариантов.',su:rec.hard>=60?'Тяжело — и всё равно сделал. Это и есть характер.':'Сделал и даже не вспотел. Подозрительно хорош.'};
  if(k>=40)return {em:'⚡',ti:'Держишься. Это уже характер.',su:'Наполовину — это не ноль. Завтра дожмёшь.'};
  return {em:'🌱',ti:'Сорвался — тоже данные.',su:'Серия не про идеальность, а про возвращение. Завтра новая серия.'};}
var ACHV=[{id:'d1',ic:'🎬',t:'Пилотная серия'},{id:'d3',ic:'⚡',t:'3 серии подряд'},
 {id:'d7',ic:'🏆',t:'Финал сезона'},{id:'spin',ic:'🌿',t:'Спин-офф'},
 {id:'d14',ic:'🥈',t:'Сезон 2'},{id:'d21',ic:'🥇',t:'Культовый сериал'},{id:'d30',ic:'👑',t:'Месяц в ресурсе'}];
function bestInsight(){
  var w=[],wo=[];Object.keys(S.days).forEach(function(d){var r=S.days[d];
    if(!r.kept||!r.kept.length)return;
    var a=r.kept.reduce(function(x,y){return x+y;},0)/r.kept.length;(a>=60?w:wo).push(r.energy);});
  if(w.length<2||wo.length<1)return null;
  var m1=w.reduce(function(a,b){return a+b;},0)/w.length,m2=wo.reduce(function(a,b){return a+b;},0)/wo.length;
  var diff=Math.round(m1-m2);var h=habit(S.habits[0].id);
  if(diff>=5)return 'В дни, когда ты держишь «'+h.title+'», энергия в среднем на '+diff+' пунктов выше. Это не совпадение.';
  if(diff<=-5)return 'Пока в дни срывов энергия даже выше. Дай привычке пару дней — тело медленнее интернета.';
  return 'Разница пока в пределах погрешности. Данные копятся — находка зреет.';}

/* банка-визуализация */
function canSVG(level){var h=120,y=138-(level/100)*h;var bub='';
  for(var i=0;i<7;i++){var cx=34+((i*23)%44),r=1.6+((i*7)%3),du=(2.6+(i%4)*0.8).toFixed(1),de=(i*0.6).toFixed(1);
    bub+='<circle cx="'+cx+'" cy="140" r="'+r+'" fill="#FBFAF6" opacity=".75"><animate attributeName="cy" values="138;'+(y+6)+'" dur="'+du+'s" begin="'+de+'s" repeatCount="indefinite"/><animate attributeName="opacity" values=".75;0" dur="'+du+'s" begin="'+de+'s" repeatCount="indefinite"/></circle>';}
  return '<svg viewBox="0 0 112 176" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cc'+Math.round(level)+'"><rect x="20" y="18" width="72" height="140" rx="16"/></clipPath><linearGradient id="lq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8DC9A"/><stop offset="1" stop-color="#A8C96B"/></linearGradient></defs><rect x="20" y="18" width="72" height="140" rx="16" fill="rgba(251,250,246,.92)" stroke="currentColor" stroke-width="3"/><rect x="30" y="10" width="52" height="10" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><g clip-path="url(#cc'+Math.round(level)+')"><rect x="20" y="'+y+'" width="72" height="150" fill="url(#lq)"><animate attributeName="y" values="'+y+';'+(y-2)+';'+y+'" dur="3s" repeatCount="indefinite"/></rect>'+(level>2?bub:'')+'</g><text x="56" y="100" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="26" font-style="italic" fill="'+(level>55?'#FBFAF6':'#2B2A26')+'">'+Math.round(level)+'</text></svg>';}

/* карточка-достижение (canvas 1080×1350) */
var _abg=null;
function drawShareCard(cv,days,cb){
  var ctx=cv.getContext('2d');var h=habit(S.habits[0]?S.habits[0].id:'sleep');
  function paint(){ctx.clearRect(0,0,1080,1350);
    if(_abg)ctx.drawImage(_abg,0,0,1080,1350);else{ctx.fillStyle='#F4F1EA';ctx.fillRect(0,0,1080,1350);}
    ctx.fillStyle='rgba(244,241,234,.55)';ctx.fillRect(70,70,940,1210);
    ctx.strokeStyle='#2B2A26';ctx.lineWidth=3;ctx.strokeRect(70,70,940,1210);
    ctx.textAlign='center';ctx.fillStyle='#56732E';ctx.font='650 34px Inter, sans-serif';
    ctx.fillText('D Z E N  ·  Э Н Е Р Г И Я',540,180);
    ctx.fillStyle='#2B2A26';ctx.font='italic 500 110px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(days===7?'Финал сезона':days+' дней',540,350);
    ctx.font='250 300px "Cormorant Garamond", Georgia, serif';ctx.fillText(String(days),540,680);
    ctx.font='500 44px Inter, sans-serif';ctx.fillText('дней подряд',540,790);
    ctx.font='italic 600 72px "Cormorant Garamond", Georgia, serif';
    var words=('«'+h.title+'»').split(' '),line='',yy=940;
    words.forEach(function(w){var t2=line?line+' '+w:w;
      if(ctx.measureText(t2).width>860&&line){ctx.fillText(line,540,yy);line=w;yy+=80;}else line=t2;});
    ctx.fillText(line,540,yy);
    var t=todayStr(),f=S.days[addDays(t,-6)],l=S.days[t];
    var delta=(f&&l)?Math.round(l.energy-f.energy):null;
    ctx.font='500 40px Inter, sans-serif';ctx.fillStyle='#56732E';
    ctx.fillText(delta!==null?('энергия за неделю: '+(delta>=0?'+':'')+delta+' '+plural(Math.abs(delta),'пункт','пункта','пунктов')):'энергия под контролем',540,1080);
    ctx.fillStyle='#6E6A5F';ctx.font='400 32px Inter, sans-serif';
    ctx.fillText('замерь свою · dzen энергия',540,1200);
    if(cb)cb();}
  if(!_abg){var im=new Image();im.src=window.DZEN_ASSETS+'img/frame_achieve.jpg';
    im.onload=function(){_abg=im;paint();};im.onerror=paint;}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(paint);
  paint();}
function shareCard(cv,text){
  cv.toBlob(function(b){var f=new File([b],'dzen-energy.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){
      navigator.share({files:[f],text:text+' '+siteURL()}).catch(function(){});}
    else{window.open('https://t.me/share/url?url='+encodeURIComponent(siteURL())+'&text='+encodeURIComponent(text),'_blank');}
  },'image/png');}
function saveCard(cv){cv.toBlob(function(b){var a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download='dzen-energy.png';document.body.appendChild(a);a.click();a.remove();},'image/png');}
function siteURL(){return location.origin+location.pathname;}

/* бот + календарь */
var BOT='dzen_energy_bot';
function openBot(){var t=(S.remind||'21:30').replace(':','');window.open('https://t.me/'+BOT+'?start=t'+t,'_blank');}
function downloadICS(){
  var time=(S.remind||'21:30').replace(':','')+'00';var start=todayStr().replace(/-/g,'');
  var ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DZEN//Energy//RU\r\nBEGIN:VEVENT\r\nUID:dzen-'+Date.now()+'@dzen\r\nDTSTART:'+start+'T'+time+'\r\nRRULE:FREQ=DAILY\r\nSUMMARY:⚡ DZEN · замер энергии (30 сек)\r\nDESCRIPTION:'+siteURL()+'\r\nBEGIN:VALARM\r\nTRIGGER:PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:Замер\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR';
  var a=document.createElement('a');a.href='data:text/calendar;charset=utf-8,'+encodeURIComponent(ics);
  a.download='dzen-energy.ics';document.body.appendChild(a);a.click();a.remove();}

/* нейронка: разбор замера + свободный чат */
var AIK='dzen10.ai';
var _k=(function(){var p=['cFZqTlRZVmpKZEZXclA3V3pTa','G9HRlF4WUYzYnlkR1cxSk5RRT','E4MzBKSGdwWlFTTTJrTV9rc2c='];
  try{return atob(p.join('')).split('').reverse().join('');}catch(e){return '';}})();
function aiConf(){
  try{var c=JSON.parse(localStorage.getItem(AIK));if(c&&c.key)return c;}catch(e){}
  return {provider:'groq',key:_k};}
(function(){var m=location.hash.match(/^#ai=(groq|claude|local):?(.*)$/);
  if(m){localStorage.setItem(AIK,JSON.stringify({provider:m[1],key:decodeURIComponent(m[2]||'')}));
    history.replaceState(null,'',location.pathname+location.search);}})();
var NUMW={'ноль':0,'один':1,'одна':1,'два':2,'две':2,'три':3,'четыре':4,'пять':5,'шесть':6,'семь':7,'восемь':8,'девять':9,'десять':10,'пятнадцать':15,'двадцать':20,'тридцать':30,'сорок':40,'пятьдесят':50,'шестьдесят':60,'семьдесят':70,'восемьдесят':80,'девяносто':90,'сто':100};
function wordsToNums(s){return s.replace(/(двадцать|тридцать|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяносто)\s+(один|два|три|четыре|пять|шесть|семь|восемь|девять)/g,
  function(m,a,b){return NUMW[a]+NUMW[b];}).replace(/[а-яё]+/g,function(w){return (w in NUMW)?NUMW[w]:w;});}
function localParse(text){var t=wordsToNums(text.toLowerCase());var o={energy:null,kept:null,hard:null};
  var m=t.match(/энерг[а-яё]*[^0-9]{0,12}(\d{1,3})/);if(m)o.energy=+m[1];
  var ns=(t.match(/\d{1,3}/g)||[]).map(Number).filter(function(n){return n<=100;});
  if(o.energy===null&&ns.length)o.energy=ns[0];
  if(/(сорвал|не держал|не смог|съел|нарушил|провалил)/.test(t))o.kept=10;
  else if(/(наполовину|частично|почти)/.test(t))o.kept=55;
  else if(/(держал|чисто|не ел|не брал|без сладкого|получилось|справил|удержал|лёг до|лег до)/.test(t))o.kept=90;
  if(/(очень тяжело|на зубах|еле|адски|с трудом)/.test(t))o.hard=90;
  else if(/(тяжело|сложно|трудно)/.test(t))o.hard=75;
  else if(/(нормально|средне|терпимо)/.test(t))o.hard=45;
  else if(/(легко|само|без проблем|спокойно)/.test(t))o.hard=12;
  return o;}
function llm(sys,user,cb){ /* user: строка или массив [{role,content}] ; cb(text|null) */
  var c=aiConf();
  var msgs=Array.isArray(user)?user:[{role:'user',content:user}];
  if(c.provider==='claude'&&c.key){
    fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':c.key,'anthropic-version':'2023-06-01','content-type':'application/json','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:600,system:sys,messages:msgs})})
      .then(function(r){return r.json();}).then(function(d){cb(d.content&&d.content[0]?d.content[0].text:null);})
      .catch(function(){cb(null);});}
  else if(c.provider==='groq'&&c.key){
    var models=['meta-llama/llama-4-maverick-17b-128e-instruct','llama-3.3-70b-versatile'];
    (function tryModel(mi){
      if(mi>=models.length){cb(null);return;}
      fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+c.key,'Content-Type':'application/json'},
        body:JSON.stringify({model:models[mi],temperature:0.5,max_tokens:600,messages:[{role:'system',content:sys}].concat(msgs)})})
        .then(function(r){return r.json();})
        .then(function(d){var t=d.choices&&d.choices[0]?d.choices[0].message.content:null;
          if(t)cb(t);else tryModel(mi+1);})
        .catch(function(){tryModel(mi+1);});
    })(0);}
  else cb(null);}
function aiParse(text,cb){
  var sys='Ты парсер дневного замера. Верни ТОЛЬКО JSON {"energy":0-100|null,"kept":0-100|null,"hard":0-100|null}. energy — уровень энергии. kept — держался ли привычки «'+(S.habits[0]?habit(S.habits[0].id).title:'привычка')+'» (сорвался=5-20, наполовину=50-60, держался=85-100). hard — тяжело ли далось (легко=5-20, средне=40-60, тяжело=70-95). Не сказано — null.';
  llm(sys,text,function(raw){
    if(!raw){cb(localParse(text));return;}
    try{cb(JSON.parse((raw.match(/\{[\s\S]*\}/)||['{}'])[0]));}catch(e){cb(localParse(text));}});}
var FAQ=[
 [/пребиотик/i,'Пребиотик — еда для твоих бактерий. В банке DZEN — пребиотики и около 4 г клетчатки. Бактерии довольны, ты газирован.'],
 [/сахар/i,'0 г сахара, ~20 ккал на 100 г, без Е-шек. Сладость есть, расплаты нет.'],
 [/купить|где|додо/i,'DZEN ищи в Додо Пицце. Манго-маракуйя или лайм-мята — выбери сторону.'],
 [/сери|стрик|заморозк/i,'Заходи раз в день — замер занимает 30 секунд. Пропустил день? Раз в неделю заморозка прощает один пропуск, автоматически.'],
 [/энерг/i,'Энергия любит скучные вещи: сон до 23, движение, меньше сахара и новостей. Я помогу — выбери одну привычку и держи 7 дней.']];
var CHAT_HIST=[];
function userCtx(){
  var p=[];
  if(S.quiz)p.push('индекс ресурса '+S.quiz.index+'/100');
  if(S.habits.length)p.push('привычка в фокусе: «'+habit(S.habits[0].id).title+'»'+(S.habits[1]?(' + «'+habit(S.habits[1].id).title+'»'):''));
  if(S.streak)p.push('серия замеров: '+S.streak+' '+plural(S.streak,'день','дня','дней'));
  var e=[];for(var i=4;i>=0;i--){var r=S.days[addDays(todayStr(),-i)];if(r)e.push(r.energy);}
  if(e.length)p.push('энергия за последние дни: '+e.join(', '));
  return p.length?p.join('; '):'данных пока нет — первый разговор';}
function chatAnswer(text,cb){
  var sys='Ты — собеседник в трекере «DZEN·Энергия»: эксперт мирового уровня по энергии, сну, привычкам, питанию, стрессу и работоспособности. '+
  'Твоя цель — чтобы человек ОФИГЕЛ от того, насколько полезный, точный и персональный ответ получил именно под свою ситуацию.\n'+
  'ПРАВИЛА:\n'+
  '1. Отвечай по существу его слов: отражай контекст, попадай в его жизнь, никаких шаблонных лекций.\n'+
  '2. Давай механизм («почему так работает») + 2-3 конкретных шага, применимых сегодня. Цифры и протоколы приветствуются: свет в глаза в первые 30 минут после подъёма; кофеин минимум за 8 часов до сна; правило 10-3-2-1; 25-30 г белка на завтрак; прогулка 10 минут после еды; спальня 18-20°; экраны за час до сна; «правило 2 минут» для старта привычки.\n'+
  '3. Если данных мало — дай лучший ответ по тому, что есть, и задай ОДИН точный уточняющий вопрос в конце.\n'+
  '4. Тон: на «ты», живой, уверенный, без воды и нравоучений, лёгкая ирония уместна. 3-6 коротких предложений или мини-список. Без эмодзи-спама (максимум один). Пиши на чистом грамотном русском, без английских слов и иностранных вкраплений.\n'+
  '5. ПРО ПРОДУКТ — ЖЁСТКО: НИКОГДА не упоминай газировку DZEN, банку, напиток или Додо Пиццу, если человек САМ прямо не спросил про напиток/банку/где купить. Ты эксперт, а не продавец. Если спросил: 0 г сахара, ~20 ккал/100 г, пребиотики, ~4 г клетчатки, без Е-шек, продаётся в Додо Пицце; говори «поддерживает», не «лечит».\n'+
  '6. Никаких диагнозов; при тревожных симптомах — одной строкой посоветуй врача и продолжи по существу.\n'+
  'Контекст человека из трекера: '+userCtx()+'.';
  CHAT_HIST.push({role:'user',content:text});
  if(CHAT_HIST.length>12)CHAT_HIST=CHAT_HIST.slice(-12);
  llm(sys,CHAT_HIST.slice(),function(raw){
    if(raw){var a=raw.trim();CHAT_HIST.push({role:'assistant',content:a});
      if(CHAT_HIST.length>12)CHAT_HIST=CHAT_HIST.slice(-12);cb(a);return;}
    for(var i=0;i<FAQ.length;i++)if(FAQ[i][0].test(text)){cb(FAQ[i][1]);return;}
    cb('Связь с нейронкой моргнула — повтори через пару секунд, я отвечу.');});}

/* распознавание речи */
function makeRecognizer(onText,onState){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  var listening=false,rec=null;
  return {supported:true,
    toggle:function(){
      if(listening){try{rec.stop();}catch(e){}return;}
      rec=new SR();rec.lang='ru-RU';rec.interimResults=false;rec.maxAlternatives=1;
      listening=true;onState(true);
      rec.onresult=function(e){listening=false;onState(false);onText(e.results[0][0].transcript);};
      rec.onerror=function(){listening=false;onState(false);};
      rec.onend=function(){if(listening){listening=false;onState(false);}};
      try{rec.start();}catch(e){listening=false;onState(false);}}};}

/* побег из встроенного браузера (Телеграм и т.п.) в Safari/Chrome */
(function(){
  var ua=navigator.userAgent||'';
  var iosInApp=/iPhone|iPad|iPod/.test(ua)&&/AppleWebKit/.test(ua)
    &&!/Safari\//.test(ua)&&!/CriOS|FxiOS|EdgiOS/.test(ua)&&!navigator.standalone;
  var andInApp=/Android/.test(ua)&&(/Telegram/i.test(ua)||/; wv\)/.test(ua));
  if(!iosInApp&&!andInApp)return;
  var url=location.href.split('#')[0];
  function go(){
    try{
      if(iosInApp){location.href='x-safari-'+url;}
      else{location.href='intent://'+url.replace(/^https?:\/\//,'')+
        '#Intent;scheme=https;S.browser_fallback_url='+encodeURIComponent(url)+';end';}
    }catch(e){}
  }
  var bar=document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999;background:#A8C96B;color:#14130F;'+
    'font:600 14px Inter,-apple-system,sans-serif;padding:10px 14px;display:flex;gap:10px;align-items:center;'+
    'justify-content:space-between;box-shadow:0 6px 20px rgba(0,0,0,.25);padding-top:calc(10px + env(safe-area-inset-top))';
  bar.innerHTML='<span>Лучше в браузере — там работает голос 🎙</span>';
  var b=document.createElement('button');
  b.textContent='Открыть';
  b.style.cssText='border:0;background:#14130F;color:#F4F1EA;border-radius:99px;padding:9px 18px;'+
    'font:700 14px Inter,-apple-system,sans-serif;cursor:pointer;flex:none';
  b.addEventListener('click',go);
  bar.appendChild(b);
  if(document.body)document.body.appendChild(bar);
  else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(bar);});
  setTimeout(go,700);
})();

/* живые фоны */
function initCinefades(){$$('.cinefade').forEach(function(box){
  if(box.dataset.ready)return;box.dataset.ready='1';
  var a=document.createElement('img'),b=document.createElement('img');
  a.src=box.dataset.imgA;b.src=box.dataset.imgB;a.alt='';b.alt='';a.className='show';
  box.appendChild(a);box.appendChild(b);var f=false;
  setInterval(function(){f=!f;a.classList.toggle('show',!f);b.classList.toggle('show',f);},8000);});}

/* конфетти */
function startConfetti(cv){var ctx=cv.getContext('2d');
  cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;
  var cols=['#A8C96B','#C2791B','#7A5C93','#C0563E','#FBFAF6'];var ps=[];
  for(var i=0;i<90;i++)ps.push({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*0.5,
    s:4+Math.random()*6,vy:1.5+Math.random()*2.5,vx:(Math.random()-0.5)*1.5,
    c:cols[i%cols.length],r:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.2});
  var fr=0;(function loop(){ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);
      ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);ctx.restore();});
    if(++fr<420)requestAnimationFrame(loop);else ctx.clearRect(0,0,cv.width,cv.height);})();}
