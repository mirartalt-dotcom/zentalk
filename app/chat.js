/* ============ DZEN · Энергия — чат-версия (тема задаётся страницей) ============ */
'use strict';
var T=window.DZEN_THEME,A=window.DZEN_ASSETS;

document.getElementById('app').innerHTML=
'<div class="chat-app">'+
' <div class="chat-head">'+
'  <img class="chat-ava" src="'+A+'img/mascot.jpg" alt="">'+
'  <div><div class="chat-head-name">Банка DZEN</div><div class="chat-head-st" id="head-st">онлайн · следит за энергией</div></div>'+
'  <div class="chat-head-btns">'+
'   <button class="chip-ic" id="hb-check" title="Замер дня">⚡</button>'+
'   <button class="chip-ic" id="hb-achv" title="Ачивки">🏆</button>'+
'   <button class="chip-ic" id="hb-remind" title="Напоминание">⏰</button>'+
'  </div></div>'+
' <div class="chat-scroll" id="scroll"></div>'+
' <div class="chat-input">'+
'  <button class="chat-btn chat-mic" id="mic" hidden>🎙</button>'+
'  <input id="inp" type="text" placeholder="Напиши или наговори…" autocomplete="off">'+
'  <button class="chat-btn chat-send" id="send">↑</button>'+
' </div></div>';

var SCROLL=$('#scroll');
function down(){SCROLL.scrollTop=SCROLL.scrollHeight;}
function el(html,cls){var d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=html;SCROLL.appendChild(d);down();return d;}
function meMsg(t){el(t,'msg me');}
var typingEl=null;
function typing(on){if(on&&!typingEl){typingEl=el('<i></i><i></i><i></i>','typing');}
  else if(!on&&typingEl){typingEl.remove();typingEl=null;}}
function botMsg(t,cb){typing(true);
  setTimeout(function(){typing(false);el(t,'msg bot');if(cb)cb();},450+Math.min(900,t.length*6));}
function clearChips(){$$('.chips,.chat-shelf,.msg-slider').forEach(function(c){c.remove();});}
function chips(list){ // [{t, fn}]
  var c=document.createElement('div');c.className='chips';
  list.forEach(function(it){var b=document.createElement('button');b.className='chip';b.textContent=it.t;
    b.addEventListener('click',function(){tick();clearChips();it.fn();});c.appendChild(b);});
  SCROLL.appendChild(c);down();}

/* слайдер в сообщении */
function sliderMsg(onDone){
  var d=document.createElement('div');d.className='msg-slider';
  d.innerHTML='<div class="can-viz"></div><div class="q-word"></div>'+
   '<div class="sld"><div class="sld-track"><div class="sld-fill"></div></div>'+
   '<input type="range" min="0" max="100" step="1" value="0"></div>'+
   '<button class="btn btn-pri" style="padding:12px">Готово</button>';
  var inp=d.querySelector('input'),sld=d.querySelector('.sld'),viz=d.querySelector('.can-viz'),w=d.querySelector('.q-word');
  function paint(){var v=+inp.value;sld.style.setProperty('--fill',v+'%');viz.innerHTML=canSVG(v);w.textContent=energyWord(v);}
  inp.addEventListener('input',function(){paint();if((+inp.value)%10===0)tick();});paint();
  d.querySelector('button').addEventListener('click',function(){var v=+inp.value;clearChips();onDone(v);});
  SCROLL.appendChild(d);down();}

/* ожидание ответа */
var pending=null; // {parse(text)->bool}
function expect(fn){pending=fn;}
function handleText(text){
  meMsg(text);
  if(pending){var h=pending;pending=null;
    if(h(text))return; /* обработано */
    pending=h; /* не понял — остаёмся в вопросе, но ответим по-человечески */}
  botTalk(text);}
function botTalk(text){typing(true);
  chatAnswer(text,function(ans){typing(false);el(ans,'msg bot');
    if(pending===null&&S.quiz&&S.habits.length)offerMain();});}
function num0100(text){var t=wordsToNums(text.toLowerCase());
  var m=t.match(/\d{1,3}/);if(!m)return null;var n=+m[0];return n>100?null:n;}

/* ---------- сценарии ---------- */
function greet(){
  var t=todayStr();
  if(!S.quiz){
    botMsg('Привет! Я банка DZEN 🥤 Слежу за твоей энергией, пока мир испытывает её на прочность: курс, ставка, новости…',function(){
    botMsg('Давай замерим, насколько ты в ресурсе. Это 4 вопроса, минута. Сколько сейчас энергии, 0–100?',function(){
      askEnergy(function(v){onbAns.energy=v;askSleep();});});});}
  else if(!S.habits.length){botMsg('Мы остановились на выборе привычки. Продолжим?',function(){showShelf();});}
  else if(S.lastCheck!==t){var d=Math.min((S.streak%7)+1,7);
    botMsg('С возвращением! Серия '+d+' из 7 ждёт замера — 30 секунд. Начнём?',function(){
      chips([{t:'⚡ Замерить день',fn:startCheck},{t:'Позже',fn:function(){botMsg('Ок, я тут. Кнопка ⚡ сверху — когда будешь готов.');}}]);});}
  else{botMsg('Сегодня уже засчитано ✓ Серия: '+S.streak+' '+plural(S.streak,'день','дня','дней')+' 🔥 Поболтаем? Спроси про энергию, привычки или банку.',function(){offerMain();});}
}
function offerMain(){clearChips();
  chips([{t:'⚡ Замер дня',fn:startCheck},{t:'🏆 Ачивки',fn:showAchv},{t:'⏰ Напоминание',fn:showRemind}]);}

/* онбординг */
var onbAns={};
function askEnergy(done){
  sliderMsg(function(v){meMsg('Энергия: '+v);done(v);});
  expect(function(text){var n=num0100(text);if(n===null)return false;clearChips();done(n);return true;});}
function askSleep(){
  botMsg('Сон — завод энергии. Сколько ночей за неделю ты лёг до 23:00?',function(){
    var m={'0–1':1,'2–3':3,'4–5':5,'6–7':7};
    chips(Object.keys(m).map(function(k){return {t:k,fn:function(){meMsg(k);onbAns.sleep=m[k];askSugar();}};}));
    expect(function(t){var n=num0100(t);if(n===null||n>7)return false;onbAns.sleep=n;askSugar();return true;});});}
function askSugar(){
  botMsg('Сахарные качели — главный вор заряда. Сколько дней из 7 обошёлся без сладкого?',function(){
    var m={'0–1':1,'2–3':3,'4–5':5,'6–7':7};
    chips(Object.keys(m).map(function(k){return {t:k,fn:function(){meMsg(k);onbAns.sugar=m[k];askStress();}};}));
    expect(function(t){var n=num0100(t);if(n===null||n>7)return false;onbAns.sugar=n;askStress();return true;});});}
function askStress(){
  botMsg('И про внешний мир: курс, ставка, новости. Насколько тебя штормит, 0–100?',function(){
    var m={'Штиль ~15':15,'Качает ~50':50,'Шторм ~85':85};
    chips(Object.keys(m).map(function(k){return {t:k,fn:function(){meMsg(k);onbAns.stress=m[k];onbDone();}};}));
    expect(function(t){var n=num0100(t);if(n===null)return false;onbAns.stress=n;onbDone();return true;});});}
function onbDone(){
  var a={energy:onbAns.energy,sleep:onbAns.sleep,sugar:onbAns.sugar,screen:3,move:3,stress:onbAns.stress};
  S.quiz={a:a,index:calcIndex(a),date:todayStr()};save();
  var v=verdict(S.quiz.index);
  botMsg('Считаю… готово. Твой индекс ресурса: '+S.quiz.index+' из 100.',function(){
  botMsg('«'+v[0]+'» — '+v[1],function(){
  var fs=factors(a),mf=fs[0];fs.forEach(function(f){if(f.v<mf.v)mf=f;});
  S.recommend=LEAK2HABIT[mf.id];save();
  botMsg('Больше всего утекает здесь: '+mf.name.toLowerCase()+'. Мой план простой: одна привычка на 7 дней. День = серия, неделя = сезон. Выбирай 👇',function(){showShelf();});});});}
function showShelf(){
  clearChips();
  var used=S.habits.map(function(h){return h.id;});
  var sh=document.createElement('div');sh.className='chat-shelf';
  HABITS.forEach(function(h){
    if(used.indexOf(h.id)>=0)return;
    var b=document.createElement('button');b.className='poster';
    var badge=(h.id===S.recommend&&!S.habits.length)?'<div class="poster-badge">⚡ лучший ход</div>':'';
    b.innerHTML='<img src="'+A+'img/'+h.img+'.jpg" alt="">'+badge+'<div class="poster-veil"></div>'+
     '<div class="poster-txt"><div class="poster-title" style="font-size:19px">'+h.title+'</div></div>';
    b.addEventListener('click',function(){clearChips();pickHabit(h);});
    sh.appendChild(b);});
  SCROLL.appendChild(sh);down();}
function pickHabit(h){
  var add=S.habits.length>0;
  S.habits.push({id:h.id,start:todayStr()});
  if(add&&!S.achv.spin)S.achv.spin=todayStr();
  save();pshh();meMsg(h.title);
  botMsg('Отличный выбор. «'+h.title+'» — '+h.why,function(){
  botMsg('Сезон запущен: 7 серий по 30 секунд. Вечером напомню? Могу через Telegram-бота или календарь.',function(){
    chips([{t:'⏰ Бот в Telegram',fn:function(){openBot();botMsg('Открыл бота — нажми там «Старт». Отключить: /stop.',offerMain);}},
           {t:'📅 В календарь',fn:function(){downloadICS();botMsg('Скинул файл напоминания — открой его, и календарь будет звать каждый вечер.',offerMain);}},
           {t:'Сам зайду',fn:function(){botMsg('Уважаю. Серия 1 — сегодня вечером. Я тут 🌿',offerMain);}}]);});});}

/* ежедневный замер */
var chk={};
function startCheck(){clearChips();
  if(S.lastCheck===todayStr()){botMsg('Сегодня уже засчитано ✓ Возвращайся завтра — серия в безопасности.',offerMain);return;}
  var d=Math.min((S.streak%7)+1,7);
  botMsg('Серия '+d+' из 7. Вопрос первый: сколько сегодня энергии? Можно голосом 🎙 — скажи всё сразу: «энергия 70, держался, было легко».',function(){
    askEnergy(function(v){chk.energy=v;askKept(0);});});}
function askKept(i){
  if(i>=S.habits.length){askHard();return;}
  var h=habit(S.habits[i].id);
  botMsg(h.daily,function(){
    chips([{t:'Да, чисто',fn:function(){meMsg('Да');chk['k'+i]=90;askKept(i+1);}},
           {t:'Наполовину',fn:function(){meMsg('Наполовину');chk['k'+i]=55;askKept(i+1);}},
           {t:'Сорвался',fn:function(){meMsg('Сорвался');chk['k'+i]=10;askKept(i+1);}}]);
    expect(function(t){var p=localParse(t);if(p.kept===null)return false;chk['k'+i]=p.kept;askKept(i+1);return true;});});}
function askHard(){
  botMsg('И насколько тяжело далось?',function(){
    chips([{t:'Легко',fn:function(){meMsg('Легко');chk.hard=12;finishCheck();}},
           {t:'Нормально',fn:function(){meMsg('Нормально');chk.hard=45;finishCheck();}},
           {t:'На зубах',fn:function(){meMsg('На зубах');chk.hard=85;finishCheck();}}]);
    expect(function(t){var p=localParse(t);if(p.hard===null)return false;chk.hard=p.hard;finishCheck();return true;});});}
function finishCheck(){
  var kept=[];S.habits.forEach(function(h,i){kept.push(chk['k'+i]!=null?chk['k'+i]:70);});
  var rec={energy:chk.energy||0,kept:kept,hard:chk.hard||50};
  var out=checkInDay(rec);chk={};pshh();
  if(out.finale){finale(out.finale);return;}
  var dv=dayVerdict(rec);
  botMsg(dv.em+' '+dv.ti+' '+dv.su,function(){
  botMsg('🔥 Серия: '+S.streak+' '+plural(S.streak,'день','дня','дней')+'. '+(7-((S.streak-1)%7+1)>0?('До финала сезона: '+(7-((S.streak-1)%7+1))+' '+plural(7-((S.streak-1)%7+1),'серия','серии','серий')+'.'):''),offerMain);});}
function finale(days){
  botMsg('🏆 ФИНАЛ СЕЗОНА! '+days+' дней подряд. Ты правда красавчик.',function(){
    var cv=document.createElement('canvas');cv.width=1080;cv.height=1350;
    drawShareCard(cv,days,null);
    setTimeout(function(){
      var d=document.createElement('div');d.className='msg bot';
      var img=new Image();img.className='msg-img';img.src=cv.toDataURL('image/png');
      d.appendChild(img);SCROLL.appendChild(d);down();
      chips([{t:'📤 Поделиться в Telegram',fn:function(){shareCard(cv,'🏆 Финал сезона: '+days+' дней подряд — «'+habit(S.habits[0].id).title+'». Замерь свою энергию:');offerNext(days);}},
             {t:'💾 Скачать',fn:function(){saveCard(cv);offerNext(days);}},
             {t:'Дальше',fn:function(){offerNext(days);}}]);},600);});}
function offerNext(days){
  if(days===7&&S.habits.length<2){
    botMsg('Открылся сезон 2 — можно добавить вторую привычку. Хочешь?',function(){
      chips([{t:'🌿 Добавить вторую',fn:showShelf},{t:'Пока хватит одной',fn:function(){botMsg('Мудро. Лучше одна живая, чем две мёртвые.',offerMain);}}]);});}
  else offerMain();}

/* шапка */
$('#hb-check').addEventListener('click',function(){ac();startCheck();});
function showAchv(){clearChips();
  var got=ACHV.filter(function(a){return S.achv[a.id];}),lock=ACHV.filter(function(a){return !S.achv[a.id];});
  var t='Твои ачивки:\n'+(got.length?got.map(function(a){return a.ic+' '+a.t;}).join('\n'):'— пока пусто, всё впереди')+
    (lock.length?('\n\nВпереди:\n'+lock.map(function(a){return '🔒 '+a.t;}).join('\n')):'');
  botMsg(t,offerMain);}
$('#hb-achv').addEventListener('click',showAchv);
function showRemind(){clearChips();
  botMsg('Напомню замерить день каждый вечер в '+(S.remind||'21:30')+'. Как удобнее?',function(){
    chips([{t:'⏰ Бот в Telegram',fn:function(){openBot();botMsg('Открыл бота — нажми «Старт». Отключить: /stop.',offerMain);}},
           {t:'📅 Календарь',fn:function(){downloadICS();botMsg('Скинул файл — открой, и календарь будет звать вечером.',offerMain);}}]);});}
$('#hb-remind').addEventListener('click',showRemind);

/* ввод */
$('#send').addEventListener('click',function(){var v=$('#inp').value.trim();
  if(!v)return;$('#inp').value='';ac();handleText(v);});
$('#inp').addEventListener('keydown',function(e){if(e.key==='Enter')$('#send').click();});
(function(){var mic=$('#mic');
  var R=makeRecognizer(function(text){handleText(text);},
    function(on){mic.classList.toggle('listening',on);mic.textContent=on?'🔴':'🎙';});
  if(!R)return;mic.hidden=false;
  mic.addEventListener('click',function(){ac();R.toggle();});})();

greet();
