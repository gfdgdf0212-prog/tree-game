let THREE=null;
try{THREE=await import('three');}catch(e){console.warn('Three.js не загрузился — используется 2D-дерево',e);}
(() => {
'use strict';
const $=s=>document.querySelector(s);
const TAU=Math.PI*2, ISO=0.62, KEY='drevo.save.v9';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

let gameSpeed=1, gfxQuality='full', showDmg=true, toastsOn=true;
const QUAL={low:{dpr:1,parts:80,scen:0.6},med:{dpr:2,parts:220,scen:1},high:{dpr:2,parts:360,scen:1.3}};
function partCap(){return gfxQuality==='low'?80:220;}
const LOW_GFX=()=>gfxQuality==='low';

const CONFIG={
ENEMY:{ HP_EXP:7, RW_EXP:7, G_COEF:0.10, BOSS_HP:90, BOSS_RW:45,
BOSS_HP_PER_WAVE:1.0004, BOSS_DMG_PER_WAVE:1.0002, HP_MUL:1.8 },
UPG:{ EXP:12, KC:0.015, LVL_CAP:9999,
base:{dmg:20,spd:30,rad:120,cc:60,cd:70,hp:25,regen:40} },
STAT:{
dmg:L=>10*Math.pow(1+0.02*L,10),
spd:L=>1+0.045*Math.sqrt(L),
hp :L=>100*Math.pow(1+0.02*L,9),
cc :L=>Math.min(0.6,0.0008*L),
cd :L=>1.5+0.0015*L,
rad:L=>85+0.4*L,
regen:L=>0.004+0.002*L,
spdCap:8, ccCap:0.7, cdCap:4 },
QUOTA:w=>Math.min(40, 8+chapterOf(w)),
AFK_RATE_K:0.30, AFK_CAP_H:8,
SPIN_COST:15, START_DEW:0, START_SEEDS:500,
TIER_WEIGHTS:[
{common:90,rare:9,epic:1,legendary:0,mythic:0},
{common:70,rare:22,epic:7,legendary:1,mythic:0},
{common:50,rare:30,epic:16,legendary:3.9,mythic:0.1},
{common:30,rare:31,epic:27,legendary:10.5,mythic:1.5},
{common:15,rare:30,epic:35,legendary:18,mythic:2}],
ABIL_BASE:{common:100,rare:400,epic:1200,legendary:2500,mythic:7000},
ROULETTE:{ SWAP_COUNT:10, GATHER_MS:70, DEAL_MS:130, LIFT_MS:100, SETTLE_MS:35 },
ART_DROP:{common:0.08,rare:0.04,epic:0.015,legendary:0.003,mythic:0.0005}
};

const SUFFIX=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc','QaDc','QiDc','SxDc','SpDc','OcDc','NoDc','Vg','UVg','DVg','TVg','QaVg','QiVg','SxVg','SpVg','OcVg','NoVg','Tg','UTg','DTg','TTg','QaTg','QiTg','SxTg','SpTg','OcTg','NoTg','Sg','USg','DSg','TSg','QaSg','QiSg','SxSg','SpSg','OcSg','NoSg','Og','UOg','DOg','TOg','QaOg','QiOg','SxOg','SpOg','OcOg','NoOg','Ng','UNg','DNg','TNg','QaNg','QiNg','SxNg','SpNg','OcNg','NoNg','Ct'];

function fmt(n){
if(typeof n==='string'){if(/^[\d.]+[KMBTQa-zA-Z]*$/.test(n))return n;}
n=+n;if(!isFinite(n)||isNaN(n))n=0;n=Math.floor(n);
if(n<1000)return''+n;
let i=0,x=n;
while(x>=1000&&i<SUFFIX.length-1){x/=1000;i++;}
let s=(x<10?x.toFixed(2):x<100?x.toFixed(1):''+Math.round(x)).replace(/\.0+$|(\.\d*[1-9])0+$/,'$1');
return s+SUFFIX[i];}
const fmtS=v=>{v=+v;if(!isFinite(v)||isNaN(v))v=0;return v<10?v.toFixed(1):v<100?''+Math.round(v):fmt(v);};
function fmtTime(s){s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;
if(h)return h+' ч '+m+' мин';if(m)return m+' мин '+sec+' сек';return sec+' сек';}
function dayKey(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function safeInt(v,def){const n=parseInt(v,10);return(isFinite(n)&&!isNaN(n))?n:def;}

const I18N={
ru:{stage:'Этап',boss:'Босс',revive:'🌱 Возродить древо',
newAbil:' — новая способность!',maxEquip:'Достигнут лимит слотов способностей',
fromRoulette:'Способность находится в картах',chap:'Этап',chapDone:'пройден',
resetConfirm:'Сбросить ВЕСЬ прогресс?',protect:'защитите древо',revived:'улучшите его, чтобы выстоять',
qDaily:'Ежедневные',qWave:'Этап',qOnce:'Разовые',qHunt:'Охота',qClaim:'Взять',qDone:'✓',qAll:'Забрать всё',
dmgFirst:'Сначала прокачайте урон',skillCap:'Можно прокачать только 3 способности',
artNew:'Новый артефакт: ',artFull:'Слоты артефактов заполнены',
pass:'Пропуск',max:'Макс',claim:'Забрать',claimAll:'Забрать всё',equipped:'Экипировано',
upgTitle:'Статы древа',cardsTitle:'Карты способностей',treeTitle:'Древо прокачки',abilTitle:'Скиллы',
questTitle:'Задания',passTitle:'Боевой пропуск',shopTitle:'Магазин обликов',setTitle:'Настройки',artTitle:'Артефакты',
volume:'Громкость',shake:'Тряска экрана',speed:'Скорость игры',graphics:'Графика',dmgNums:'Цифры урона',
notifs:'Уведомления',lang:'Язык',gfxFull:'Полная',gfxLow:'Низкая',on:'Вкл',off:'Выкл',amber:'янтаря',seeds:'семян',
afkTitle:'Пока вас не было…',afkSub:'Древо держало оборону',afkClaim:'Забрать награду',overTitle:'Древо пало…',
mutTitle:'Выберите мутацию',mutSub:'Глава пройдена — древо мутирует',enemies:'врагов',
tabBoost:'Статы',tabCards:'Карты',tabTree:'Ветки',tabSkills:'Скиллы',tabArt:'Артеф.',tabQuests:'Задания',tabShop:'Лавка',
uDmg:'Урон',uSpd:'Скорость',uRad:'Радиус',uCc:'Крит. шанс',uCd:'Крит. урон',uHp:'Кора',uRegen:'Регенерация'},
en:{stage:'Stage',boss:'Boss',revive:'🌱 Revive the tree',
newAbil:' — new ability!',maxEquip:'Ability slot cap reached',fromRoulette:'Ability is found in cards',
chap:'Stage',chapDone:'cleared',resetConfirm:'Reset ALL progress?',protect:'protect the tree',revived:'upgrade it to stand firm',
qDaily:'Daily',qWave:'Stage',qOnce:'One-time',qHunt:'Hunt',qClaim:'Claim',qDone:'✓',qAll:'Claim all',
dmgFirst:'Upgrade damage first',skillCap:'Only 3 abilities can be maxed',
artNew:'New artifact: ',artFull:'Artifact slots full',
pass:'Pass',max:'Max',claim:'Claim',claimAll:'Claim All',equipped:'Equipped',
upgTitle:'Tree Upgrades',cardsTitle:'Ability Cards',treeTitle:'Skill Tree',abilTitle:'Abilities',
questTitle:'Quests',passTitle:'Battle Pass',shopTitle:'Skin Shop',setTitle:'Settings',artTitle:'Artifacts',
volume:'Volume',shake:'Screen Shake',speed:'Game Speed',graphics:'Graphics',dmgNums:'Damage Numbers',
notifs:'Notifications',lang:'Language',gfxFull:'Full',gfxLow:'Low',on:'On',off:'Off',amber:'amber',seeds:'seeds',
afkTitle:'While you were away…',afkSub:'The tree held defense for',afkClaim:'Claim Reward',overTitle:'The tree has fallen…',
mutTitle:'Choose a Mutation',mutSub:'Chapter cleared — the tree mutates',enemies:'enemies',
tabBoost:'Boost',tabCards:'Cards',tabTree:'Branches',tabSkills:'Skills',tabArt:'Artifacts',tabQuests:'Quests',tabShop:'Shop',
uDmg:'Damage',uSpd:'Speed',uRad:'Range',uCc:'Crit Chance',uCd:'Crit Dmg',uHp:'Bark',uRegen:'Regen'}
};

const t=(k,o)=>{let s=(I18N[S.lang]||I18N.ru)[k]||k;if(o)for(const p in o)s=s.replace('{'+p+'}',o[p]);return s;};
function stageOf(wave){return `${Math.floor((wave-1)/7)+1}-${((wave-1)%7)+1}`;}
function chapterOf(wave){return Math.floor((wave-1)/7)+1;}
function slotCap(){const ch=chapterOf(S.bestWave);
if(ch>=250)return 6;if(ch>=200)return 5;if(ch>=130)return 4;if(ch>=50)return 3;return 2;}
function bossCount(){return clamp(1+Math.floor((chapterOf(S.wave)-100)/50),1,5);}
function enemyScaleHP(G){return Math.pow(1+CONFIG.ENEMY.G_COEF*G, CONFIG.ENEMY.HP_EXP);}
function enemyScaleRW(G){return Math.pow(1+CONFIG.ENEMY.G_COEF*G, CONFIG.ENEMY.RW_EXP);}
function enemyScaleDMG(G){return Math.pow(1+CONFIG.ENEMY.G_COEF*G,5)*1.2;}
function passReward(s){
if(s<=5)return 7+s;
if(s===10)return 20;if(s===15)return 25;
if(s%100===0)return 300+(s/100)*100;
if(s%50===0)return 180+(s/50)*30;
if(s%25===0)return 100+(s/25)*12;
if(s%5===0)return 40+(s/5)*4;
return 0;}
function passMilestones(){const l=[1,2,3,4,5,10,15];for(let s=20;s<=1000;s+=5)l.push(s);return l;}

const TIERS={
common:{name:{ru:'Обычная',en:'Common'},c:'#9db8a4',g:'157,184,164',idx:0},
rare:{name:{ru:'Редкая',en:'Rare'},c:'#5aa9e6',g:'90,169,230',idx:1},
epic:{name:{ru:'Эпическая',en:'Epic'},c:'#b07fd8',g:'176,127,216',idx:2},
legendary:{name:{ru:'Легендарная',en:'Legendary'},c:'#f0a848',g:'240,168,72',idx:3},
mythic:{name:{ru:'Мифическая',en:'Mythic'},c:'#ff6b8a',g:'255,107,138',idx:4}};

function tierStage(){const ch=chapterOf(S.bestWave);
if(ch>=250)return 5;if(ch>=200)return 4;if(ch>=130)return 3;if(ch>=50)return 2;return 1;}

const ABIL=[
{k:'seedshot',n:{ru:'Семена-снаряды',en:'Seed Shots'},short:{ru:'Семена',en:'Seeds'},tier:'common',kind:'multi-seed',
desc:{ru:'Базовая атака: 1 снаряд за уровень. Урон: 50% на 1-м, 100% на 3-м, +12% далее',en:'Base attack: 1 projectile per level. Dmg: 50% at 1st, 100% at 3rd, +12% after'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 14V8M8 8 3.5 3M8 8l4.5-5M8 8V2.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'},
{k:'multishot',n:{ru:'Мультивыстрел',en:'Multishot'},short:{ru:'Мульти',en:'Multi'},tier:'rare',kind:'multi-seed',
desc:{ru:'+1 доп. снаряд за уровень. Каждый доп. снаряд наносит 60% урона',en:'+1 extra projectile per level. Each deals 60% dmg'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 14V8M8 8 2.5 4M8 8l5.5-4M8 8 5 2.5M8 8l3-5.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'},
{k:'bounce',n:{ru:'Отскок',en:'Bounce'},short:{ru:'Отскок',en:'Bounce'},tier:'common',kind:'multi-bounce',
desc:{ru:'Семя отскакивает к соседу (1 отскок). Урон отскока: 10% +8% за уровень',en:'Seed bounces to a neighbor (1 bounce). Bounce dmg: 10% +8% per level'},
svg:'<svg viewBox="0 0 16 16"><path d="M2 12 6 4l4 8 4-8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
{k:'thorns',n:{ru:'Острые шипы',en:'Sharp Thorns'},short:{ru:'Шипы',en:'Thorns'},tier:'common',kind:'pass-seed',
desc:{ru:'% к урону семян от базового',en:'% to seed dmg from base'},
svg:'<svg viewBox="0 0 16 16"><path d="M3 14c1-4 1-7 0-10M8 14c1.5-4.5 1.5-8.5 0-12.5M13 14c-1-4-1-7 0-10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'},
{k:'thornsalvo',n:{ru:'Шипастый залп',en:'Thorn Salvo'},short:{ru:'Залп',en:'Salvo'},tier:'rare',kind:'thornsalvo',
desc:{ru:'Крона мечет веер шипов',en:'Crown throws a fan of thorns'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 13V5M8 5 4 2M8 5l4-3M8 5 2 6M8 5l6-1" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>'},
{k:'vinewhip',n:{ru:'Удар лозой',en:'Vine Whip'},short:{ru:'Лоза',en:'Vine'},tier:'rare',kind:'vinewhip',
desc:{ru:'Лиана хлещет дугой и отбрасывает',en:'Vine lashes in an arc, knocks back'},
svg:'<svg viewBox="0 0 16 16"><path d="M3 13C3 8 7 4 13 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M13 4l-2 1M13 4l-1 2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>'},
{k:'deeproots',n:{ru:'Глубокие корни',en:'Deep Roots'},short:{ru:'Корни',en:'Roots'},tier:'rare',kind:'pass-root',
desc:{ru:'% к урону корней от базового',en:'% to root dmg from base'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 2v5M8 7c0 3-3.2 3.2-4.2 6.5M8 7c0 3 3.2 3.2 4.2 6.5M8 7v7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'},
{k:'frost',n:{ru:'Ледяной укол',en:'Frost Spike'},short:{ru:'Лёд',en:'Frost'},tier:'rare',kind:'active-single',
desc:{ru:'Попадание семени наносит доп. урон льдом',en:'Seed hit deals bonus frost dmg'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 2v12M2.8 5l10.4 6M13.2 5 2.8 11" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'},
{k:'spores',n:{ru:'Ядовитые споры',en:'Toxic Spores'},short:{ru:'Споры',en:'Spores'},tier:'epic',kind:'spores',
desc:{ru:'Облако спор ползёт и травит',en:'Spore cloud drifts and poisons'},
svg:'<svg viewBox="0 0 16 16"><circle cx="6" cy="7" r="2.4" fill="currentColor" opacity=".7"/><circle cx="10" cy="9" r="1.8" fill="currentColor" opacity=".5"/><circle cx="9" cy="5" r="1.3" fill="currentColor" opacity=".6"/></svg>'},
{k:'crownwrath',n:{ru:'Гнев кроны',en:'Crown Wrath'},short:{ru:'Гнев',en:'Wrath'},tier:'epic',kind:'crownwrath',
desc:{ru:'Сучья падают на цели сверху',en:'Branches fall on targets from above'},
svg:'<svg viewBox="0 0 16 16"><path d="M4 2 6 12M9 2 8 12M13 3 11 12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'},
{k:'branch',n:{ru:'Живые ветви',en:'Living Branches'},short:{ru:'Ветви',en:'Branch'},tier:'epic',kind:'active-aoe',
desc:{ru:'Ветви сметают врагов вблизи',en:'Branches sweep nearby foes'},
svg:'<svg viewBox="0 0 16 16"><path d="M3 14C6 9 6.5 5.5 13 2M7.6 7.4c1.6.6 3.1.3 4.2-1M5.9 10.2c1.8.4 3.3 0 4.5-1.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'},
{k:'leafstorm',n:{ru:'Листопад',en:'Leafstorm'},short:{ru:'Листья',en:'Leaves'},tier:'epic',kind:'active-aoe',
desc:{ru:'Кольцо листьев разлетается от ствола',en:'Ring of leaves bursts'},
svg:'<svg viewBox="0 0 16 16"><path d="M4 13C4 7 8 3 13 3c0 5-4 9-9 10Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M4 13C7 9.5 9 7.5 12 4.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>'},
{k:'bleed',n:{ru:'Едкий сок',en:'Acerbic Sap'},short:{ru:'Сок',en:'Sap'},tier:'epic',kind:'dot',
desc:{ru:'Удары копят стаки кровотечения',en:'Hits stack bleed'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 4 6 4 9a4 4 0 0 0 8 0C12 6 8 1.5 8 1.5Z" fill="currentColor"/><path d="M12.8 12.2v2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'},
{k:'roottrap',n:{ru:'Корневой капкан',en:'Root Trap'},short:{ru:'Капкан',en:'Trap'},tier:'legendary',kind:'roottrap',
desc:{ru:'Корни смыкаются клеткой вокруг врага',en:'Roots close into a cage'},
svg:'<svg viewBox="0 0 16 16"><path d="M3 13V5M6 13V4M10 13V4M13 13V5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M3 5q5 -3 10 0" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>'},
{k:'fruitbomb',n:{ru:'Плоды-бомбы',en:'Fruit Bombs'},short:{ru:'Плоды',en:'Fruit'},tier:'legendary',kind:'fruitbomb',
desc:{ru:'Плоды катятся и взрываются',en:'Fruits roll and explode'},
svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="9" r="4" fill="currentColor"/><path d="M8 5V2M8 2l2-1" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>'},
{k:'rootnet',n:{ru:'Сеть корней',en:'Root Net'},short:{ru:'Сеть',en:'Net'},tier:'legendary',kind:'multi-root',
desc:{ru:'+1 корень одновременно за уровень',en:'+1 simultaneous root per level'},
svg:'<svg viewBox="0 0 16 16"><circle cx="4" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="8" cy="4" r="1.7" fill="currentColor"/><path d="M5 11l2.3-5.3M11 11 8.7 5.7M5.7 12h4.6" stroke="currentColor" stroke-width="1.3"/></svg>'},
{k:'acidsap',n:{ru:'Кислотная живица',en:'Acidic Resin'},short:{ru:'Кислота',en:'Acid'},tier:'mythic',kind:'acidsap',
desc:{ru:'Струя смолы оставляет ядовитую лужу',en:'Resin stream leaves a toxic puddle'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 2v6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="8" cy="11" rx="5" ry="2.4" fill="currentColor"/></svg>'},
{k:'avatar',n:{ru:'Аватар рощи',en:'Grove Avatar'},short:{ru:'Аватар',en:'Avatar'},tier:'mythic',kind:'pass-all',
desc:{ru:'Огромный % ко всему урону древа',en:'Huge % to all tree dmg'},
svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".55"/><path d="M7.3 13V9.5h1.4V13" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="7" r="3" fill="currentColor"/></svg>'},
{k:'rootBounce',n:{ru:'Рикошет семян',en:'Seed Ricochet'},short:{ru:'Рикошет',en:'Ricochet'},tier:'mythic',kind:'multi-seedbounce',
desc:{ru:'Семя отскакивает без потери урона (+1 цель за уровень)',en:'Seed bounces without dmg loss (+1 target per level)'},
svg:'<svg viewBox="0 0 16 16"><path d="M2 12 6 4l4 8 4-8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'}];

const ABIL_BY_K=Object.fromEntries(ABIL.map(a=>[a.k,a]));
const LN=o=>o[S.lang]||o.ru;
const isExSeed=()=>!!S.tutorialDone&&(S.abilities.seedshot||0)>0;
const ab=k=>k==='seedshot'?(isExSeed()?(S.abilities.seedshot||0):0):(S.equip.includes(k)?(S.abilities[k]||0):0);
function abilPct(k){const a=ABIL_BY_K[k];const l=ab(k);if(!a||!l)return 0;return CONFIG.ABIL_BASE[a.tier]*(1+0.10*(l-1));}
function seedDmgPct(l){if(l<=0)return 0;if(l<=3)return 25+l*25;return 100+(l-3)*12;}
function bounceDmgPct(l){return l>0?(10+(l-1)*8)/100:0;}
function multishotDmgPct(l){return l>0?60:0;}
function abilCd(k,lvl){if(!lvl)return null;switch(k){
case 'thornsalvo':return Math.max(1.4,2.4-0.12*lvl);
case 'vinewhip':return Math.max(2,3.2-0.15*lvl);
case 'spores':return Math.max(3,5-0.2*lvl);
case 'crownwrath':return Math.max(2.4,4-0.2*lvl);
case 'roottrap':return Math.max(3.5,6-0.3*lvl);
case 'fruitbomb':return Math.max(3,5-0.25*lvl);
case 'acidsap':return Math.max(2.5,4-0.2*lvl);
default:return null;}}

const IC={
grow:'<svg viewBox="0 0 16 16"><path d="M8 14V8M8 8C8 5 5.5 3.5 3 3.5 3 6.5 5.5 8 8 8Zm0 0c0-3 2.5-4.5 5-4.5 0 3-2.5 4.5-5 4.5Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></svg>',
spd:'<svg viewBox="0 0 16 16"><path d="M2.5 5.5h7a2.3 2.3 0 1 0-2.3-2.3M2.5 9.5h10a2.3 2.3 0 1 1-2.3 2.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
hp:'<svg viewBox="0 0 16 16"><path d="M8 1.5l5.5 2.2v3.8c0 3.6-2.4 6.2-5.5 7-3.1-.8-5.5-3.4-5.5-7V3.7L8 1.5Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>',
crit:'<svg viewBox="0 0 16 16"><path d="M9 1.5 4 9h3.5L7 14.5 12 7H8.5L9 1.5Z" fill="currentColor"/></svg>',
rad:'<svg viewBox="0 0 16 16"><path d="M8 2v4M8 6 3 13M8 6l5 7M8 6v8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
critd:'<svg viewBox="0 0 16 16"><path d="M8 1.5 9.6 5.4 13.8 5.7 10.6 8.4 11.6 12.5 8 10.3 4.4 12.5 5.4 8.4 2.2 5.7 6.4 5.4 8 1.5Z" fill="currentColor"/></svg>',
alls:'<svg viewBox="0 0 16 16"><path d="M2 5h8a2 2 0 1 0-2-2M2 8h11a2 2 0 1 1-2 2M2 11h6a1.6 1.6 0 1 1-1.6 1.6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
thorn:'<svg viewBox="0 0 16 16"><path d="M3 14c1-4 1-7 0-10M8 14c1.5-4.5 1.5-8.5 0-12.5M13 14c-1-4-1-7 0-10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
afkt:'<svg viewBox="0 0 16 16"><path d="M13.6 9.7A6 6 0 0 1 6.3 2.4a6.3 6.3 0 1 0 7.3 7.3Z" fill="currentColor"/></svg>',
alld:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".55"/><path d="M7.3 13V9.5h1.4V13" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="7" r="3" fill="currentColor"/></svg>',
deep:'<svg viewBox="0 0 16 16"><path d="M8 2v5M8 7c0 3-3.2 3.2-4.2 6.5M8 7c0 3 3.2 3.2 4.2 6.5M8 7v7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
seed:'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.2 6 3.2 9.6a4.8 4.8 0 0 0 9.6 0C12.8 6 8 1.5 8 1.5Z" fill="currentColor"/></svg>',
net:'<svg viewBox="0 0 16 16"><circle cx="4" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="8" cy="4" r="1.7" fill="currentColor"/><path d="M5 11l2.3-5.3M11 11 8.7 5.7M5.7 12h4.6" stroke="currentColor" stroke-width="1.3"/></svg>',
trap:'<svg viewBox="0 0 16 16"><path d="M3 13V5M6 13V4M10 13V4M13 13V5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
multi:'<svg viewBox="0 0 16 16"><path d="M8 14V8M8 8 2.5 4M8 8l5.5-4M8 8 5 2.5M8 8l3-5.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'};

const SKDEF=[
{k:'r_root',stat:'sRoot',parent:null,max:1,x:270,y:760,base:20,zone:'root',n:{ru:'Сила роста',en:'Growth Power'},d:{ru:'+10% урона древа',en:'+10% tree dmg'},svg:IC.grow},
{k:'r_dmg1',stat:'sDeep',parent:'r_root',max:1,x:150,y:650,base:50,zone:'root',n:{ru:'Глубинные жилы',en:'Deep Veins'},d:{ru:'+25% урона корней',en:'+25% root dmg'},svg:IC.deep},
{k:'r_spd1',stat:'sSpd',parent:'r_root',max:1,x:390,y:650,base:50,zone:'root',n:{ru:'Гибкость ветвей',en:'Lithe Branches'},d:{ru:'+8% скорости атаки',en:'+8% attack speed'},svg:IC.spd},
{k:'r_net1',stat:'sRootNet',parent:'r_dmg1',parent2:'r_spd1',max:1,x:270,y:545,base:90,zone:'root',n:{ru:'Сеть корней',en:'Root Net'},d:{ru:'+1 корень одновременно',en:'+1 simultaneous root'},svg:IC.net},
{k:'r_dmg2',stat:'sDeep',parent:'r_net1',max:1,x:150,y:440,base:130,zone:'root',n:{ru:'Мощь недр',en:'Might of Depths'},d:{ru:'+25% урона корней',en:'+25% root dmg'},svg:IC.deep},
{k:'r_trap',stat:'sTrapPow',parent:'r_net1',max:1,x:390,y:440,base:130,zone:'root',n:{ru:'Хватка капкана',en:'Trap Grip'},d:{ru:'+20% силы капкана',en:'+20% trap power'},svg:IC.trap},
{k:'r_final',stat:'sAllDmg',parent:'r_dmg2',parent2:'r_trap',max:1,x:270,y:335,base:250,zone:'root',n:{ru:'Дух рощи',en:'Grove Spirit'},d:{ru:'+25% ко всему урону',en:'+25% ALL damage'},svg:IC.alld},
{k:'s_seed',stat:'sSeedDmg',parent:null,max:1,x:270,y:30,base:20,zone:'seed',n:{ru:'Золотые семена',en:'Golden Seeds'},d:{ru:'+15% урона семян',en:'+15% seed dmg'},svg:IC.seed},
{k:'s_aspd1',stat:'sSpd',parent:'s_seed',max:1,x:150,y:135,base:50,zone:'seed',n:{ru:'Быстрые побеги',en:'Swift Shoots'},d:{ru:'+8% скорости атаки',en:'+8% attack speed'},svg:IC.spd},
{k:'s_crit1',stat:'sCrit',parent:'s_seed',max:1,x:390,y:135,base:50,zone:'seed',n:{ru:'Меткость побегов',en:'Shoot Aim'},d:{ru:'+5% крит. шанса',en:'+5% crit chance'},svg:IC.crit},
{k:'s_multi1',stat:'sSeedCount',parent:'s_aspd1',parent2:'s_crit1',max:1,x:270,y:240,base:90,zone:'seed',n:{ru:'Обильный посев',en:'Bountiful Sowing'},d:{ru:'+1 снаряд семян',en:'+1 seed projectile'},svg:IC.multi},
{k:'s_critd1',stat:'sCritDmg',parent:'s_multi1',max:1,x:150,y:345,base:130,zone:'seed',n:{ru:'Вес ветвей',en:'Branch Weight'},d:{ru:'+10% крит. урона',en:'+10% crit damage'},svg:IC.critd},
{k:'s_thorn1',stat:'sThorn',parent:'s_multi1',max:1,x:390,y:345,base:130,zone:'seed',n:{ru:'Терновый венец',en:'Thorn Crown'},d:{ru:'+25% урона семян',en:'+25% seed dmg'},svg:IC.thorn},
{k:'s_final',stat:'sAllDmg',parent:'s_critd1',parent2:'s_thorn1',max:1,x:270,y:450,base:250,zone:'seed',n:{ru:'Штормовой ветер',en:'Storm Wind'},d:{ru:'+25% ко всему урону',en:'+25% ALL damage'},svg:IC.alls}];

const sk=k=>(S.skill&&S.skill[k])||0;
function statCount(st){let s=0;for(const n of SKDEF)if(n.stat===st)s+=sk(n.k);return s;}
function nodeMax(n){return n.max||1;}
const skCost=n=>n.base;
function nodeUnlocked(n){
if(!n.parent)return true;
if(sk(n.parent)>=1)return true;
if(n.parent2&&sk(n.parent2)>=1)return true;
return false;}

const TREE_SKINS={
oak:{name:{ru:'Древо-хранитель',en:'Guardian Tree'},style:'oak',cost:0,
trunk:['#6b5138','#4a3826'],canopy:['#2c5f41','#3a7a52','#4b9463','#5fae74'],
glow:'128,224,168',leafC:'142,196,140',leafKind:'leaf',orb:'#a9e8c4',fruit:'#f2cf7e',
svg:'<svg viewBox="0 0 40 44"><path d="M18 42v-14h4v14z" fill="#5d452e"/><circle cx="20" cy="18" r="11" fill="#3a7a52"/><circle cx="12" cy="22" r="7" fill="#2c5f41"/><circle cx="28" cy="22" r="7" fill="#2c5f41"/><circle cx="20" cy="12" r="7" fill="#5fae74"/></svg>'},
willow:{name:{ru:'Плакучая ива',en:'Weeping Willow'},style:'willow',cost:12,
trunk:['#5d6b4a','#3f4a33'],canopy:['#2f6b5e','#3f8a74','#57a88b','#79c4a4'],
glow:'120,220,200',leafC:'126,204,178',leafKind:'leaf',orb:'#b8f0dc',fruit:'#e6f7c9',
svg:'<svg viewBox="0 0 40 44"><path d="M18.5 42V24h3v18z" fill="#4a5638"/><ellipse cx="20" cy="16" rx="11" ry="8" fill="#3f8a74"/><path d="M10 18q-1 10-3 16M15 21q-1 9-2 15M25 21q1 9 2 15M30 18q1 10 3 16M20 22v14" stroke="#57a88b" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'},
sakura:{name:{ru:'Цветущая сакура',en:'Blooming Sakura'},style:'sakura',cost:18,
trunk:['#7a5a4a','#54402f'],canopy:['#a85a74','#c97a92','#e59ab0','#f6bcd0'],
glow:'240,160,196',leafC:'240,150,180',leafKind:'petal',orb:'#ffd7e4',fruit:'#ff9ec0',
svg:'<svg viewBox="0 0 40 44"><path d="M18 42v-14h4v14z" fill="#54402f"/><circle cx="20" cy="17" r="11" fill="#c97a92"/><circle cx="11" cy="21" r="7.5" fill="#a85a74"/><circle cx="29" cy="21" r="7.5" fill="#a85a74"/><circle cx="20" cy="11" r="7.5" fill="#f6bcd0"/></svg>'},
rune:{name:{ru:'Руническое древо',en:'Rune Tree'},style:'rune',cost:20,
trunk:['#5a4a32','#3a2e1e'],canopy:['#2c5f41','#3a7a52','#4b9463','#5fae74'],
glow:'120,230,220',leafC:'150,210,150',leafKind:'leaf',orb:'#ffe39a',fruit:'#7fe8d8',
svg:'<svg viewBox="0 0 40 44"><path d="M16 42c0-8 1-12 4-16 3 4 4 8 4 16z" fill="#5a4a32"/><circle cx="20" cy="14" r="12" fill="#3a7a52"/><circle cx="20" cy="24" r="2" fill="#ffe39a"/><circle cx="14" cy="20" r="1.6" fill="#ffe39a"/><circle cx="26" cy="20" r="1.6" fill="#ffe39a"/></svg>'},
mycelium:{name:{ru:'Гриб-кристалл',en:'Crystal Cap'},style:'mycelium',cost:24,
trunk:['#6b5a44','#473a2a'],canopy:['#1f6b62','#2f9a8c','#5fd6c4','#aef0e4'],
glow:'150,240,220',leafC:'170,240,225',leafKind:'spark',orb:'#d8c8ff',fruit:'#bfe9ff',
svg:'<svg viewBox="0 0 40 44"><path d="M17 42c0-7 1-10 3-13 2 3 3 6 3 13z" fill="#6b5a44"/><ellipse cx="20" cy="18" rx="14" ry="9" fill="#2f9a8c"/><circle cx="14" cy="16" r="2.4" fill="#aef0e4"/><circle cx="22" cy="14" r="3" fill="#aef0e4"/></svg>'},
ashvine:{name:{ru:'Пепельная лоза',en:'Ashvine'},style:'ashvine',cost:30,
trunk:['#2c2c2a','#161615'],canopy:['#1a2422','#243029','#2e3c34','#3a4a40'],
glow:'120,230,210',leafC:'150,230,210',leafKind:'spark',orb:'#9af0e0',fruit:'#cfeee8',
svg:'<svg viewBox="0 0 40 44"><path d="M20 42c-4-6-6-10-3-16 4-2 6-6 4-12 5 4 6 9 3 14 4 2 5 8-1 14z" fill="#2c2c2a"/><path d="M16 30q4-4 8 0M18 22q3-3 5 1" stroke="#7fe8d8" stroke-width="1.2" fill="none"/></svg>'}};

const ARTIFACTS=[
{k:'art_amber_seed',n:{ru:'Янтарное семя',en:'Amber Seed'},tier:'common',stat:'seedRw',value:15,
desc:{ru:'+15% семян за убийство',en:'+15% seeds per kill'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.2 6 3.2 9.6a4.8 4.8 0 0 0 9.6 0C12.8 6 8 1.5 8 1.5Z" fill="currentColor"/></svg>'},
{k:'art_mossy_bark',n:{ru:'Замшелая кора',en:'Mossy Bark'},tier:'common',stat:'hp',value:10,
desc:{ru:'+10% HP дерева',en:'+10% tree HP'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 1.5l5.5 2.2v3.8c0 3.6-2.4 6.2-5.5 7-3.1-.8-5.5-3.4-5.5-7V3.7L8 1.5Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'},
{k:'art_dew_crystal',n:{ru:'Кристалл росы',en:'Dew Crystal'},tier:'rare',stat:'dewBoss',value:2,
desc:{ru:'+2 росы за босса',en:'+2 dew per boss'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" fill="currentColor"/></svg>'},
{k:'art_thorn_ring',n:{ru:'Кольцо шипов',en:'Thorn Ring'},tier:'rare',stat:'thornAura',value:5,
desc:{ru:'Враги в радиусе: 5% урона/сек',en:'Foes in range: 5% dmg/sec'},
svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'},
{k:'art_root_heart',n:{ru:'Сердце корня',en:'Root Heart'},tier:'epic',stat:'rootSpd',value:20,
desc:{ru:'Корни бьют на 20% чаще',en:'Roots strike 20% faster'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 13V8M8 8C5 8 3 6 3 3c3 0 5 2 5 5Zm0 0c0-3 2-5 5-5 0 3-2 5-5 5Z" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>'},
{k:'art_wind_feather',n:{ru:'Перо ветра',en:'Wind Feather'},tier:'epic',stat:'projSpd',value:15,
desc:{ru:'+15% скорости всех снарядов',en:'+15% all projectile speed'},
svg:'<svg viewBox="0 0 16 16"><path d="M3 13C6 9 9 5 13 3c-1 4-3 8-8 10Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/><path d="M6 10 11 5" stroke="currentColor" stroke-width="1.2"/></svg>'},
{k:'art_ancient_acorn',n:{ru:'Древний жёлудь',en:'Ancient Acorn'},tier:'legendary',stat:'acorn',value:200,
desc:{ru:'Раз в 30с: все враги получают 200% урона',en:'Every 30s: all foes take 200% dmg'},
svg:'<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="4" ry="5" fill="currentColor"/><path d="M4 6h8M8 4V2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>'},
{k:'art_world_sap',n:{ru:'Мировая живица',en:'World Sap'},tier:'legendary',stat:'allDmg',value:10,
desc:{ru:'+10% ко всему урону, +5% HP',en:'+10% all dmg, +5% HP'},
svg:'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 4 6 4 9a4 4 0 0 0 8 0C12 6 8 1.5 8 1.5Z" fill="currentColor"/></svg>'},
{k:'art_grove_eye',n:{ru:'Око рощи',en:'Grove Eye'},tier:'mythic',stat:'chainCrit',value:50,
desc:{ru:'Криты вызывают цепную молнию (50%, 3 цели)',en:'Crits chain lightning (50%, 3 targets)'},
svg:'<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="6" ry="3.5" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>'},
{k:'art_eternal_ring',n:{ru:'Вечное кольцо',en:'Eternal Ring'},tier:'mythic',stat:'lowHp',value:50,
desc:{ru:'При HP < 25%: +50% урона, +30% скорости',en:'At HP < 25%: +50% dmg, +30% speed'},
svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>'}];

const ART_BY_K=Object.fromEntries(ARTIFACTS.map(a=>[a.k,a]));
function artBonus(stat){let b=0;for(const k of S.artifactEquip){const a=ART_BY_K[k];if(a&&a.stat===stat)b+=a.value;}return b;}
function artHas(stat){return S.artifactEquip.some(k=>ART_BY_K[k]&&ART_BY_K[k].stat===stat);}

const MUTATIONS=[
{k:'mut_frenzy',n:{ru:'Бешенство',en:'Frenzy'},dur:60,desc:{ru:'+40% скорости атаки',en:'+40% attack speed'},svg:IC.spd},
{k:'mut_giant',n:{ru:'Исполин',en:'Giant'},dur:90,desc:{ru:'+50% урона, −20% скорости',en:'+50% dmg, −20% speed'},svg:IC.alld},
{k:'mut_regen',n:{ru:'Регенерация',en:'Regeneration'},dur:120,desc:{ru:'+2% HP/сек',en:'+2% HP/sec'},svg:IC.hp},
{k:'mut_thorns_aura',n:{ru:'Аура шипов',en:'Thorn Aura'},dur:60,desc:{ru:'Враги в радиусе: 10% урона/сек',en:'Foes in range: 10% dmg/sec'},svg:IC.thorn},
{k:'mut_golden',n:{ru:'Золотой дождь',en:'Golden Rain'},dur:45,desc:{ru:'×3 семян за убийство',en:'×3 seeds per kill'},svg:IC.seed},
{k:'mut_vampire',n:{ru:'Вампиризм',en:'Vampirism'},dur:90,desc:{ru:'5% урона → HP дерева',en:'5% dmg → tree HP'},svg:IC.hp},
{k:'mut_storm',n:{ru:'Буря',en:'Storm'},dur:60,desc:{ru:'Способности: −50% кулдаун',en:'Abilities: −50% cooldown'},svg:IC.alls},
{k:'mut_overgrowth',n:{ru:'Разрастание',en:'Overgrowth'},dur:120,desc:{ru:'+30% радиуса атаки',en:'+30% attack range'},svg:IC.rad},
{k:'mut_phoenix',n:{ru:'Феникс',en:'Phoenix'},dur:9999,desc:{ru:'При смерти: воскрешение с 50% HP (1 раз)',en:'On death: revive at 50% HP (once)'},svg:IC.grow},
{k:'mut_earthquake',n:{ru:'Землетрясение',en:'Earthquake'},dur:45,desc:{ru:'Каждые 5с: AoE 150% урона',en:'Every 5s: AoE 150% dmg'},svg:IC.trap}];

const MUT_BY_K=Object.fromEntries(MUTATIONS.map(m=>[m.k,m]));
function mutActive(k){return S.mutations.some(m=>m.k===k&&(m.expiresAt>Date.now()||m.expiresAt===0));}
function cleanMuts(){S.mutations=S.mutations.filter(m=>m.expiresAt===0||m.expiresAt>Date.now());}
function mutDmgMul(){let m=1;if(mutActive('mut_giant'))m*=1.5;
if(mutActive('mut_eternal')||artHas('lowHp')&&S.treeHp<treeMaxHp()*0.25)m*=1.5;return m;}
function mutSpdMul(){let m=1;if(mutActive('mut_frenzy'))m*=1.4;
if(mutActive('mut_giant'))m*=0.8;
if(artHas('lowHp')&&S.treeHp<treeMaxHp()*0.25)m*=1.3;return m;}

const maxHpOf=o=>{let hp=0;for(const n of SKDEF)if(n.stat==='sHp')hp+=((o.skill&&o.skill[n.k])||0);
return Math.round(CONFIG.STAT.hp(o.hpLvl||0)*(1+0.15*hp));};

function load(){
let d=null;
for(const k of ['drevo.save.v9','drevo.save.v8','drevo.save.v7','drevo.save.v6','drevo.save.v5','drevo.save.v4','drevo.save.v3','drevo.save.v2','drevo.save.v1']){
try{const p=JSON.parse(localStorage.getItem(k));if(p){d=p;break;}}catch(e){}}
const base={v:1,seeds:0,dew:0,amber:0,wave:1,killed:0,totalKills:0,
dmgLvl:0,spdLvl:0,hpLvl:0,radLvl:0,ccLvl:0,cdLvl:0,regenLvl:0,
treeHp:100,muted:false,shake:true,vol:1,lang:'ru',lastSeen:0,bestWave:1,seen:true,tipShop:false,amberTier:0,
abilities:{},equip:[],artifacts:{},artifactEquip:[],mutations:[],treeSkins:['oak'],treeSkin:'oak',skill:{},
gameSpeed:1,gfxQuality:'full',
dailyDate:0,dailyDone:{},dailyProg:{kills:0,waves:0,spins:0,crits:0,upg:0},
waveQ:{prog:0,done:false,claimed:false},onceDone:{},chaptersCleared:0,huntKills:0,huntDone:0,
passDone:{},tutorialDone:false,tutPhase:'new'};
if(d&&d.v===1){
const s=Object.assign(base,d);
['dmgLvl','spdLvl','hpLvl','radLvl','ccLvl','cdLvl','regenLvl','wave','killed','totalKills','bestWave','amberTier','chaptersCleared','huntKills','huntDone']
.forEach(k=>{s[k]=safeInt(s[k], base[k]);});
if(s.wave<1)s.wave=1;if(s.bestWave<1)s.bestWave=1;
s.seeds=(typeof s.seeds==='number'&&isFinite(s.seeds))?s.seeds:0;
s.dew=(typeof s.dew==='number'&&isFinite(s.dew))?s.dew:0;
s.amber=(typeof s.amber==='number'&&isFinite(s.amber))?s.amber:0;
s.abilities=Object.assign({},d.abilities||{});
if(s.abilities.multishot!==undefined && s.abilities.seedshot===undefined){
s.abilities.seedshot=s.abilities.multishot;delete s.abilities.multishot;}
['leech','eternalbark','harvest','slow'].forEach(k=>{delete s.abilities[k];});
s.equip=(Array.isArray(d.equip)?d.equip:[]).filter(k=>ABIL_BY_K[k]&&k!=='seedshot').slice(0,6);
s.artifacts=Object.assign({},d.artifacts||{});
s.artifactEquip=(Array.isArray(d.artifactEquip)?d.artifactEquip:[]).filter(k=>ART_BY_K[k]).slice(0,3);
s.mutations=(Array.isArray(d.mutations)?d.mutations:[]).filter(m=>MUT_BY_K[m.k]);
s.skill=Object.assign({},d.skill||{});
s.gameSpeed=[1,2,3].includes(s.gameSpeed)?s.gameSpeed:1;
s.gfxQuality=(s.gfxQuality==='low')?'low':'full';
if(d.tutPhase){s.tutPhase=d.tutPhase;}
else if(d.tutorialActive){s.tutPhase='cards';}
else if(d.tutorialDone){s.tutPhase='done';}
else if((s.totalKills||0)>0||(s.dmgLvl||0)>0||s.wave>1){s.tutPhase='done';}
else{s.tutPhase='new';}
s.passDone=Object.assign({},d.passDone||{});
s.dailyProg=Object.assign({kills:0,waves:0,spins:0,crits:0,upg:0},d.dailyProg||{});
s.treeSkins=(Array.isArray(d.treeSkins)&&d.treeSkins.length)?d.treeSkins:['oak'];
s.treeSkin=(d.treeSkin&&TREE_SKINS[d.treeSkin])?d.treeSkin:'oak';
if(s.vol==null||isNaN(s.vol))s.vol=1;
if(s.shake==null)s.shake=true;
if(!s.lang)s.lang='ru';
const L=s.dmgLvl+s.spdLvl+s.hpLvl+s.radLvl+s.ccLvl+s.cdLvl;
if(d.amber===undefined){s.amberTier=Math.floor(L/50);s.amber=5*s.amberTier;}
if(s.treeHp<=0||isNaN(s.treeHp))s.treeHp=maxHpOf(s);
s.treeHp=Math.min(s.treeHp,maxHpOf(s));
return s;}
base.seen=false;return base;
}

let S=load();
S.over=false;
gameSpeed=S.gameSpeed;gfxQuality=S.gfxQuality;

function save(){try{localStorage.setItem(KEY,JSON.stringify({v:1,seeds:S.seeds,dew:S.dew,amber:S.amber,
wave:S.wave,killed:S.killed,totalKills:S.totalKills,dmgLvl:S.dmgLvl,spdLvl:S.spdLvl,hpLvl:S.hpLvl,
radLvl:S.radLvl,ccLvl:S.ccLvl,cdLvl:S.cdLvl,regenLvl:S.regenLvl,
treeHp:S.treeHp,muted:S.muted,shake:S.shake,vol:S.vol,lang:S.lang,lastSeen:Date.now(),bestWave:S.bestWave,seen:true,tipShop:S.tipShop,
amberTier:S.amberTier,abilities:S.abilities,equip:S.equip,artifacts:S.artifacts,artifactEquip:S.artifactEquip,
mutations:S.mutations,treeSkins:S.treeSkins,treeSkin:S.treeSkin,skill:S.skill,gameSpeed:S.gameSpeed,gfxQuality:S.gfxQuality,
dailyDate:S.dailyDate,dailyDone:S.dailyDone,dailyProg:S.dailyProg,
waveQ:S.waveQ,onceDone:S.onceDone,chaptersCleared:S.chaptersCleared,
huntKills:S.huntKills,huntDone:S.huntDone,passDone:S.passDone,
tutorialDone:S.tutorialDone,tutPhase:S.tutPhase}));}catch(e){}}

const treeDmgPct=()=>0.10*statCount('sRoot')+0.25*statCount('sAllDmg');
const treeSpdPct=()=>0.08*statCount('sSpd')+0.20*statCount('sAllSpd');
const treeHpPct=()=>0.15*statCount('sHp');
const treeRadPct=()=>0.10*statCount('sRad');
const treeCritPct=()=>0.05*statCount('sCrit');
const treeCritDmgPct=()=>0.10*statCount('sCritDmg');
const baseDmg=()=>CONFIG.STAT.dmg(S.dmgLvl);
const coreDmg=()=>baseDmg()*(1+treeDmgPct()+artBonus('allDmg')/100)*mutDmgMul();
const seedMul=()=>1+(seedDmgPct(ab('seedshot'))+abilPct('thorns')+abilPct('avatar')+25*statCount('sThorn')+15*statCount('sSeedDmg'))/100;
const rootMul=()=>1+(abilPct('deeproots')+abilPct('avatar')+25*statCount('sDeep'))/100;
const treeAspd=()=>Math.min(CONFIG.STAT.spdCap, CONFIG.STAT.spd(S.spdLvl)*(1+treeSpdPct())*mutSpdMul());
const rootAspd=()=>Math.min(CONFIG.STAT.spdCap, CONFIG.STAT.spd(S.spdLvl)*(1+treeSpdPct())*0.9*(1+artBonus('rootSpd')/100)*mutSpdMul());
const treeMaxHp=()=>Math.round(maxHpOf(S)*(1+artBonus('hp')/100)*(1+(artHas('lowHp')?0.05:0)));
const rootReachCap=()=>Math.min(W,H/ISO)*0.375;
const rootReach=()=>clamp(CONFIG.STAT.rad(S.radLvl)*(1+treeRadPct())*(1+(mutActive('mut_overgrowth')?0.3:0)),85,rootReachCap());
const critChance=()=>Math.min(CONFIG.STAT.ccCap, CONFIG.STAT.cc(S.ccLvl)+treeCritPct());
const critMult=()=>Math.min(CONFIG.STAT.cdCap, CONFIG.STAT.cd(S.cdLvl)+treeCritDmgPct());
let FRR=85;
const inReach=(e,extra)=>{const rr=FRR+e.r+(extra||0);return e.x*e.x+e.y*e.y<=rr*rr;};
function costOne(k,L){return Math.ceil(CONFIG.UPG.base[k]*Math.pow(1+CONFIG.UPG.KC*L, CONFIG.UPG.EXP));}
function costRange(k,from,n){let s=0;for(let i=0;i<n;i++)s+=costOne(k,from+i);return s;}
function maxAfford(k){const cur=S[k+'Lvl']||0;let n=0,spent=0;
while(n<50000 && cur+n<CONFIG.UPG.LVL_CAP){const c=costOne(k,cur+n);if(spent+c>S.seeds)break;spent+=c;n++;}
return {n,spent};}
let buyMul=1;
function treeGeom(){const L=S.dmgLvl+S.spdLvl+S.hpLvl+S.radLvl+S.ccLvl+S.cdLvl;
return {h: 24 + 20 * (1 - Math.exp(-L / 250)), R: 12 + 12 * (1 - Math.exp(-L / 250)), stage: Math.min(6, Math.floor(L / 80)), L};}
function afkRate(){const dps=baseDmg()*Math.min(CONFIG.STAT.spdCap,CONFIG.STAT.spd(S.spdLvl));
const G=chapterOf(S.wave);const avgHp=12*enemyScaleHP(G)*1.8,avgRw=6.5*enemyScaleRW(G)*1.6;
return dps/avgHp*avgRw*CONFIG.AFK_RATE_K;}
function chapterReward(ch){if(ch%10===0)return 50;if(ch%5===0)return 40;if(ch%3===0)return 30;return 20;}
let afkReward=0,afkDew=0,afkSec=0;
if(S.seen&&S.lastSeen){const el=(Date.now()-S.lastSeen)/1000;
if(el>90){afkSec=Math.min(el,(3+statCount('sAfkT'))*3600);
afkReward=Math.floor(afkRate()*afkSec);afkDew=Math.min(12,Math.floor(afkSec/1800));}}

const cv=$('#game'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,cx=0,cy=0,ground=null;
const spawnR=()=>Math.min(W*.46,H*.40/ISO,520)+20;
let scenery=[];
function buildScenery(){
scenery=[];const r=rng(98765);const edges=[];const grassN=LOW_GFX()?30:80;
for(let i=0;i<14;i++)edges.push({x:r()*W*0.18,y:r()*H});
for(let i=0;i<14;i++)edges.push({x:W-r()*W*0.18,y:r()*H});
for(let i=0;i<10;i++)edges.push({x:r()*W,y:r()*H*0.14});
for(let i=0;i<12;i++)edges.push({x:r()*W,y:H-r()*H*0.16});
edges.forEach((p)=>{const big=r()<.5;
scenery.push({type:big?'tree':'bush',x:p.x,y:p.y,s:big?(.7+r()*.6):(.6+r()*.5),ph:r()*TAU,sw:big?(.5+r()*.5):(.8+r()*.6)});});
for(let i=0;i<grassN;i++)scenery.push({type:'grass',x:r()*W,y:r()*H,s:.6+r()*.8,ph:r()*TAU});
}
function makeGround(){
ground=document.createElement('canvas');ground.width=cv.width;ground.height=cv.height;
const g=ground.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
const bg=g.createRadialGradient(cx,cy,40,cx,cy,Math.max(W,H)*.72);
bg.addColorStop(0,'#1a2a20');bg.addColorStop(.45,'#101a14');bg.addColorStop(.8,'#0a120d');bg.addColorStop(1,'#050a07');
g.fillStyle=bg;g.fillRect(0,0,W,H);
const maxR=Math.hypot(W,H)/2;
for(let i=0;i<300;i++){const a=rand(0,TAU),d=Math.pow(Math.random(),.6)*maxR;
g.fillStyle='rgba('+(Math.random()<.5?'122,168,128':'86,120,94')+','+rand(.04,.13).toFixed(2)+')';
g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d*ISO,rand(.7,2.1),0,TAU);g.fill();}
}
function resize(){DPR=Math.min(devicePixelRatio||1,LOW_GFX()?1:2);W=innerWidth;H=innerHeight;
cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
cv.style.width=W+'px';cv.style.height=H+'px';
ctx.setTransform(DPR,0,0,DPR,0,0);cx=W/2;cy=H*.5;makeGround();buildScenery();}
addEventListener('resize',resize);

const enemies=[],shots=[],parts=[],floats=[],roots=[],zones=[];
const flies=[];const flyN=LOW_GFX()?5:14;for(let i=0;i<flyN;i++)flies.push({x:Math.random(),y:Math.random(),p:rand(0,TAU),s:rand(.4,1),
c:['232,214,138','138,222,196','158,224,152'][i%3]});
let T=0,atkT=0,rootT=0,spawnT=1.4,betweenT=2.4;
let spawned=0,bossActive=false;
let branchCd=2,leafCd=6,branchFx=0,branchAng=0,branchDir=1;
let shakeM=0,flinch=0,pulse=0,leafT=1,treeShakeT=0;
let windT=0,gust=0,gustTarget=0,gustTimer=4;
let runKills=0,runSeeds=0,dispSeeds=S.seeds,lastStr='';
let squirrel=null,squirrelTimer=rand(120,300);
let acornT=0,quakeT=0,thornAuraT=0;
let tutStep='tab';
const cd={thornsalvo:0,vinewhip:0,spores:0,crownwrath:0,roottrap:0,fruitbomb:0,acidsap:0};

const ET={beetle:{hp:8,sp:30,rw:5,dmg:3,r:9},wolf:{hp:15,sp:56,rw:9,dmg:5,r:11},
golem:{hp:50,sp:18,rw:22,dmg:9,r:14},spirit:{hp:12,sp:46,rw:12,dmg:4,r:9},boss:{hp:90,sp:30,rw:45,dmg:16,r:21}};

function pickType(w){const r=Math.random();
if(w>=6)return r<.12?'golem':r<.30?'spirit':r<.55?'wolf':'beetle';
if(w>=4)return r<.22?'spirit':r<.5?'wolf':'beetle';
if(w>=3)return r<.32?'wolf':'beetle';
return 'beetle';}

function spawn(type,bossMul=1){const t=ET[type],w=S.wave,ch=chapterOf(w),a=rand(0,TAU),R=spawnR();
const boss=type==='boss';
let hp,dmg;
if(boss){hp=t.hp*enemyScaleHP(ch)*CONFIG.ENEMY.HP_MUL*Math.pow(CONFIG.ENEMY.BOSS_HP_PER_WAVE,w-1)*bossMul;
dmg=t.dmg*enemyScaleDMG(ch)*Math.pow(CONFIG.ENEMY.BOSS_DMG_PER_WAVE,w-1);}
else{hp=t.hp*enemyScaleHP(ch)*CONFIG.ENEMY.HP_MUL*rand(.9,1.1);dmg=t.dmg*enemyScaleDMG(ch);}
enemies.push({type,x:Math.cos(a)*R,y:Math.sin(a)*R,hp,maxHp:hp,
sp:t.sp*rand(.92,1.08),dmg,rw:Math.round(t.rw*enemyScaleRW(ch)),
r:t.r,phase:rand(0,TAU),flash:0,atk:rand(.3,.8),dead:false,born:0,lift:0,bleed:0,bleedT:0,held:0,tut:false,frost:0,spin:0,
vx:0,vy:0});}

let AC=null;const lastSnd={};
function ac(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
if(AC.state==='suspended')AC.resume();}catch(e){}return AC;}
function tone(f,d,type,v,slide,delay){if(S.muted)return;const a=ac();if(!a)return;
v=(v||.1)*(S.vol==null?1:S.vol);if(v<=0)return;
const t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t0+d);
g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+d+.02);}
const th=(k,ms)=>{const n=performance.now();if(lastSnd[k]&&n-lastSnd[k]<ms)return false;lastSnd[k]=n;return true;};
const sfx={
shoot(){if(th('sh',70))tone(680,.07,'triangle',.035,-240);},
hit(){if(th('ht',60))tone(200,.06,'square',.03,-60);},
crit(){tone(660,.07,'square',.05,200);tone(990,.09,'square',.04,120,.04);},
kill(){tone(520,.08,'triangle',.06,140);tone(880,.1,'triangle',.05,80,.05);},
boss(){tone(120,.5,'sawtooth',.08,-50);tone(66,.6,'sine',.09,-10,.05);},
wave(){tone(196,.25,'sine',.07);tone(262,.3,'sine',.06,0,.12);},
hurt(){if(th('hr',150))tone(98,.14,'sawtooth',.05,-30);},
upgrade(){tone(392,.1,'sine',.08);tone(523,.12,'sine',.07,0,.08);tone(659,.16,'sine',.07,0,.16);},
dig(){if(th('dg',90))tone(80+Math.random()*30,.18,'sine',.05,40);},
strike(){tone(70,.22,'sine',.11,-25);tone(180,.09,'triangle',.05,-60,.04);},
branch(){if(th('br',200))tone(320,.12,'sawtooth',.04,-200);},
leaf(){for(let i=0;i<3;i++)tone(880+i*140,.06,'triangle',.03,-260,i*.05);},
tick(){tone(1150,.03,'square',.025);},
flip(){tone(520,.05,'triangle',.04,120);},
claim(){tone(523,.1,'triangle',.08);tone(784,.18,'triangle',.07,0,.09);},
squirrel(){tone(880,.06,'sine',.07,200);tone(1320,.1,'sine',.06,120,.05);},
cast(){tone(440,.08,'triangle',.05,160);tone(660,.1,'sine',.04,0,.05);},
boom(){tone(90,.3,'sawtooth',.09,-40);tone(150,.12,'square',.05,-80,.02);},
artifact(){tone(392,.15,'triangle',.08);tone(523,.18,'triangle',.07,0,.1);tone(784,.25,'triangle',.07,0,.2);tone(1046,.3,'sine',.06,0,.32);},
mut(){tone(262,.2,'sawtooth',.07);tone(392,.25,'sawtooth',.06,0,.1);tone(523,.35,'triangle',.07,0,.2);},
reveal(tier){const seq={common:[440],rare:[440,587],epic:[440,587,740],legendary:[392,523,659,880],mythic:[392,523,659,880,1175]}[tier]||[440];
seq.forEach((f,i)=>tone(f,.18,'triangle',.08,0,i*.09));
if(tier==='legendary'||tier==='mythic')tone(80,.5,'sine',.12,-20);},
over(){tone(220,.4,'sine',.09,-120);tone(110,.7,'sine',.08,-40,.25);}
};
document.addEventListener('pointerdown',()=>ac());

const vigEl=$('#vignette');let vigT=0;
function vig(){vigEl.style.opacity=.65;clearTimeout(vigT);vigT=setTimeout(()=>vigEl.style.opacity=0,90);}
function banner(title,sub,cls){const b=$('#waveBanner');
$('#bannerTitle').textContent=title;$('#bannerSub').textContent=sub;
b.className='';if(cls&&cls!==true)b.classList.add(cls);b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}
let toastTmr=0;function toast(msg){if(!toastsOn)return;const tt=$('#toast');tt.textContent=msg;tt.classList.add('show');
clearTimeout(toastTmr);toastTmr=setTimeout(()=>tt.classList.remove('show'),4500);}
const open=s=>$(s).classList.add('open'),close=s=>$(s).classList.remove('open');
const SHEETS=['#upgOverlay','#rouletteOverlay','#skillTreeOverlay','#abilitiesOverlay','#artifactsOverlay','#questsOverlay','#passOverlay','#shopOverlay','#setOverlay'];
function closeSheet(sel){
if(sel==='#rouletteOverlay'){spinToken++;if(S.tutPhase==='cards')return;autoClaimCards();}
close(sel);}
function closeAllSheets(){SHEETS.forEach(s=>closeSheet(s));}
function anySheetOpen(){return SHEETS.some(s=>$(s).classList.contains('open'));}
function allowedSheets(){
const p=S.tutPhase;
if(p==='new')return [];
if(p==='boost'||p==='play')return ['#upgOverlay'];
if(p==='cards')return ['#rouletteOverlay'];
if(p==='powers')return ['#abilitiesOverlay'];
return SHEETS.slice();}
const SUBS={ru:['тьма сгущается…','лес шепчет…','они всё ближе…','стойте до конца…','корни помнят…'],
en:['darkness thickens…','the forest whispers…','they draw near…','hold to the end…','roots remember…']};
function bump(id){const p=$(id);if(!p)return;p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump');}
function anyOverlayOpen(){return document.querySelector('.overlay.open')!=null;}
function nearestInReach(){let best=null,bd=1e18;
for(const e of enemies){if(e.dead||!inReach(e))continue;const d=e.x*e.x+e.y*e.y;if(d<bd){bd=d;best=e;}}
return best;}

const el={wave:$('#waveNum'),seeds:$('#seedNum'),dew:$('#dewNum'),
prog:$('#wprog i'),ud:$('#upgDmg'),us:$('#upgSpd'),ur:$('#upgRad'),uc:$('#upgCc'),ux:$('#upgCd'),uh:$('#upgHp'),urg:$('#upgRegen')};
const UPG_STAT={dmg:()=>fmtS(coreDmg()),spd:()=>rootAspd().toFixed(1)+'/с',rad:()=>Math.round(rootReach()),
cc:()=>Math.round(critChance()*100)+'%',cd:()=>'×'+critMult().toFixed(1),hp:()=>fmt(treeMaxHp()),
regen:()=>(CONFIG.STAT.regen(S.regenLvl)*100).toFixed(1)+'%/с'};

function setUpg(btn,k){
const cur=S[k+'Lvl']||0;
let n=buyMul==='max'?maxAfford(k).n:buyMul;
if(cur+n>CONFIG.UPG.LVL_CAP)n=CONFIG.UPG.LVL_CAP-cur;
const c=n>0?costRange(k,cur,n):costOne(k,cur);
btn.querySelector('.upg-stat').textContent=UPG_STAT[k]();
btn.querySelector('.upg-lvlbig').textContent='Ур. '+cur+(n>1?' (+'+n+')':'');
const cb=btn.querySelector('.upg-cost b');cb.textContent=n>0?fmt(c):'—';
const locked=S.tutPhase==='boost'&&k!=='dmg'&&S.dmgLvl<10;
const ok=n>0&&S.seeds>=c&&!S.over&&!locked;btn.disabled=!ok;btn.classList.toggle('afford',ok);}
function upgAffordCount(){let n=0;for(const k in CONFIG.UPG.base){if(costOne(k,S[k+'Lvl']||0)<=S.seeds)n++;}return n;}
function passHasClaim(){const ch=S.chaptersCleared;return passMilestones().some(m=>m<=ch&&!S.passDone[m]);}

function updateNav(){
const allowed=allowedSheets();
const lock=(sel,sheet)=>$(sel).classList.toggle('locked',!allowed.includes(sheet));
lock('#navUpg','#upgOverlay');lock('#navRoulette','#rouletteOverlay');lock('#navTree','#skillTreeOverlay');
lock('#navAbilities','#abilitiesOverlay');lock('#navArtifacts','#artifactsOverlay');lock('#navQuests','#questsOverlay');lock('#shopBtn','#shopOverlay');
toggleDot('#navUpg',allowed.includes('#upgOverlay')&&upgAffordCount()>0);
toggleDot('#navRoulette',allowed.includes('#rouletteOverlay')&&S.dew>=CONFIG.SPIN_COST);
let treeGlow=false;
if(allowed.includes('#skillTreeOverlay'))for(const n of SKDEF){if(sk(n.k)<nodeMax(n)&&nodeUnlocked(n)&&S.dew>=skCost(n)){treeGlow=true;break;}}
toggleDot('#navTree',treeGlow);
const cap=slotCap();
const abGlow=allowed.includes('#abilitiesOverlay')&&S.equip.length<cap&&ABIL.some(a=>a.k!=='seedshot'&&(S.abilities[a.k]||0)>0&&!S.equip.includes(a.k));
toggleDot('#navAbilities',abGlow);
let abb=$('#navAbilities').querySelector('.tp-badge');
if(S.equip.length>0){if(!abb){abb=document.createElement('span');abb.className='tp-badge';abb.style.background='var(--violet)';$('#navAbilities').appendChild(abb);}abb.textContent=S.equip.length;}
else if(abb)abb.remove();
toggleDot('#navArtifacts',allowed.includes('#artifactsOverlay')&&Object.keys(S.artifacts).some(k=>(S.artifacts[k]||0)>0&&!S.artifactEquip.includes(k)&&S.artifactEquip.length<3));
let qGlow=dailyList().some(q=>q.done&&!q.claimed);
if(!qGlow){const wq=waveQuest();if(wq.done&&!wq.claimed)qGlow=true;}
if(!qGlow)qGlow=onceList().some(q=>q.done&&!q.claimed);
if(!qGlow&&(S.huntKills||0)>=HUNT_GOAL)qGlow=true;
toggleDot('#navQuests',allowed.includes('#questsOverlay')&&qGlow);
$('#passBtn').classList.toggle('has',passHasClaim());
}
function toggleDot(sel,on){const elc=$(sel);let d=elc.querySelector('.tp-dot');
if(on){if(!d){d=document.createElement('span');d.className='tp-dot';elc.appendChild(d);}}
else if(d)d.remove();}

function updateHUD(){
el.wave.textContent=stageOf(S.wave);
if(el.dew)el.dew.textContent=fmt(S.dew);
el.prog.style.width=clamp(100*S.killed/CONFIG.QUOTA(S.wave),0,100)+'%';
$('#waveLab').textContent=bossActive?t('boss'):t('stage');
$('#wavePill').classList.toggle('boss-phase',bossActive);
setUpg(el.ud,'dmg');setUpg(el.us,'spd');setUpg(el.ur,'rad');
setUpg(el.uc,'cc');setUpg(el.ux,'cd');setUpg(el.uh,'hp');setUpg(el.urg,'regen');
updateNav();renderMutBar();}

function refreshTutUI(){$('#tutDim').classList.toggle('on', ['boost', 'cards', 'powers'].includes(S.tutPhase));}
function clearTutGlow(){document.querySelectorAll('.tut-glow').forEach(e=>e.classList.remove('tut-glow'));}
function updateTutHighlights(){
clearTutGlow();const p=S.tutPhase;
if(p==='boost'){
if(tutStep==='tab'){$('#navUpg').classList.add('tut-glow');}
else if(tutStep==='mul'){const b=$('#mulRow').querySelector('[data-mul="10"]');if(b)b.classList.add('tut-glow');}
else if(tutStep==='dmg'){$('#upgDmg').classList.add('tut-glow');}
}else if(p==='cards'){$('#navRoulette').classList.add('tut-glow');}
else if(p==='powers'){
$('#navAbilities').classList.add('tut-glow');
if($('#abilitiesOverlay').classList.contains('open')){
const c=$('#abilGrid').querySelector('[data-abil="seedshot"]');if(c)c.classList.add('tut-glow');}}
}
function enterBoost(){S.tutPhase='boost';tutStep='tab';save();refreshTutUI();updateTutHighlights();updateNav();}
function enterPlay(){S.tutPhase='play';enemies.forEach(e=>{if(e.tut)e.tut=false;});tutStep=null;
save();refreshTutUI();updateTutHighlights();updateNav();updateHUD();}
function enterCards(){S.tutPhase='cards';save();refreshTutUI();updateTutHighlights();updateNav();}
function enterPowers(){S.tutPhase='powers';save();refreshTutUI();updateTutHighlights();updateNav();}
function finishTutorial(){S.tutPhase='done';S.tutorialDone=true;
save();refreshTutUI();updateTutHighlights();updateNav();renderAbilities();updateHUD();}
function checkAmber(){const L=S.dmgLvl+S.spdLvl+S.hpLvl+S.radLvl+S.ccLvl+S.cdLvl,tt=Math.floor(L/50);
if(tt>S.amberTier){const n=(tt-S.amberTier)*5;S.amberTier=tt;S.amber+=n;
toast('+'+n+' '+t('amber'));sfx.claim();save();updateHUD();}}

function renderPass(){
try{const ch=S.chaptersCleared;const all=passMilestones();
const done=all.filter(m=>m<=ch);const next=all.filter(m=>m>ch).slice(0,12);
const row=m=>{const claimed=!!S.passDone[m];const can=m<=ch&&!claimed;const rew=passReward(m);
const right=claimed?`<span class="q-claimed">${t('qDone')}</span>`
:can?`<button class="q-claim" data-pass="${m}"><span class="q-rew"><svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" fill="#7cc9e8"/></svg>${rew}</span></button>`
:`<span class="q-rew inactive"><svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" fill="#7cc9e8"/></svg>${rew}</span>`;
return `<div class="qrow ${can?'done':''}">
<span class="q-ico"><svg viewBox="0 0 16 16"><path d="M3 14V2h8l-2 2.5L11 7H3" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></svg></span>
<span class="q-body"><span class="q-txt">${t('chap')} ${m}</span>
<span class="q-bar"><i style="width:${clamp(100*ch/m,0,100)}%"></i></span>
<span class="q-prog">${Math.min(ch,m)}/${m}</span></span>${right}</div>`;};
$('#passContent').innerHTML=`<div class="q-sec"><h3>${t('chap')} · ${ch}</h3>`+done.map(row).join('')+next.map(row).join('')+'</div>';
}catch(e){console.error('renderPass',e);}}
function claimPass(m){const ch=S.chaptersCleared;if(m>ch||S.passDone[m])return;
S.passDone[m]=1;S.dew+=passReward(m);bump('#dewPill');sfx.claim();save();updateHUD();renderPass();}
$('#passContent').addEventListener('click',e=>{const b=e.target.closest('[data-pass]');if(b)claimPass(+b.dataset.pass);});
$('#passBtn').addEventListener('click',()=>{if(!allowedSheets().includes('#passOverlay'))return;
const was=$('#passOverlay').classList.contains('open');closeAllSheets();if(!was){open('#passOverlay');renderPass();}});

let cards=[],cardPhase='idle',pickedCount=0,cardTimer=null,spinToken=0,cardMul=1;
function cardEl(id){return $('#cardsStage').querySelector(`[data-id="${id}"]`);}
function pickAbility(){
const stage=tierStage();const weights=CONFIG.TIER_WEIGHTS[stage-1];
let tot=0;for(const tk in weights)tot+=weights[tk];
let r=Math.random()*tot,tier='common';
for(const tk in weights){if(r<weights[tk]){tier=tk;break;}r-=weights[tk];}
const list=ABIL.filter(a=>a.tier===tier&&a.k!=='seedshot');
return list[Math.floor(Math.random()*list.length)];}
function stageW(){return ($('#cardsStage').clientWidth||340);}
function finalPos(slot){const row=Math.floor(slot/3),col=slot%3;const off=col-1;
const sp=clamp((stageW()-66)/3,24,52);return {x:off*sp*1.18,y:(row-1)*96,rot:off*3,scale:1};}
function pilePos(i){return {x:(i-4)*11,y:0,rot:(i-4)*0.9,scale:1};}
function posTF(pos,lifted){const y=pos.y+(lifted?-40:0);const sc=lifted?1.15:pos.scale;
return `translate(-50%,-50%) translate(${pos.x}px,${y}px) rotate(${pos.rot}deg) scale(${sc})`;}
function setCard(c,pos,lifted,z,revealed){const elc=cardEl(c.id);if(!elc)return;
elc.style.transform=posTF(pos,lifted);elc.classList.toggle('revealed',!!revealed);if(z!=null)elc.style.zIndex=z;}

function renderCards(){
const st=$('#cardsStage');
if(st.children.length!==cards.length){
st.innerHTML=cards.map(c=>{const tr=TIERS[c.a.tier];
return `<div class="rcard t-${c.a.tier}" data-id="${c.id}"><div class="rcard-inner">
<div class="back"></div>
<div class="face"><span class="nm">${LN(c.a.n)}</span><span class="plus">+${c.plus}</span><span class="ti">${LN(tr.name)}</span></div>
</div></div>`;}).join('');
st.querySelectorAll('.rcard').forEach(elc=>{elc.addEventListener('click',()=>onCardClick(+elc.dataset.id));});}
const drive=cardPhase==='gather'||cardPhase==='shuffle'||cardPhase==='deal';
cards.forEach(c=>{const elc=cardEl(c.id);if(!elc)return;
elc.classList.toggle('pickable',cardPhase==='pick'&&!c.picked);
elc.classList.toggle('picked',!!c.revealed);
elc.classList.toggle('dim',cardPhase==='done'&&!c.revealed);
if(!drive){
if(cardPhase==='show'||cardPhase==='memorize')setCard(c,finalPos(c.id),false,c.id,true);
else if(cardPhase==='pick')setCard(c,finalPos(c.slot),false,null,c.revealed);
else if(cardPhase==='done')setCard(c,finalPos(c.slot),false,null,c.revealed);
}});}

function onCardClick(id){
if(cardPhase!=='pick')return;
const c=cards.find(x=>x.id===id);if(!c||c.picked)return;
c.picked=true;c.revealed=true;pickedCount++;
sfx.flip();renderCards();
if(pickedCount>=3){cardPhase='done';
cards.forEach(c=>{if(!c.picked){const elc=cardEl(c.id);if(elc)elc.classList.add('fly-up');}});
setTimeout(()=>{$('#spinBtn').style.display='none';$('#claimBtn').style.display='flex';updateSpinBtn();},350);}}

function claimCards(){
const r=cards.filter(x=>x.revealed);
r.forEach(c=>{const elc=cardEl(c.id);if(elc)elc.classList.add('fly-down');});
$('#claimBtn').style.display='none';
setTimeout(()=>{let bestTier='common';
r.forEach(c=>{const a=c.a,k=a.k,plus=c.plus,tier=a.tier;
const isNew=!S.abilities[k];
S.abilities[k]=(S.abilities[k]||0)+plus;
if(k!=='seedshot'&&isNew&&S.equip.length<slotCap()){S.equip.push(k);setTimeout(()=>toast(LN(a.n)+t('newAbil')),700);}
if(TIERS[tier].idx>TIERS[bestTier].idx)bestTier=tier;});
if(bestTier==='legendary'||bestTier==='mythic'){
const pn=$('#rouletteOverlay').querySelector('.panel');pn.classList.add('shake-lg');setTimeout(()=>pn.classList.remove('shake-lg'),600);}
sfx.reveal(bestTier);bump('#dewPill');
const wasTut=S.tutPhase==='cards';
save();updateHUD();renderAbilities();
cardPhase='idle';
if(wasTut)enterPowers();
genCards();},420);}

function autoClaimCards(){
if(cardPhase==='idle')return;
if(cardPhase==='pick'){let need=3;for(const c of cards){if(need<=0)break;if(!c.picked){c.picked=true;c.revealed=true;need--;}}}
if(cards.some(c=>c.revealed))claimCards();}

function genCards(){
const tut=S.tutPhase==='cards';
const base=tut?[1,1,1,1,1,1,1,1,1]:[1,1,1,1,1,1,3,3,5];
const ms=ABIL_BY_K['seedshot'];
cards=base.map((p,i)=>({id:i,a:tut?ms:pickAbility(),basePlus:p,plus:p*cardMul,slot:i,pile:i,picked:false,revealed:false}));
cardPhase='show';pickedCount=0;
$('#cardsStage').innerHTML='';$('#claimBtn').style.display='none';$('#spinBtn').style.display='flex';
$('#cardsStage').classList.remove('shuffling');
renderCards();updateSpinBtn();
clearTimeout(cardTimer);
cardTimer=setTimeout(()=>{if(cardPhase==='show'){cardPhase='memorize';renderCards();updateSpinBtn();}},700);}

function swapStep(a,b,myToken,cb){
if(spinToken!==myToken)return;
const pa=a.pile,pb=b.pile;const magician=Math.random()<0.5;
setCard(a,pilePos(pb),true,40,false);setCard(b,pilePos(pa),true,40,false);
if(magician){
const ea=cardEl(a.id),eb=cardEl(b.id);
if(ea){const ia=ea.querySelector('.rcard-inner');if(ia){ia.classList.remove('magician');void ia.offsetWidth;ia.classList.add('magician');}}
if(eb){const ib=eb.querySelector('.rcard-inner');if(ib){ib.classList.remove('magician');void ib.offsetWidth;ib.classList.add('magician');}}}
setTimeout(()=>{if(spinToken!==myToken)return;
setCard(a,pilePos(pb),false,pb,false);setCard(b,pilePos(pa),false,pa,false);
setTimeout(()=>{if(spinToken!==myToken)return;
a.pile=pb;b.pile=pa;
setCard(a,pilePos(a.pile),false,a.pile,false);setCard(b,pilePos(b.pile),false,b.pile,false);
cb&&cb();},CONFIG.ROULETTE.SETTLE_MS);},CONFIG.ROULETTE.LIFT_MS);}

function runSwaps(list,idx,myToken,done){
if(spinToken!==myToken)return;
if(idx>=list.length){done();return;}
swapStep(list[idx][0],list[idx][1],myToken,()=>runSwaps(list,idx+1,myToken,done));}

function startSpin(){
const free=S.tutPhase==='cards';
if(cardPhase!=='memorize')return;
const cost=CONFIG.SPIN_COST*cardMul;
if(!free&&S.dew<cost)return;
if(!free)S.dew-=cost;
if(S.dailyProg)S.dailyProg.spins=(S.dailyProg.spins||0)+1;
save();updateHUD();
const myToken=++spinToken;
cardPhase='gather';$('#cardsStage').classList.add('shuffling');
cards.forEach(c=>{c.revealed=false;c.picked=false;setCard(c,pilePos(c.id),false,c.id,false);});
sfx.flip();
setTimeout(()=>{if(spinToken!==myToken)return;
cardPhase='shuffle';const pairs=[];
for(let s=0;s<CONFIG.ROULETTE.SWAP_COUNT;s++){let i=Math.floor(Math.random()*cards.length),j=Math.floor(Math.random()*cards.length);
let guard=0;while(j===i&&guard<8){j=Math.floor(Math.random()*cards.length);guard++;}
pairs.push([cards[i],cards[j]]);}
runSwaps(pairs,0,myToken,()=>{if(spinToken!==myToken)return;
cardPhase='deal';$('#cardsStage').classList.remove('shuffling');
cards.forEach(c=>{c.slot=c.pile;setCard(c,finalPos(c.slot),false,c.slot,false);});
sfx.flip();
setTimeout(()=>{if(spinToken!==myToken)return;cardPhase='pick';renderCards();updateSpinBtn();},CONFIG.ROULETTE.DEAL_MS);});
},CONFIG.ROULETTE.GATHER_MS);}

function updateSpinBtn(){
const sb=$('#spinBtn');const free=S.tutPhase==='cards';const cost=CONFIG.SPIN_COST*cardMul;
const can=cardPhase==='memorize'&&(free||S.dew>=cost);
sb.disabled=!can;sb.classList.toggle('can',can);
sb.innerHTML=free?(S.lang==='ru'?'Перемешать · бесплатно':'Shuffle · free'):((S.lang==='ru'?'Перемешать · ':'Shuffle · ')+'<svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" fill="#0a5a6e"/></svg> '+cost);}

let abilTip=null,lpTimer=null,lpFired=false;
function showAbilTip(e,a,l){
hideAbilTip();
let pctTxt='—';
if(a.k==='seedshot'&&l)pctTxt=seedDmgPct(l)+'%';
else if(l)pctTxt=Math.round(CONFIG.ABIL_BASE[a.tier]*(1+0.10*(l-1)))+'%';
const cdv=abilCd(a.k,l);
abilTip=document.createElement('div');abilTip.className='abil-tip';
abilTip.innerHTML=`<b>${LN(a.n)}</b><br>${LN(a.desc)}<br><em>${l?pctTxt+(cdv?' · '+cdv.toFixed(1)+(S.lang==='ru'?'с':'s'):''):'—'}</em>`;
document.body.appendChild(abilTip);
const r=e.currentTarget.getBoundingClientRect();
abilTip.style.left=clamp(r.left+r.width/2-115,8,innerWidth-238)+'px';
abilTip.style.top=Math.max(8,r.top-90)+'px';}
function hideAbilTip(){if(abilTip){abilTip.remove();abilTip=null;}}

function renderAbilities(){
try{const cap=slotCap();
$('#abCount').textContent=S.equip.length+'/'+cap;
$('#abilGrid').innerHTML=ABIL.map(a=>{
const l=S.abilities[a.k]||0,ex=a.k==='seedshot'&&isExSeed();
const eq=ex||S.equip.includes(a.k);const tr=TIERS[a.tier];
let pctTxt='';
if(a.k==='seedshot'&&l)pctTxt=seedDmgPct(l)+'%';
else if(l)pctTxt=Math.round(CONFIG.ABIL_BASE[a.tier]*(1+0.10*(l-1)))+'%';
const cdv=abilCd(a.k,l);const cdTxt=cdv?(' · '+cdv.toFixed(1)+(S.lang==='ru'?'с':'s')):'';
const cls=ex?'ex':(l?(eq?'eq':''):'locked');
const badge=ex?'EX':(eq?'✓':(l?'＋':''));
return `<div class="abil t-${a.tier} ${cls}" data-abil="${a.k}">
<span class="abil-ico">${a.svg}</span>
<span class="abil-body"><b>${LN(a.n)}</b><i style="color:${ex?'var(--gold2)':tr.c}">${ex?'EX':LN(tr.name)}</i>
<span class="abil-lvl">${l?(S.lang==='ru'?'ур. ':'lv ')+l+' · '+pctTxt+cdTxt:(S.lang==='ru'?'не найдена':'not found')}</span></span>
<span class="abil-eq ${ex?'exb':''}">${badge}</span></div>`;}).join('');
}catch(e){console.error('renderAbilities',e);}}

$('#abilGrid').addEventListener('pointerdown',e=>{
const c=e.target.closest('[data-abil]');if(!c)return;
lpFired=false;clearTimeout(lpTimer);
lpTimer=setTimeout(()=>{lpFired=true;const a=ABIL_BY_K[c.dataset.abil];showAbilTip(e,a,S.abilities[a.k]||0);},300);});
['pointerup','pointerleave','pointercancel'].forEach(ev=>$('#abilGrid').addEventListener(ev,()=>{clearTimeout(lpTimer);hideAbilTip();}));
$('#abilGrid').addEventListener('click',e=>{
if(lpFired){lpFired=false;return;}
const c=e.target.closest('[data-abil]');if(!c)return;const k=c.dataset.abil;
if(k==='seedshot'&&S.tutPhase==='powers'){finishTutorial();return;}
if(k==='seedshot'&&isExSeed())return;
if(!S.abilities[k]){toast(t('fromRoulette'));return;}
if(S.equip.includes(k))S.equip=S.equip.filter(x=>x!==k);
else if(S.equip.length<slotCap())S.equip.push(k);
else{toast(t('maxEquip'));return;}
sfx.tick();save();renderAbilities();updateHUD();});

function renderArtifacts(){
try{$('#artCount').textContent=S.artifactEquip.length+'/3';
$('#artGrid').innerHTML=ARTIFACTS.map(a=>{
const cnt=S.artifacts[a.k]||0;const eq=S.artifactEquip.includes(a.k);const tr=TIERS[a.tier];
if(cnt<=0&&!eq)return `<div class="art-card ${a.tier} none"><span class="art-top"><span class="art-ico">${a.svg}</span>
<span class="art-mid"><span class="art-name">${LN(a.n)}</span><span class="art-tier">${LN(tr.name)}</span></span></span>
<span class="art-desc">${LN(a.desc)}</span><span class="art-eqmark" style="color:var(--muted)">${S.lang==='ru'?'не найден':'not found'}</span></div>`;
return `<div class="art-card ${a.tier} ${eq?'eq':''}" data-art="${a.k}"><span class="art-count">×${cnt}</span>
<span class="art-top"><span class="art-ico">${a.svg}</span>
<span class="art-mid"><span class="art-name">${LN(a.n)}</span><span class="art-tier">${LN(tr.name)}</span></span></span>
<span class="art-desc">${LN(a.desc)}</span>
<span class="art-eqmark">${eq?(S.lang==='ru'?'✓ ЭКИПИРОВАН':'✓ EQUIPPED'):(S.lang==='ru'?'Экипировать':'Equip')}</span></div>`;}).join('');
}catch(e){console.error('renderArtifacts',e);}}

$('#artGrid').addEventListener('click',e=>{
const c=e.target.closest('[data-art]');if(!c)return;const k=c.dataset.art;
if((S.artifacts[k]||0)<=0)return;
if(S.artifactEquip.includes(k))S.artifactEquip=S.artifactEquip.filter(x=>x!==k);
else if(S.artifactEquip.length<3)S.artifactEquip.push(k);
else{toast(t('artFull'));return;}
sfx.tick();pulse=1;save();renderArtifacts();updateHUD();});

function dropArtifact(){
const r=Math.random();let tier=null,acc=0;
for(const tk of ['mythic','legendary','epic','rare','common']){acc+=CONFIG.ART_DROP[tk];}
let roll=Math.random()*acc,cum=0;
for(const tk of ['mythic','legendary','epic','rare','common']){cum+=CONFIG.ART_DROP[tk];if(roll<cum){tier=tk;break;}}
if(!tier)tier='common';
const list=ARTIFACTS.filter(a=>a.tier===tier);
const a=list[Math.floor(Math.random()*list.length)];
S.artifacts[a.k]=(S.artifacts[a.k]||0)+1;
toast(t('artNew')+LN(a.n));sfx.artifact();
if(a.tier==='legendary'||a.tier==='mythic'){shakeM=Math.max(shakeM,5);}
save();}

function renderSkillTree(){
try{const tree=$('#skillTree');tree.innerHTML='';
const TW=540,TH=820;
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
svg.setAttribute('width',TW);svg.setAttribute('height',TH);
svg.style.cssText='position:absolute;left:0;top:0;pointer-events:none';
addTrunk(svg,270,490);
SKDEF.forEach((def,i)=>{
const parents=[def.parent,def.parent2].filter(Boolean);
parents.forEach((pk,pi)=>{const p=SKDEF.find(pp=>pp.k===pk);if(!p)return;
const linked=sk(pk)>=1;
addBranch(svg,p.x,p.y+(def.zone==='root'?-30:34),def.x,def.y+(def.zone==='root'?34:-30),linked,i*2+pi,def.zone);});});
tree.appendChild(svg);
SKDEF.forEach((def,i)=>{
const l=sk(def.k),mx=nodeMax(def),c=def.base,maxed=l>=mx;
const un=nodeUnlocked(def);const afford=un&&!maxed&&S.dew>=c;
const node=document.createElement('div');
node.className='skill-node'+(def.zone==='root'?' root-node':'')+(maxed?' maxed':'')+(afford?' afford':'')+(!un?' locked':'');
node.style.left=(def.x-28)+'px';node.style.top=(def.y-34)+'px';
const rot=((i*47)%25)-12;node.style.setProperty('--rot',rot+'deg');
node.innerHTML=`<svg class="leaf-bg" viewBox="0 0 56 68" style="transform:rotate(${rot}deg)">
<path class="leaf-body" d="M28,2 C46,14 52,36 42,52 C36,61 31,65 28,66 C25,65 20,61 14,52 C4,36 10,14 28,2 Z"/>
<path class="leaf-vein" d="M28,8 L28,58 M28,20 L19,28 M28,20 L37,28 M28,34 L20,42 M28,34 L36,42"/></svg>
<div class="leaf-content">${def.svg}<span class="lvl">${l}/${mx}</span><span class="cost">${maxed?'✓':fmt(c)}</span></div>`;
node.addEventListener('click',e=>{if(e.detail>1)return;buySkillNode(def);});
node.addEventListener('mouseenter',e=>showTooltip(e,def,l,mx));
node.addEventListener('mouseleave',hideTooltip);
tree.appendChild(node);});
}catch(e){console.error('renderSkillTree',e);}}

function addBranch(svg,sx,sy,ex,ey,linked,i,zone){
const dy=sy-ey;const wob=((i*31)%17)-8;
const d=`M${sx},${sy} C${sx+wob*0.3},${sy-dy*0.45} ${ex-wob*0.3},${ey+dy*0.45} ${ex},${ey}`;
const cols=zone==='root'?[['#241809',8.5],['#5d4830',5.5],['#8a6a44',2.2]]:[['#1a3a26',7],['#3a7a52',4.5],['#5fae74',2]];
cols.forEach(([col,w],li)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');
p.setAttribute('d',d);p.setAttribute('stroke',col);p.setAttribute('stroke-width',w);
p.setAttribute('fill','none');p.setAttribute('stroke-linecap','round');
if(!linked)p.setAttribute('opacity',li===2?'0.35':'0.5');svg.appendChild(p);});}

function addTrunk(svg,x,y){
const d=`M${x},${y-40} L${x},${y+40}`;
[['#241809',15],['#4a3421',10],['#6b4f34',5]].forEach(([c,w])=>{
const p=document.createElementNS('http://www.w3.org/2000/svg','path');
p.setAttribute('d',d);p.setAttribute('stroke',c);p.setAttribute('stroke-width',w);
p.setAttribute('fill','none');p.setAttribute('stroke-linecap','round');svg.appendChild(p);});}

let tooltip=null;
function showTooltip(e,def,l,mx){hideTooltip();
tooltip=document.createElement('div');tooltip.className='skill-tooltip';
tooltip.innerHTML=`<b>${LN(def.n)}</b><br><em>${LN(def.d)}</em><br>${S.lang==='ru'?'Уровень':'Level'}: ${l}/${mx}`;
document.body.appendChild(tooltip);
const r=e.target.getBoundingClientRect();
tooltip.style.left=clamp(r.left+r.width/2-110,8,innerWidth-228)+'px';
tooltip.style.top=Math.max(8,r.top-86)+'px';}
function hideTooltip(){if(tooltip){tooltip.remove();tooltip=null;}}

let lastNodeClick={k:'',t:0};
function buySkillNode(n){
const now=performance.now();
if(lastNodeClick.k===n.k&&now-lastNodeClick.t<300)return;
lastNodeClick={k:n.k,t:now};
if(!nodeUnlocked(n)||S.over)return;
const mx=nodeMax(n),c=skCost(n);
if(sk(n.k)>=mx||S.dew<c)return;
const isShared=!!n.parent2;const isBase=!n.parent;
if(!isShared&&!isBase){
const pureMaxed=SKDEF.filter(d=>!d.parent2&&d.parent&&sk(d.k)>=1).length;
if(pureMaxed>=3&&sk(n.k)<1){toast(t('skillCap'));return;}}
S.dew-=c;const before=treeMaxHp();
S.skill[n.k]=(S.skill[n.k]||0)+1;
if(n.stat==='sHp')S.treeHp=Math.min(treeMaxHp(),S.treeHp+(treeMaxHp()-before));
pulse=1;leafBurst();sfx.upgrade();
save();updateHUD();renderSkillTree();}

const HUNT_GOAL=120;
const DAILY_POOL=[
{id:'dk',g:50,r:8,txt:{ru:'Убей 50 существ',en:'Slay 50 creatures'}},
{id:'dw',g:3,r:6,txt:{ru:'Пройди 3 этапа',en:'Clear 3 stages'}},
{id:'dr',g:2,r:10,txt:{ru:'Переверни карты 2 раза',en:'Flip the cards twice'}},
{id:'dc',g:5,r:7,txt:{ru:'Нанеси 5 крит. ударов',en:'Land 5 critical hits'}},
{id:'du',g:3,r:9,txt:{ru:'Купи 3 улучшения',en:'Buy 3 upgrades'}}];
const ACH=[
{id:'a_w10',g:10,field:'bestWave',r:{dew:20},txt:{ru:'Достигни этапа 2-3',en:'Reach stage 2-3'}},
{id:'a_w25',g:25,field:'bestWave',r:{amber:5},txt:{ru:'Достигни этапа 4-4',en:'Reach stage 4-4'}},
{id:'a_eq5',g:5,field:'equipCount',r:{dew:12},txt:{ru:'Экипируй 5 способностей',en:'Equip 5 abilities'}},
{id:'a_skin',g:1,field:'skinCount',r:{amber:3},txt:{ru:'Купи облик древа',en:'Buy a tree look'}}];

function ensureDaily(){const dk=dayKey();
if(S.dailyDate!==dk){S.dailyDate=dk;S.dailyDone={};S.dailyProg={kills:0,waves:0,spins:0,crits:0,upg:0};save();}
if(!S.dailyProg||typeof S.dailyProg!=='object')S.dailyProg={kills:0,waves:0,spins:0,crits:0,upg:0};}

function dailyList(){ensureDaily();const r=rng(S.dailyDate);const pool=[...DAILY_POOL];
const pick=[];for(let i=0;i<3&&pool.length;i++){pick.push(pool.splice(Math.floor(r()*pool.length),1)[0]);}
return pick.map(p=>{const prog=S.dailyProg[p.id==='dk'?'kills':p.id==='dw'?'waves':p.id==='dr'?'spins':p.id==='dc'?'crits':'upg']||0;
const done=prog>=p.g,claimed=!!S.dailyDone[p.id];
return {id:p.id,txt:p.txt,goal:p.g,prog:Math.min(prog,p.g),done,claimed,reward:{dew:p.r}};});}

function waveQuest(){
if(S.waveQ.done&&!S.waveQ.claimed){const w=S.waveQ.wave||S.wave;const goal=CONFIG.QUOTA(w);
return {id:'wq',txt:{ru:'Зачисти этап '+stageOf(w),en:'Clear stage '+stageOf(w)},goal,prog:goal,done:true,claimed:false,reward:{dew:5}};}
const goal=CONFIG.QUOTA(S.wave);
return {id:'wq',txt:{ru:'Зачисти этап '+stageOf(S.wave),en:'Clear stage '+stageOf(S.wave)},goal,prog:Math.min(S.killed,goal),done:false,claimed:false,reward:{dew:5}};}

function onceList(){const list=[];
for(let ch=1;ch<=S.chaptersCleared;ch++){const id='chap'+ch;
list.push({id,txt:{ru:t('chap')+' '+stageOf(ch*7)+' '+t('chapDone'),en:t('chap')+' '+stageOf(ch*7)+' '+t('chapDone')},
goal:1,prog:1,done:true,claimed:!!S.onceDone[id],reward:{dew:chapterReward(ch)}});}
ACH.forEach(a=>{let val=0;
if(a.field==='totalKills')val=S.totalKills;else if(a.field==='bestWave')val=S.bestWave;
else if(a.field==='equipCount')val=Math.min(S.equip.length,slotCap());else if(a.field==='skinCount')val=S.treeSkins.length-1;
const done=val>=a.g;
list.push({id:a.id,txt:a.txt,goal:a.g,prog:Math.min(val,a.g),done,claimed:!!S.onceDone[a.id],reward:a.r});});
return list;}

function huntQuest(){const prog=Math.min(S.huntKills||0,HUNT_GOAL);
return {id:'hunt',txt:{ru:'Охота: убей 120 существ',en:'Hunt: slay 120 creatures'},
goal:HUNT_GOAL,prog,done:prog>=HUNT_GOAL,claimed:false,reward:{dew:40+10*(S.huntDone||0)}};}

function claimQuest(q,sec){if(!q.done||q.claimed)return;
if(sec==='daily')S.dailyDone[q.id]=1;else if(sec==='wave')S.waveQ.claimed=1;else S.onceDone[q.id]=1;
if(q.reward.dew){S.dew+=q.reward.dew;bump('#dewPill');}
if(q.reward.amber){S.amber+=q.reward.amber;}
sfx.claim();save();updateHUD();renderQuests();}

function claimHunt(){const q=huntQuest();if(!q.done)return;
S.dew+=q.reward.dew;bump('#dewPill');S.huntKills=0;S.huntDone=(S.huntDone||0)+1;
sfx.claim();save();updateHUD();renderQuests();}

function claimAllQuests(){let any=false;
dailyList().forEach(q=>{if(q.done&&!q.claimed){claimQuest(q,'daily');any=true;}});
const wq=waveQuest();if(wq.done&&!wq.claimed){claimQuest(wq,'wave');any=true;}
onceList().forEach(q=>{if(q.done&&!q.claimed){claimQuest(q,'once');any=true;}});
if(huntQuest().done){claimHunt();any=true;}
if(any)renderQuests();}

function rewSpan(q){return q.reward.amber
?`<span class="q-rew amber ${q.done?'':'inactive'}"><svg viewBox="0 0 16 16"><path d="M8 1.5 13 6l-5 8.5L3 6l5-4.5Z" fill="#f0a848"/></svg>${q.reward.amber}</span>`
:`<span class="q-rew ${q.done?'':'inactive'}"><svg viewBox="0 0 16 16"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" fill="#7cc9e8"/></svg>${q.reward.dew}</span>`;}

function renderQuests(){
try{const sec=(title,arr,secKey)=>`<div class="q-sec"><h3>${title}</h3>`+
arr.map(q=>{const rew=rewSpan(q);
const right=q.claimed?`<span class="q-claimed">${t('qDone')}</span>`
:q.done?`<button class="q-claim" data-q="${q.id}" data-sec="${secKey}">${rew}</button>`:rew;
return `<div class="qrow ${q.done?'done':''}">
<span class="q-ico"><svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
<span class="q-body"><span class="q-txt">${LN(q.txt)}</span>
<span class="q-bar"><i style="width:${clamp(100*q.prog/q.goal,0,100)}%"></i></span>
<span class="q-prog">${q.prog}/${q.goal}</span></span>${right}</div>`;}).join('')+'</div>';
const hq=huntQuest();
$('#questsContent').innerHTML=
sec(t('qDaily'),dailyList(),'daily')+sec(t('qWave'),[waveQuest()],'wave')+
sec(t('qHunt')+' · ×'+(S.huntDone||0),[hq],'hunt')+sec(t('qOnce'),onceList(),'once');
const avail=[...dailyList(),waveQuest(),...onceList()].filter(q=>q.done&&!q.claimed).length+(hq.done?1:0);
const cab=$('#claimAllBtn');cab.textContent=t('qAll');cab.disabled=avail===0;
}catch(e){console.error('renderQuests',e);}}

$('#questsContent').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;
if(b.dataset.sec==='hunt'){claimHunt();return;}
claimQuest(findQuest(b.dataset.q,b.dataset.sec),b.dataset.sec);});
$('#claimAllBtn').addEventListener('click',claimAllQuests);
function findQuest(id,sec){if(sec==='daily')return dailyList().find(q=>q.id===id);
if(sec==='wave')return waveQuest();return onceList().find(q=>q.id===id);}

function renderSkins(){
try{$('#shopAmber').textContent=fmt(S.amber);
$('#skinGrid').innerHTML=Object.entries(TREE_SKINS).sort((a,b)=>a[1].cost-b[1].cost).map(([k,ts])=>{
const owned=S.treeSkins.includes(k),active=S.treeSkin===k;
const state=active?`<span style="color:var(--gold2)">${S.lang==='ru'?'Используется':'Equipped'}</span>`
:owned?`<span style="color:var(--teal)">${S.lang==='ru'?'Выбрать':'Select'}</span>`
:`<span style="color:#ffd9a0"><svg viewBox="0 0 16 16"><path d="M8 1.5 13 6l-5 8.5L3 6l5-4.5Z" fill="#f0a848"/></svg> ${ts.cost}</span>`;
return `<div class="skin-card ${active?'active':''}" data-tree="${k}">
<div class="skin-prev">${ts.svg}</div><div class="skin-name">${LN(ts.name)}</div>
<div class="skin-state">${state}</div></div>`;}).join('');
}catch(e){console.error('renderSkins',e);}}

function pickTree(k){const ts=TREE_SKINS[k];
if(!S.treeSkins.includes(k)){if(S.amber<ts.cost)return;S.amber-=ts.cost;S.treeSkins.push(k);}
S.treeSkin=k;sfx.claim();pulse=1;leafBurst();save();renderSkins();updateHUD();applyTreeSkin();}
$('#skinGrid').addEventListener('click',e=>{const c=e.target.closest('[data-tree]');if(c)pickTree(c.dataset.tree);});
function renderShop(){renderSkins();}

function burst(x,y,r,c){const n=Math.min(26,8+r);
for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(20,90+r*3);
parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,l:rand(.35,.7),ml:.7,sz:rand(1.5,3.2),c});}
parts.push({ring:true,x,y,l:.3,ml:.3,r0:r*.4,r1:r*2.2,c});}
function puff(x,y){for(let i=0;i<4;i++)parts.push({x,y,vx:rand(-20,20),vy:rand(-20,20),l:.25,ml:.25,sz:1.6,c:'255,217,138'});}
function leafBurst(){const g=treeGeom(),ts=TREE_SKINS[S.treeSkin]||TREE_SKINS.oak;
for(let i=0;i<14;i++)parts.push({leaf:true,lk:ts.leafKind,ph:rand(0,TAU),
x:rand(-g.R,g.R)*.9,y:-g.h+rand(-g.R*.4,g.R*.3),vy:rand(16,28),l:rand(1,1.8),ml:1.8,c:ts.leafC});
parts.push({ring:true,x:0,y:-g.h,l:.45,ml:.45,r0:g.R*.5,r1:g.R*2.4,c:ts.glow});}
function gainDew(n,x,y,quiet){S.dew+=n;bump('#dewPill');
if(!quiet)floats.push({x,y,txt:'+'+fmt(n)+' росы',l:1.3,ml:1.3,c:'#a5e8f0',sz:13});updateHUD();}

function kill(e){
if(e.tut){ if(S.tutPhase==='new')enterBoost(); return; }
let rw=e.rw;
rw=Math.round(rw*(1+artBonus('seedRw')/100)*(mutActive('mut_golden')?3:1));
S.seeds+=rw;runSeeds+=rw;S.killed++;S.totalKills++;runKills++;
if(S.dailyProg){S.dailyProg.kills=(S.dailyProg.kills||0)+1;}
S.huntKills=(S.huntKills||0)+1;
burst(e.x,e.y*ISO-e.r*.5,e.r,e.type==='boss'?'214,110,170':'224,124,94');
if(e.type==='boss'){
if(S.tutorialDone)gainDew(clamp(6+Math.floor(chapterOf(S.wave)/10)+artBonus('dewBoss'),3,40),e.x,e.y*ISO-e.r-36,true);
if(S.tutorialDone&&Math.random()<0.35)dropArtifact();
nextWave();}
else{if(e.type==='golem'&&Math.random()<.12&&S.tutorialDone)gainDew(1,e.x,e.y*ISO-e.r-30,true);sfx.kill();}}

function chainLightning(src,dmg){
let hits=[src];let cur=src;
for(let i=0;i<3;i++){let best=null,bd=1e9;
for(const e of enemies){if(e.dead||hits.includes(e))continue;
const dx=e.x-cur.x,dy=e.y-cur.y;const d=dx*dx+dy*dy;if(d<bd&&d<200*200){bd=d;best=e;}}
if(!best)break;hits.push(best);hit(best,dmg,false);
parts.push({ring:true,x:(cur.x+best.x)/2,y:((cur.y+best.y)/2)*ISO,l:.2,ml:.2,r0:2,r1:12,c:'180,220,255'});
cur=best;}}

function hit(e,dmg,crit){if(S.over||e.dead)return;
e.hp-=dmg;e.flash=1;
parts.push({x:e.x+rand(-4,4),y:e.y*ISO-e.r*.5,vx:rand(-14,14),vy:rand(-24,-6),l:.3,ml:.3,sz:2,c:'255,236,190'});
const bP=abilPct('bleed');
if(bP>0&&!e.dead){e.bleed=Math.min(10,(e.bleed||0)+1);e.bleedT=3;}
if(mutActive('mut_vampire')&&!S.over){S.treeHp=Math.min(treeMaxHp(),S.treeHp+dmg*0.05);}
if(crit){if(S.dailyProg)S.dailyProg.crits=(S.dailyProg.crits||0)+1;
if(showDmg)floats.push({x:e.x+rand(-6,6),y:e.y*ISO-e.r-12,txt:'CRIT '+fmt(dmg),l:.85,ml:.85,c:'#ffd76a',sz:13});sfx.crit();
if(artHas('chainCrit')&&!e.dead)chainLightning(e,dmg*artBonus('chainCrit')/100);
}else{if(showDmg)floats.push({x:e.x+rand(-6,6),y:e.y*ISO-e.r-8,txt:fmt(dmg),l:.65,ml:.65,c:'#ffe9b8',sz:10.5});sfx.hit();}
if(e.hp<=0&&!e.tut)e.dead=true;}

function damageTree(d){if(S.over)return;
S.treeHp-=d;flinch=1;if(S.shake)shakeM=Math.max(shakeM,4.5);vig();sfx.hurt();
if(S.treeHp<=0){
if(mutActive('mut_phoenix')){S.mutations=S.mutations.filter(m=>m.k!=='mut_phoenix');
S.treeHp=treeMaxHp()*0.5;toast('🔥 '+t('revive'));sfx.upgrade();leafBurst();return;}
S.treeHp=0;gameOver();}
updateHUD();}

let pendingMut=false;
function nextWave(){
const finishedWave=S.wave;
S.wave++;S.bestWave=Math.max(S.bestWave,S.wave);
S.killed=0;spawned=0;bossActive=false;betweenT=2.6;
S.waveQ={prog:0,done:false,claimed:false,wave:finishedWave};
S.waveQ.done=true;
if(S.dailyProg)S.dailyProg.waves=(S.dailyProg.waves||0)+1;
if(S.tutorialDone)gainDew(10,0,-treeGeom().h-30);
const bonus=Math.round(6+S.wave*3*Math.pow(1.06,S.wave-1));
S.seeds+=bonus;runSeeds+=bonus;
if(finishedWave%7===0){const ch=chapterOf(finishedWave);
if(S.chaptersCleared<ch){S.chaptersCleared=ch;
banner(t('chap')+' '+stageOf(finishedWave)+'!', (S.lang==='ru'?'награда в пропуске':'pass reward'), 'chap');
if(S.tutorialDone){pendingMut=true;setTimeout(showMutChoice,1200);}}}
const subs=SUBS[S.lang]||SUBS.ru;
banner(t('stage')+' '+stageOf(S.wave), subs[Math.floor(Math.random()*subs.length)], false);
sfx.wave();save();updateHUD();}

function showMutChoice(){
if(S.over)return;
cleanMuts();
const pool=[...MUTATIONS];const picks=[];
for(let i=0;i<3&&pool.length;i++)picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
$('#mutCards').innerHTML=picks.map(m=>`<div class="mut-opt" data-mut="${m.k}">
<span class="mut-opt-ico">${m.svg}</span>
<span class="mut-opt-body"><b>${LN(m.n)}</b><span>${LN(m.desc)}</span></span>
<span class="mut-opt-dur">${m.dur>=9999?'∞':m.dur+'с'}</span></div>`).join('');
open('#mutOverlay');}

$('#mutCards').addEventListener('click',e=>{
const c=e.target.closest('[data-mut]');if(!c)return;
const k=c.dataset.mut;const m=MUT_BY_K[k];
cleanMuts();
S.mutations=S.mutations.filter(x=>x.k!==k);
S.mutations.push({k,expiresAt:m.dur>=9999?0:Date.now()+m.dur*1000});
if(S.mutations.length>10)S.mutations.shift();
sfx.mut();pulse=1;leafBurst();toast('🧬 '+LN(m.n));
close('#mutOverlay');save();updateHUD();});

function renderMutBar(){
cleanMuts();const bar=$('#mutBar');
if(!S.mutations.length){bar.innerHTML='';return;}
bar.innerHTML=S.mutations.map(m=>{const md=MUT_BY_K[m.k];if(!md)return'';
const rem=m.expiresAt===0?'∞':Math.max(0,Math.ceil((m.expiresAt-Date.now())/1000));
return `<div class="mut-chip" title="${LN(md.desc)}">${md.svg}<span>${LN(md.short||md.n)}</span><span class="mt">${rem}</span></div>`;}).join('');}

function gameOver(){
S.over=true;if(S.shake)shakeM=10;sfx.over();
const g=treeGeom();burst(0,-g.h*.6,g.R,'124,168,120');
$('#stWave').textContent=stageOf(S.wave);$('#stKills').textContent=fmt(runKills);$('#stSeeds').textContent=fmt(runSeeds);
setTimeout(()=>open('#overOverlay'),900);}

function launchRoot(tg,b=0,dmgMul=1){roots.push({phase:'telegraph',strikeT:0,spikeT:0,tg,tx:tg.x,ty:tg.y,b,dmgMul,seed:rand(0,100)});}
function rootStrike(p){
const tg=p.tg;
if(tg&&!tg.dead){const dx=tg.x-p.tx,dy=tg.y-p.ty;if(dx*dx+dy*dy<(tg.r+24)*(tg.r+24)){
const isCrit=Math.random()<critChance();
const dmg=coreDmg()*rootMul()*0.5*(p.dmgMul||1)*(isCrit?critMult():1);
tg.lift=isCrit?14:9;hit(tg,dmg,isCrit);
const sx=p.tx,sy=p.ty*ISO;
for(let k=0;k<(isCrit?16:10);k++)parts.push({x:sx+rand(-16,16),y:sy,vx:rand(-30,30),vy:rand(-70,-26),l:rand(.4,.7),ml:.7,sz:rand(1.5,3),c:isCrit?'255,224,150':'120,90,58'});
parts.push({ring:true,x:sx,y:sy,l:.4,ml:.4,r0:8,r1:isCrit?70:48,c:isCrit?'255,210,120':'201,160,106'});
if(S.shake)shakeM=Math.max(shakeM,isCrit?5:3);sfx.strike();
}else{const sx=p.tx,sy=p.ty*ISO;
for(let k=0;k<6;k++)parts.push({x:sx+rand(-12,12),y:sy,vx:rand(-20,20),vy:rand(-50,-20),l:.4,ml:.4,sz:rand(1.5,2.5),c:'120,90,58'});
sfx.strike();}}}

function cdMul(){return mutActive('mut_storm')?0.5:1;}

function castAbilities(dt){
const P=abilPct, L=ab, RR=FRR;
for(const k in cd)cd[k]=Math.max(0,cd[k]-dt);
if(L('thornsalvo')>0&&cd.thornsalvo<=0){const tg=nearestInReach();
if(tg){cd.thornsalvo=Math.max(1.4,2.4-0.12*L('thornsalvo'))*cdMul();treeShakeT=0.25;
const base=Math.atan2(tg.y,tg.x);const n=3+L('thornsalvo');const spread=0.9;const dmg=coreDmg()*(P('thornsalvo')/100)*0.5;
const maxLife=RR/420;
for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*(spread/(n-1||1));
shots.push({kind:'thorn',x:0,y:-treeGeom().h,vx:Math.cos(a)*420,vy:Math.sin(a)*420*ISO,dmg,life:Math.min(maxLife,1.6),pierce:1});}
sfx.cast();}}
if(L('vinewhip')>0&&cd.vinewhip<=0){const tg=nearestInReach();
if(tg){cd.vinewhip=Math.max(2,3.2-0.15*L('vinewhip'))*cdMul();
const dir=Math.atan2(tg.y,tg.x);const dmg=coreDmg()*(P('vinewhip')/100)*0.6;
zones.push({kind:'vine',t:0,dur:0.5,dir,R:RR,dmg,hit:new Set(),side:Math.random()<.5?1:-1});sfx.cast();}}
if(L('spores')>0&&cd.spores<=0){const tg=nearestInReach();
if(tg){cd.spores=Math.max(3,5-0.2*L('spores'))*cdMul();
const dir=Math.atan2(tg.y,tg.x);
zones.push({kind:'spore',t:0,dur:3.2,x:0,y:-treeGeom().h*0.5,vx:Math.cos(dir)*55,vy:Math.sin(dir)*55,
r:Math.min(RR*(0.28+0.02*L('spores')),RR*0.6),dmg:coreDmg()*(P('spores')/100)*0.12,tick:0});sfx.cast();}}
if(L('crownwrath')>0&&cd.crownwrath<=0){
const tgts=enemies.filter(e=>!e.dead&&inReach(e)).sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y)).slice(0,2+Math.floor(L('crownwrath')/2));
if(tgts.length>0){cd.crownwrath=Math.max(2.4,4-0.2*L('crownwrath'))*cdMul();treeShakeT=0.3;
const dmg=coreDmg()*(P('crownwrath')/100)*0.7;
tgts.forEach((e,i)=>{shots.push({kind:'branchfall',tx:e.x,ty:e.y,x:e.x+rand(-30,30),y:-260-rand(0,80),t:0,dur:0.6+i*0.08,dmg,done:false});});sfx.cast();}}
if(L('roottrap')>0&&cd.roottrap<=0){const tg=nearestInReach();
if(tg){cd.roottrap=Math.max(3.5,6-0.3*L('roottrap'))*cdMul();
const trapMul=1+0.20*statCount('sTrapPow');
const Rz=Math.min(RR*(0.4+0.03*L('roottrap')),RR*0.7);
zones.push({kind:'trap',t:0,dur:2.4,x:tg.x,y:tg.y,R:Rz,dmg:coreDmg()*(P('roottrap')/100)*0.5*trapMul,hit:false});sfx.cast();}}
if(L('fruitbomb')>0&&cd.fruitbomb<=0){const tg=nearestInReach();
if(tg){cd.fruitbomb=Math.max(3,5-0.25*L('fruitbomb'))*cdMul();
const n=2+Math.floor(L('fruitbomb')/2);const dmg=coreDmg()*(P('fruitbomb')/100)*0.7;const maxDist=RR*0.8;
for(let i=0;i<n;i++){const curTg=nearestInReach();if(!curTg)break;
const a=Math.atan2(curTg.y,curTg.x)+rand(-0.4,0.4);const dist=rand(60,maxDist);
shots.push({kind:'fruit',x:rand(-12,12),y:-treeGeom().h*0.6,tx:Math.cos(a)*dist,ty:Math.sin(a)*dist,t:0,dur:0.7,dmg,R:Math.min(RR*(0.35+0.02*L('fruitbomb')),RR*0.5),done:false});}
sfx.cast();}}
if(L('acidsap')>0&&cd.acidsap<=0){const tg=nearestInReach();
if(tg){cd.acidsap=Math.max(2.5,4-0.2*L('acidsap'))*cdMul();
const a=Math.atan2(tg.y,tg.x);const dist=Math.min(Math.hypot(tg.x,tg.y),RR);
shots.push({kind:'acidstream',x:0,y:-treeGeom().h*0.5,vx:Math.cos(a)*460,vy:Math.sin(a)*460*ISO,life:dist/460,dmg:coreDmg()*(P('acidsap')/100)*0.4,R:Math.min(RR*(0.3+0.02*L('acidsap')),RR*0.5),puddle:false});sfx.cast();}}
}

function updateZones(dt){
const RR=FRR;
for(let i=zones.length-1;i>=0;i--){const z=zones[i];z.t+=dt;
if(z.kind==='vine'){const prog=smooth(clamp(z.t/z.dur,0,1));
if(prog>0.3){for(const e of enemies){if(e.dead||z.hit.has(e)||!inReach(e))continue;
const d2=e.x*e.x+e.y*e.y;const ea=Math.atan2(e.y,e.x);
let da=Math.abs(((ea-z.dir+Math.PI)%(TAU))-Math.PI);
if(d2<z.R*z.R&&da<1.1){z.hit.add(e);hit(e,z.dmg,false);
if(!e.dead){e.x+=Math.cos(ea)*22;e.y+=Math.sin(ea)*22;e.spin=rand(-3,3);}}}}
if(z.t>=z.dur){zones.splice(i,1);continue;}
}else if(z.kind==='spore'){z.x+=z.vx*dt;z.y+=z.vy*dt;z.tick-=dt;
if(z.tick<=0){z.tick=0.4;const r2=z.r*z.r;for(const e of enemies){if(e.dead||!inReach(e))continue;
const dx=e.x-z.x,dy=e.y-z.y;if(dx*dx+dy*dy<r2)hit(e,z.dmg,false);}}
if(z.t>z.dur-0.5)z.r+=40*dt;
if(z.t>=z.dur){zones.splice(i,1);continue;}
}else if(z.kind==='trap'){const ph=z.t/z.dur;
if(ph>0.25&&ph<0.8&&!z.hit){z.hit=true;const r2=z.R*z.R;
for(const e of enemies){if(e.dead||!inReach(e))continue;
const dx=e.x-z.x,dy=e.y-z.y;if(dx*dx+dy*dy<r2){hit(e,z.dmg,false);e.held=1.2;}}}
if(ph>=0.25&&ph<0.8){const r2=(z.R*0.7)*(z.R*0.7);for(const e of enemies){if(e.dead)continue;
const dx=e.x-z.x,dy=e.y-z.y;if(dx*dx+dy*dy<r2)e.held=Math.max(e.held,0.2);}}
if(z.t>=z.dur){zones.splice(i,1);continue;}
}else if(z.kind==='puddle'){z.tick-=dt;
if(z.tick<=0){z.tick=0.4;const r2=z.r*z.r;for(const e of enemies){if(e.dead||!inReach(e))continue;
const dx=e.x-z.x,dy=e.y-z.y;if(dx*dx+dy*dy<r2)hit(e,z.dmg,false);}}
if(z.t>=z.dur){zones.splice(i,1);continue;}
}}

function simulate(dt){
if(S.treeHp>0&&S.treeHp<treeMaxHp()){
let regen=CONFIG.STAT.regen(S.regenLvl);
if(mutActive('mut_regen'))regen+=0.02;
S.treeHp=Math.min(treeMaxHp(),S.treeHp+treeMaxHp()*regen*dt);}
treeShakeT=Math.max(0,treeShakeT-dt);
cleanMuts();
const frozen=['boost','cards','powers'].includes(S.tutPhase);
if(!frozen){
thornAuraT-=dt;
const auraPct=(artBonus('thornAura')+(mutActive('mut_thorns_aura')?10:0));
if(auraPct>0&&thornAuraT<=0){thornAuraT=0.5;
for(const e of enemies){if(e.dead||!inReach(e))continue;hit(e,coreDmg()*(auraPct/100)*0.5,false);}}
if(artHas('acorn')){acornT-=dt;if(acornT<=0){acornT=30;
const dmg=coreDmg()*artBonus('acorn')/100;
for(const e of enemies){if(!e.dead&&inReach(e))hit(e,dmg,false);}
parts.push({ring:true,x:0,y:0,l:.6,ml:.6,r0:20,r1:FRR,c:'240,168,72'});if(S.shake)shakeM=Math.max(shakeM,5);sfx.boom();}}
if(mutActive('mut_earthquake')){quakeT-=dt;if(quakeT<=0){quakeT=5;
const dmg=coreDmg()*1.5;
for(const e of enemies){if(!e.dead&&inReach(e))hit(e,dmg,false);}
parts.push({ring:true,x:0,y:0,l:.5,ml:.5,r0:10,r1:FRR,c:'201,160,106'});if(S.shake)shakeM=Math.max(shakeM,6);sfx.strike();}}
if(S.tutPhase==='new'){
if(enemies.length===0){spawn('beetle');const e0=enemies[enemies.length-1];e0.tut=true;e0.sp=50;
e0.hp=e0.maxHp=Math.max(e0.maxHp,150);
const a0=Math.atan2(e0.y,e0.x);e0.x=Math.cos(a0)*220;e0.y=Math.sin(a0)*220;}
}else if(betweenT>0){betweenT-=dt;}
else if(!bossActive){spawnT-=dt;
if(spawnT<=0&&spawned<CONFIG.QUOTA(S.wave)){if(enemies.length<70){spawn(pickType(S.wave));spawned++;}
spawnT=spawnInt(S.wave)*rand(.75,1.25);}
if(S.killed>=CONFIG.QUOTA(S.wave)){bossActive=true;const bc=bossCount();
for(let i=0;i<bc;i++)spawn('boss',Math.pow(0.7,i));
if(S.shake)shakeM=Math.max(shakeM,6);sfx.boss();
banner((S.lang==='ru'?'Медведь-крушитель пробуждается…':'The Bear-Crusher awakens…'),
(bc>1?bc+'× ':'')+(S.lang==='ru'?'лесные исполины вышли из чащи':'the forest titans emerge'),'boss');
updateHUD();}}}
if(!frozen){castAbilities(dt);updateZones(dt);}
if(!frozen){rootT-=dt;
if(rootT<=0&&enemies.length){rootT=1/rootAspd();
const inR=enemies.filter(e=>{if(e.dead)return false;const rr=FRR+e.r;return e.x*e.x+e.y*e.y<=rr*rr;});
if(inR.length){inR.sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y));
const count=Math.min(1+ab('rootnet')+statCount('sRootNet'),inR.length);
for(let i=0;i<count;i++){launchRoot(inR[i]);sfx.dig();}}}}
if(!frozen){for(let i=roots.length-1;i>=0;i--){const p=roots[i];
if(p.phase==='telegraph'){if(p.tg&&!p.tg.dead){p.tx=p.tg.x;p.ty=p.tg.y;}
p.strikeT+=dt;if(p.strikeT>=0.16){p.phase='spike';p.spikeT=0;rootStrike(p);}}
else if(p.phase==='spike'){p.spikeT+=dt;if(p.spikeT>=0.24){p.phase='retract';p.t=1;}}
else{p.t-=dt/0.3;if(p.t<=0){roots.splice(i,1);continue;}}}}
if(!frozen){
const seedL=ab('seedshot');const extraL=ab('multishot');const treeSeeds=statCount('sSeedCount');
const totalShots=seedL+extraL+treeSeeds;
if(totalShots>0){atkT-=dt;
if(atkT<=0&&enemies.length){const reach=FRR;
const tg=enemies.filter(e=>!e.dead&&e.x*e.x+e.y*e.y<=(reach+e.r)*(reach+e.r))
.sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y));
if(tg.length>0){atkT=1/treeAspd();
const n=Math.min(totalShots,Math.max(tg.length,totalShots));
const g=treeGeom(),sw=Math.sin(T*1.05)*2.6;const sdmg=coreDmg()*seedMul();
const projSpd=480*(1+artBonus('projSpd')/100);
let fired=0;
for(let i=0;i<n&&fired<tg.length*3;i++){
const target=tg[fired%tg.length];
let dmg=sdmg;
if(fired>=seedL+treeSeeds)dmg=sdmg*multishotDmgPct(extraL)/100;
shots.push({kind:'orb',x:sw*1.2,y:-g.h+8,t:target,dmg,sp:projSpd,b:0});
fired++;}
sfx.shoot();}}}}
if(!frozen){for(let i=shots.length-1;i>=0;i--){const s=shots[i];
if(s.kind==='ring'){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot+=.25;
if(s.life<=0){shots.splice(i,1);continue;}let gone=false;
for(const e of enemies){if(e.dead||!inReach(e))continue;
const dx=e.x-s.x,dy=(e.y-s.y)*ISO;if(dx*dx+dy*dy<(e.r+7)*(e.r+7)){hit(e,s.dmg,false);s.pierce--;
if(s.pierce<=0){shots.splice(i,1);gone=true;break;}}}
if(gone)continue;continue;}
if(s.kind==='thorn'){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=200*dt;
if(s.life<=0){shots.splice(i,1);continue;}let gone=false;
for(const e of enemies){if(e.dead||!inReach(e))continue;
const dx=e.x-s.x,dy=(e.y*ISO-s.y);if(dx*dx+dy*dy<(e.r+6)*(e.r+6)){hit(e,s.dmg,false);s.pierce--;
for(let k=0;k<3;k++)parts.push({x:s.x,y:s.y,vx:rand(-20,20),vy:rand(-20,0),l:.3,ml:.3,sz:1.6,c:'138,106,64'});
if(s.pierce<=0){shots.splice(i,1);gone=true;break;}}}
if(gone)continue;continue;}
if(s.kind==='branchfall'){s.t+=dt;const pr=clamp(s.t/s.dur,0,1);
s.x=lerp(s.x,s.tx,pr*0.4);s.y=lerp(s.y,s.ty*ISO,pr);
if(pr>=1&&!s.done){s.done=true;
for(const e of enemies){if(e.dead||!inReach(e))continue;const dx=e.x-s.tx,dy=e.y-s.ty;if(dx*dx+dy*dy<(e.r+22)*(e.r+22))hit(e,s.dmg,false);}
burst(s.tx,s.ty*ISO,22,'150,110,70');
parts.push({ring:true,x:s.tx,y:s.ty*ISO,l:.35,ml:.35,r0:6,r1:40,c:'180,150,110'});
sfx.strike();shots.splice(i,1);continue;}continue;}
if(s.kind==='fruit'){s.t+=dt;const pr=clamp(s.t/s.dur,0,1);
s.cx=lerp(s.x,s.tx,pr);s.cy=lerp(s.y,s.ty*ISO,pr)-Math.sin(pr*Math.PI)*40;
if(pr>=1&&!s.done){s.done=true;const r2=s.R*s.R;
for(const e of enemies){if(e.dead||!inReach(e))continue;const dx=e.x-s.tx,dy=e.y-s.ty;if(dx*dx+dy*dy<r2)hit(e,s.dmg,false);}
burst(s.tx,s.ty*ISO,s.R*0.7,'240,150,70');parts.push({ring:true,x:s.tx,y:s.ty*ISO,l:.4,ml:.4,r0:8,r1:s.R,c:'240,168,72'});
sfx.boom();if(S.shake)shakeM=Math.max(shakeM,3);shots.splice(i,1);continue;}continue;}
if(s.kind==='acidstream'){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
for(const e of enemies){if(e.dead||!inReach(e))continue;const dx=e.x-s.x,dy=(e.y*ISO-s.y);if(dx*dx+dy*dy<(e.r+8)*(e.r+8))hit(e,s.dmg*0.3,false);}
if(s.life<=0){if(!s.puddle){s.puddle=true;zones.push({kind:'puddle',t:0,dur:3.5,x:s.x,y:s.y/ISO,r:s.R,dmg:s.dmg*0.5,tick:0});}
shots.splice(i,1);continue;}continue;}
const tg=s.t;
if(tg.dead){puff(s.x,s.y);shots.splice(i,1);continue;}
const tx=tg.x,ty=tg.y*ISO-tg.r*.5,dx=tx-s.x,dy=ty-s.y,d=Math.hypot(dx,dy);
if(d<tg.r*.7+6){hit(tg,s.dmg,false);
const fP=abilPct('frost');
if(fP>0&&!tg.dead){hit(tg,coreDmg()*(fP/100)*1.0,false);tg.frost=0.5;
for(let k=0;k<4;k++)parts.push({x:tg.x+rand(-8,8),y:tg.y*ISO-tg.r*.5,vx:rand(-14,14),vy:rand(-20,0),l:.4,ml:.4,sz:1.8,c:'160,215,245'});}
const boL=ab('bounce'),rbL=ab('rootBounce');
const maxBounces=(boL>0?1:0)+rbL;
let best=null,bd=1e9;
for(const e of enemies){if(e===tg||e.dead)continue;const ex=e.x-tg.x,ey=(e.y-tg.y)*ISO;const dd=Math.hypot(ex,ey);if(dd<bd&&dd<280){bd=dd;best=e;}}
if(best&&s.b<maxBounces){
const isRoot=s.b>=(boL>0?1:0);
const bdmg=isRoot?s.dmg:s.dmg*bounceDmgPct(boL);
shots.push({kind:'orb',x:s.x,y:s.y,t:best,dmg:bdmg,sp:s.sp,b:s.b+1});}
shots.splice(i,1);continue;}
const v=s.sp*dt/d;s.x+=dx*v;s.y+=dy*v;
if(Math.random()<.5)parts.push({x:s.x,y:s.y,vx:rand(-8,8),vy:rand(-8,8),l:.22,ml:.22,sz:1.5,c:'255,217,138'});}}
const brP=abilPct('branch');
if(!frozen&&brP>0){branchCd-=dt;const reach=rootReach()*0.85;const r2=reach*reach;
const near=enemies.filter(e=>{if(e.dead)return false;return e.x*e.x+e.y*e.y<r2;});
if(branchCd<=0&&near.length){branchCd=Math.max(1.2,2.4-.2*ab('branch'));branchFx=1;branchAng=rand(0,TAU);branchDir*=-1;
const bdmg=coreDmg()*(brP/100)*0.4;
for(const e of near){hit(e,bdmg,false);if(!e.dead){const d=Math.max(1,Math.hypot(e.x,e.y));e.x+=e.x/d*16;e.y+=e.y/d*16;}}
for(let k=0;k<4;k++)parts.push({leaf:true,lk:'leaf',ph:rand(0,TAU),x:rand(-40,40),y:-treeGeom().h*.5,vy:rand(10,20),l:.8,ml:.8,c:'142,196,140'});
sfx.branch();}}
branchFx=Math.max(0,branchFx-dt*2.4);
const lfP=abilPct('leafstorm');
if(!frozen&&lfP>0){leafCd-=dt;
if(leafCd<=0&&enemies.some(e=>!e.dead&&inReach(e))){leafCd=Math.max(3.5,7-ab('leafstorm'));
const n=8+3*ab('leafstorm'),dmg=coreDmg()*(lfP/100)*0.4;const maxLife=FRR/190;
for(let i=0;i<n;i++){const a=i/n*TAU+rand(-.12,.12);
shots.push({kind:'ring',rot:rand(0,TAU),x:Math.cos(a)*46,y:Math.sin(a)*46,vx:Math.cos(a)*190,vy:Math.sin(a)*190,dmg,life:Math.min(maxLife,1.7),pierce:2});}
sfx.leaf();}}
const blP=abilPct('bleed');
for(const e of enemies){
e.born=Math.min(1,e.born+dt*2.2);e.lift=Math.max(0,e.lift-dt*40);e.flash=Math.max(0,e.flash-dt*6);
e.frost=Math.max(0,(e.frost||0)-dt);e.spin=(e.spin||0)*Math.max(0,1-dt*3);
if(e.held>0)e.held-=dt;
if(!frozen&&blP>0&&e.bleed>0&&e.bleedT>0&&!e.dead){e.bleedT-=dt;e.hp-=coreDmg()*(blP/100)*0.01*e.bleed*dt;
if(Math.random()<dt*4)parts.push({x:e.x+rand(-5,5),y:e.y*ISO-e.r*.5,vx:rand(-8,8),vy:rand(-18,-6),l:.4,ml:.4,sz:1.6,c:'168,220,120'});
if(e.bleedT<=0)e.bleed=0;if(e.hp<=0&&!e.tut)e.dead=true;}
if(frozen){e.vx=0;e.vy=0;continue;}
const d=Math.hypot(e.x,e.y),lim=26+e.r*.3;const held=e.held>0;
let mvx=0,mvy=0;
if(e.type==='spirit'){const v=e.sp*dt*(held?0.15:1);const ang=Math.atan2(-e.y*ISO,-e.x);
mvx=Math.cos(ang)*e.sp;mvy=Math.sin(ang)*e.sp;
if(d>lim){e.x+=Math.cos(ang)*v;e.y+=Math.sin(ang)*v/ISO;}
else if(!held){e.atk-=dt;if(e.atk<=0){e.atk=1.0;damageTree(e.dmg);if(e.tut&&S.tutPhase==='new')enterBoost();}}}
else if(d>lim){const v=e.sp*dt/d*(held?0.15:1);mvx=-e.x/d*e.sp;mvy=-e.y/d*e.sp;e.x-=e.x*v;e.y-=e.y*v;}
else if(!held){e.atk-=dt;if(e.atk<=0){e.atk=1.0;damageTree(e.dmg);if(e.tut&&S.tutPhase==='new')enterBoost();}}
e.vx=mvx;e.vy=mvy;
if(e.type==='boss'&&!e.dead&&Math.random()<dt*5)
parts.push({x:e.x+rand(-e.r,e.r)*.6,y:e.y*ISO-e.r*.6,vx:rand(-6,6),vy:rand(-20,-8),l:rand(.8,1.4),ml:1.4,sz:rand(1.2,2.4),c:'214,140,190'});}
for(let i=enemies.length-1;i>=0;i--){if(enemies[i].dead){kill(enemies[i]);enemies.splice(i,1);}}
windT+=dt;gustTimer-=dt;
if(gustTimer<=0){gustTarget=Math.random()<.5?rand(.4,1):rand(0,.2);gustTimer=rand(5,11);}
gust+=(gustTarget-gust)*Math.min(1,dt*1.2);
squirrelTimer-=dt;
if(!squirrel&&squirrelTimer<=0&&!anyOverlayOpen()&&!anySheetOpen()&&!frozen){
const target=scenery.filter(s=>s.type==='tree');
if(target.length){const tg=target[Math.floor(Math.random()*target.length)];
squirrel={t:0,dur:rand(4.5,6.5),fx:cx,fy:cy-treeGeom().h*.3,tx:tg.x,ty:tg.y,clicked:false,seed:rand(0,100)};}}
if(squirrel){squirrel.t+=dt;if(squirrel.clicked||squirrel.t>=squirrel.dur){squirrel=null;squirrelTimer=rand(120,300);}}
}

function spawnInt(w){return Math.max(.38,1.7*Math.pow(.94,w-1));}

function updateFx(dt){
flinch=Math.max(0,flinch-dt*3);pulse=Math.max(0,pulse-dt*1.6);
const g=treeGeom(),ts=TREE_SKINS[S.treeSkin]||TREE_SKINS.oak;
leafT-=dt;
if(leafT<=0){leafT=(ts.leafKind==='petal'||ts.leafKind==='leaf')?rand(.7,1.6):rand(1.1,2.2);
const up=ts.leafKind==='spark';
parts.push({leaf:true,lk:ts.leafKind,ph:rand(0,TAU),x:rand(-g.R,g.R)*.8,y:-g.h+rand(-g.R*.4,g.R*.3),
vy:up?rand(-18,-10):rand(14,26),l:rand(1.2,2.2),ml:2.2,c:ts.leafC});}
for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;
if(p.l<=0){parts.splice(i,1);continue;}
if(!p.ring){if(p.leaf){p.x+=Math.sin(p.l*5+p.ph)*(p.lk==='petal'?20:14)*dt+gust*8*dt;p.y+=p.vy*dt;}
else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt;p.vx*=Math.max(0,1-2.2*dt);}}}
if(parts.length>partCap())parts.splice(0,parts.length-partCap());
for(let i=floats.length-1;i>=0;i--){floats[i].l-=dt;if(floats[i].l<=0)floats.splice(i,1);}
}

function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function radg(x,y,r0,r1,stops){if(LOW_GFX()){const mid=stops[Math.floor(stops.length/2)];ctx.fillStyle=mid[1];return null;}
const g=ctx.createRadialGradient(x,y,r0,x,y,r1);for(const s of stops)g.addColorStop(s[0],s[1]);return g;}

function drawGrass(){
const swayBase=Math.sin(windT*.7)*3+gust*7;
ctx.strokeStyle='rgba(96,140,102,.5)';ctx.lineWidth=1.4;ctx.lineCap='round';ctx.beginPath();
for(const s of scenery){if(s.type!=='grass')continue;
const sway=(Math.sin(windT*1.1+s.ph)*2+swayBase)*s.sw;const h=8*s.s;
for(let k=-1;k<=1;k++){ctx.moveTo(s.x+k*2.4,s.y);ctx.quadraticCurveTo(s.x+k*2.4+sway*.4,s.y-h*.6,s.x+k*3+sway,s.y-h);}}
ctx.stroke();}

function drawSceneryObj(s){
const swayBase=Math.sin(windT*.7)*3+gust*7;const sway=(Math.sin(windT*1.1+s.ph)*2+swayBase)*s.sw;
if(s.type==='bush'){const r=14*s.s;
ctx.fillStyle='rgba(28,52,38,.92)';ctx.beginPath();ctx.arc(s.x+sway*.4,s.y-r*.5,r,0,TAU);ctx.arc(s.x-r*.6+sway*.3,s.y-r*.2,r*.7,0,TAU);ctx.arc(s.x+r*.6+sway*.3,s.y-r*.2,r*.7,0,TAU);ctx.fill();
ctx.fillStyle='rgba(46,82,58,.7)';ctx.beginPath();ctx.arc(s.x-r*.2+sway*.4,s.y-r*.8,r*.5,0,TAU);ctx.fill();
}else{const h=70*s.s,r=24*s.s;
ctx.fillStyle='rgba(20,34,26,.95)';ctx.beginPath();ctx.moveTo(s.x-3*s.s,s.y);ctx.lineTo(s.x-2*s.s+sway*.3,s.y-h*.6);ctx.lineTo(s.x+2*s.s+sway*.3,s.y-h*.6);ctx.lineTo(s.x+3*s.s,s.y);ctx.closePath();ctx.fill();
ctx.fillStyle='rgba(24,46,34,.95)';ctx.beginPath();ctx.arc(s.x+sway*.6,s.y-h*.7,r,0,TAU);ctx.arc(s.x-r*.6+sway*.5,s.y-h*.5,r*.7,0,TAU);ctx.arc(s.x+r*.6+sway*.5,s.y-h*.5,r*.7,0,TAU);ctx.fill();
ctx.fillStyle='rgba(34,62,46,.7)';ctx.beginPath();ctx.arc(s.x+sway*.6,s.y-h*.95,r*.6,0,TAU);ctx.fill();}}

function drawFlies(dt){if(LOW_GFX())return;
for(const f of flies){f.y-=f.s*dt*.008;if(f.y<-.02){f.y=1.02;f.x=Math.random();}
const x=(f.x+Math.sin(T*.5+f.p)*.012)*W+gust*10,y=f.y*H;
const a=clamp(.22+.34*Math.sin(T*2+f.p),0,1);if(a<=0)continue;
ctx.fillStyle='rgba('+f.c+','+a.toFixed(2)+')';ctx.beginPath();ctx.arc(x,y,1.8,0,TAU);ctx.fill();}}

function drawZones(){
for(const z of zones){
if(z.kind==='vine'){const pr=smooth(clamp(z.t/z.dur,0,1));const sweep=pr*Math.PI*1.1*z.side;
const layers=[['rgba(38,66,30,.95)',9],['rgba(96,150,70,.95)',5.5],['rgba(170,220,130,.8)',2]];
for(const [c,w] of layers){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();
for(let k=0;k<=14;k++){const a=z.dir+sweep*(k/14);const r=z.R*(k/14);
const wig=Math.sin(k*1.7+z.t*20)*2.2*(k/14);
const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*ISO+wig;k===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
}else if(z.kind==='spore'){const fade=z.t>z.dur-0.6?clamp((z.dur-z.t)/0.6,0,1):1;const x=cx+z.x,y=cy+z.y*ISO;
ctx.save();ctx.globalAlpha=fade;
const puffs=[[0,0,1],[-.5,.2,.6],[.5,.25,.62],[.15,-.35,.55],[-.25,-.3,.5]];
for(const p of puffs){const px=x+p[0]*z.r*.5,py=y-6+p[1]*z.r*.4,pr2=z.r*p[2]*(1+0.08*Math.sin(T*3+p[0]*9));
const g=radg(px,py,2,pr2,[[0,'rgba(190,235,130,.55)'],[.6,'rgba(140,200,80,.3)'],[1,'rgba(120,180,70,0)']]);
if(g){ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,pr2,0,TAU);ctx.fill();}}
ctx.restore();
}else if(z.kind==='trap'){const ph=z.t/z.dur;const rise=clamp(ph/0.25,0,1);const close=clamp((ph-0.25)/0.3,0,1);const sink=ph>0.8?clamp((ph-0.8)/0.2,0,1):0;
const x=cx+z.x,y=cy+z.y*ISO;const h=44*rise*(1-sink);const inward=close*0.62;
ctx.fillStyle='rgba(0,0,0,'+(0.25*(1-sink)).toFixed(2)+')';ell(x,y,z.R,z.R*ISO*.9);
for(let k=0;k<7;k++){const a=k/7*TAU+0.3;
const bx=x+Math.cos(a)*z.R,by=y+Math.sin(a)*z.R*ISO;
const tx2=x+Math.cos(a)*z.R*(1-inward),ty2=y+Math.sin(a)*z.R*(1-inward)*ISO-h;
const mxp=(bx+tx2)/2+Math.sin(a*3)*4,myp=(by+ty2)/2-7;
ctx.strokeStyle='rgba(122,86,54,'+(0.85*(1-sink)).toFixed(2)+')';ctx.lineWidth=4;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(mxp,myp,tx2,ty2);ctx.stroke();}
}else if(z.kind==='puddle'){const fade=z.t>z.dur-0.6?clamp((z.dur-z.t)/0.6,0,1):Math.min(1,z.t*4);const x=cx+z.x,y=cy+z.y*ISO;
ctx.save();ctx.globalAlpha=fade;
const g=radg(x,y,2,z.r,[[0,'rgba(190,240,110,.65)'],[.7,'rgba(140,200,70,.45)'],[1,'rgba(140,200,70,0)']]);
if(g){ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,z.r,z.r*ISO,0,0,TAU);ctx.fill();}
ctx.restore();}}}

function drawRoots(){
for(const p of roots){const Tx=cx+p.tx,Ty=cy+p.ty*ISO;
if(p.phase==='telegraph'){const pr=p.strikeT/0.16;
ctx.fillStyle='rgba(92,66,40,'+(0.5*pr).toFixed(2)+')';ell(Tx,Ty,12+8*pr,5+3*pr);
}else if(p.phase==='spike'){const pr=clamp(p.spikeT/0.24,0,1);const up=Math.sin(Math.min(1,pr*1.4)*Math.PI);const len=46*up;
ctx.lineCap='round';
ctx.strokeStyle='rgba(74,50,30,.95)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(Tx,Ty+4);ctx.lineTo(Tx,Ty-len);ctx.stroke();
ctx.strokeStyle='rgba(140,100,64,.9)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(Tx,Ty+4);ctx.lineTo(Tx,Ty-len);ctx.stroke();
ctx.fillStyle='rgba(225,255,215,.95)';ctx.beginPath();ctx.moveTo(Tx,Ty-len-8);ctx.lineTo(Tx-4,Ty-len+4);ctx.lineTo(Tx+4,Ty-len+4);ctx.closePath();ctx.fill();
}else{const pr=clamp(p.t,0,1);ctx.fillStyle='rgba(92,66,40,'+(0.4*pr).toFixed(2)+')';ell(Tx,Ty,12*pr,5*pr);}}}

function drawAttackRing(){
const rr2=FRR;const n=LOW_GFX()?60:110;ctx.lineCap='round';
for(let i=0;i<n;i++){const a=i/n*TAU+Math.sin(i*7.31)*.05;const rad=rr2+Math.sin(i*3.7)*3;
const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*ISO;const hgt=5+4*Math.abs(Math.sin(i*2.9));
const sway=Math.sin(windT*1.4+i)*1.8+gust*5;const al=.35+.3*Math.abs(Math.sin(i*1.7));
ctx.strokeStyle='rgba(158,208,128,'+al.toFixed(2)+')';ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+sway*.4,y-hgt*.6,x+sway,y-hgt);ctx.stroke();}}

function drawRootKnobs(){
const g=treeGeom(),rr2=FRR;const kn=rng(4242);
for(let i=0;i<14;i++){
const a=kn()*TAU,d=g.R*1.6+kn()*Math.max(20,rr2*0.85-g.R*1.6);
const kx=cx+Math.cos(a)*d,ky=cy+Math.sin(a)*d*ISO;
const kw=4+kn()*5,kh=kw*.45;
ctx.fillStyle='rgba(0,0,0,.3)';ell(kx,ky+1.5,kw,kh);
ctx.fillStyle='#3a2c1c';ctx.beginPath();ctx.ellipse(kx,ky,kw,kh,0,Math.PI,TAU);ctx.fill();
ctx.fillStyle='#5d4830';ctx.beginPath();ctx.ellipse(kx-kw*.2,ky-kh*.4,kw*.5,kh*.4,0,Math.PI,TAU);ctx.fill();}}

/* ═══════════ 3D-ДЕРЕВО (Three.js) ═══════════ */
const Tree3D=(()=>{
const SIZE=448, BASE_Y=0.57;
let renderer,scene,camera,treeGroup,rootsGroup,leafInstancedMesh=null,canvas=null,builtT=-1,ready=false;
let barkMat,barkDarkMat,leafMaterial,leafGeom;
function pseudoRandom(seed){let s=seed;return()=>{s=(s*16807+0)%2147483647;return (s-1)/2147483646;};}
function percentToAmplitude(p){return (p/100)*0.15;}
function ensureAssets(){
if(!barkMat){
barkMat=new THREE.MeshStandardMaterial({color:0x6b5138,roughness:0.85});
barkDarkMat=new THREE.MeshStandardMaterial({color:0x4a3826,roughness:0.9});
leafMaterial=new THREE.MeshStandardMaterial({color:0x4b9463,roughness:0.4,side:THREE.DoubleSide});
const s=new THREE.Shape();
s.moveTo(0,-0.5);s.bezierCurveTo(0.2,-0.3,0.3,0.3,0,0.5);s.bezierCurveTo(-0.3,0.3,-0.2,-0.3,0,-0.5);
leafGeom=new THREE.ShapeGeometry(s);leafGeom.scale(0.35,0.35,1);
}}
function init(){
if(!THREE){ready=false;return;}
try{
canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;
renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(SIZE,SIZE);renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
scene=new THREE.Scene();
camera=new THREE.PerspectiveCamera(45,1,0.5,80);
camera.position.set(8.5,6,12.5);camera.lookAt(0,2,0);
scene.add(new THREE.AmbientLight(0x8db2c4,0.9));
const sun=new THREE.DirectionalLight(0xfff5e6,4.5);
sun.position.set(10,15,5);sun.castShadow=true;
sun.shadow.mapSize.width=1024;sun.shadow.mapSize.height=1024;
sun.shadow.camera.near=0.5;sun.shadow.camera.far=60;
sun.shadow.camera.left=-12;sun.shadow.camera.right=12;
sun.shadow.camera.top=12;sun.shadow.camera.bottom=-6;
sun.shadow.bias=-0.0002;sun.shadow.normalBias=0.02;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xb3d0e0,1.0);fill.position.set(-5,2,-3);scene.add(fill);
treeGroup=new THREE.Group();rootsGroup=new THREE.Group();
scene.add(treeGroup);scene.add(rootsGroup);
ensureAssets();ready=true;
}catch(e){ready=false;console.warn('3D init failed',e);}
}
function clearGroup(g){while(g.children.length>0){const c=g.children[0];g.remove(c);if(c.geometry)c.geometry.dispose();}}
function createRootWithDolphins(start,directionAngle,straightLength,numDolphins,randFn,cfg){
const points=[];const segments=24;
const dirX=Math.cos(directionAngle),dirZ=Math.sin(directionAngle);
const baseAmp=percentToAmplitude(cfg.baseWavinessPercent);
const tipAmp=cfg.tipWaviness;const baseTh=cfg.baseThickness;
const dolphinPositions=[];
if(numDolphins>0){for(let i=0;i<numDolphins;i++){const tt=(i+0.5)/numDolphins+(randFn()-0.5)*0.2/numDolphins;dolphinPositions.push(Math.max(0.1,Math.min(0.9,tt)));}dolphinPositions.sort((a,b)=>a-b);}
for(let i=0;i<=segments;i++){
const tt=i/segments;const dist=tt*straightLength;
const x=start.x+dirX*dist;const z=start.z+dirZ*dist;
let y=start.y-tt*0.6-Math.pow(tt,2)*0.4;
const transition=tt<0.3?0:(tt-0.3)/0.4;
const amplitude=baseAmp+(tipAmp-baseAmp)*Math.min(1,transition);
const vertWave=Math.sin(tt*Math.PI*2.5+randFn()*6)*amplitude;
const lateralWave=Math.cos(tt*Math.PI*3.2+randFn()*5)*0.25;
y+=vertWave;
for(const dp of dolphinPositions){const dtd=Math.abs(tt-dp);const width=0.12/numDolphins+0.08;if(dtd<width){const factor=Math.cos((dtd/width)*Math.PI*0.5);const height=0.2+amplitude*2.5;y+=height*factor;}}
const perpX=-dirZ,perpZ=dirX;
points.push(new THREE.Vector3(x+perpX*lateralWave,y,z+perpZ*lateralWave));
}
const curve=new THREE.CatmullRomCurve3(points);
const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,segments*2,baseTh*0.5,6,false),barkDarkMat);
tube.castShadow=tube.receiveShadow=true;
return tube;
}
function createBranchMesh(start,length,radius,angleY,angleZ){
const dir=new THREE.Vector3(Math.cos(angleY)*Math.sin(angleZ),Math.cos(angleZ),Math.sin(angleY)*Math.sin(angleZ)).normalize();
const end=start.clone().add(dir.clone().multiplyScalar(length));
const mid=start.clone().add(end).multiplyScalar(0.5);
const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*0.8,radius,length,6),barkMat);
mesh.position.copy(mid);
mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
mesh.castShadow=mesh.receiveShadow=true;
return{mesh,end,dir};
}
function addBranches(start,length,radius,angleY,angleZ,depth,maxDepth,randFn,leafAcc,cfg){
const{mesh,end}=createBranchMesh(start,length,radius,angleY,angleZ);
treeGroup.add(mesh);
if(depth===maxDepth){
const leafCount=Math.floor((20+length*18)*cfg.leafDensity);
const clusterRadius=(0.5+length*0.4)*cfg.leafDensity;
const subClusters=4;const perSub=Math.floor(leafCount/subClusters);
for(let s=0;s<subClusters;s++){
const a=(s/subClusters)*Math.PI*2;const dist=clusterRadius*0.5;
const scx=end.x+Math.cos(a)*dist;const scy=end.y+(Math.random()-0.5)*clusterRadius*0.8;const scz=end.z+Math.sin(a)*dist;
for(let i=0;i<perSub;i++){
const pos=new THREE.Vector3(scx+(Math.random()-0.5)*clusterRadius,scy+(Math.random()-0.5)*clusterRadius*0.8,scz+(Math.random()-0.5)*clusterRadius);
const rot=new THREE.Euler(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
leafAcc.push({pos,rot});
}}}else{
const numChildren=depth===0?3:2;
for(let i=0;i<numChildren;i++){
const childLen=length*(0.5+randFn()*0.3);
const childRadius=radius*0.7;
const childAngleY=angleY+(randFn()-0.5)*1.2;
const childAngleZ=angleZ+(randFn()-0.5)*0.8;
addBranches(end,childLen,childRadius,childAngleY,childAngleZ,depth+1,maxDepth,randFn,leafAcc,cfg);
}}}
function buildLeafInstancedMesh(leafData){
if(leafInstancedMesh){treeGroup.remove(leafInstancedMesh);leafInstancedMesh=null;}
if(!leafData.length)return;
leafInstancedMesh=new THREE.InstancedMesh(leafGeom,leafMaterial,leafData.length);
leafInstancedMesh.castShadow=true;
const dummy=new THREE.Object3D();
leafData.forEach((d,i)=>{dummy.position.copy(d.pos);dummy.rotation.copy(d.rot);dummy.updateMatrix();leafInstancedMesh.setMatrixAt(i,dummy.matrix);});
leafInstancedMesh.instanceMatrix.needsUpdate=true;
treeGroup.add(leafInstancedMesh);
}
function build(t){
ensureAssets();
if(leafInstancedMesh){treeGroup.remove(leafInstancedMesh);leafInstancedMesh=null;}
clearGroup(treeGroup);clearGroup(rootsGroup);
const cfg={
attackRadius:3.2+(5.5-3.2)*t,
rootCount:Math.round(12+(30-12)*t),
baseThickness:0.14+(0.2-0.14)*t,
baseWavinessPercent:0,
tipWaviness:0.12+(0.15-0.12)*t,
dolphinFrequency:0.5+(0.7-0.5)*t,
leafDensity:0.5+(1.8-0.5)*t
};
const randFn=pseudoRandom(42);
const R=cfg.attackRadius;
const treeScale=0.5;
const trunkHeight=(3.5+R*0.7)*treeScale;
const trunkBaseRadius=(0.35+R*0.04)*treeScale;
const trunkTopRadius=0.08*treeScale;
const mainBranchCount=Math.floor(6+R*2.5);
const branchLength=(R*0.45)*treeScale;
const branchRadius=(0.1+R*0.01)*treeScale;
const trunkPts=[];
for(let i=0;i<=15;i++){const tt=i/15;trunkPts.push(new THREE.Vector2(trunkBaseRadius+(trunkTopRadius-trunkBaseRadius)*Math.pow(tt,0.6),tt*trunkHeight));}
const trunk=new THREE.Mesh(new THREE.LatheGeometry(trunkPts,16),barkMat);
trunk.castShadow=trunk.receiveShadow=true;
treeGroup.add(trunk);
const leafAccum=[];
for(let i=0;i<mainBranchCount;i++){
const startY=trunkHeight*(0.4+(i/mainBranchCount)*0.5);
const angleY=(i/mainBranchCount)*Math.PI*2+(randFn()-0.5)*0.5;
const angleZ=0.6+randFn()*0.5;
const len=branchLength*(0.7+randFn()*0.5);
const rad=branchRadius*(0.7+randFn()*0.5);
addBranches(new THREE.Vector3(0,startY,0),len,rad,angleY,angleZ,0,2,randFn,leafAccum,cfg);
}
const rootStartY=0.15;const startRadius=0.25;
for(let i=0;i<cfg.rootCount;i++){
const baseAngle=(i/cfg.rootCount)*Math.PI*2;
const angle=baseAngle+(randFn()-0.5)*0.5;
const straightLength=R*(0.75+randFn()*0.35);
const numDolphins=Math.max(0,Math.round(straightLength*cfg.dolphinFrequency));
const start=new THREE.Vector3(Math.cos(angle)*startRadius,rootStartY,Math.sin(angle)*startRadius);
rootsGroup.add(createRootWithDolphins(start,angle,straightLength,numDolphins,randFn,cfg));
if(randFn()<0.4){
const branchAngle=angle+(randFn()-0.5)*1.0;
const bl=straightLength*0.5;
const branchStart=new THREE.Vector3(start.x+Math.cos(angle)*straightLength*0.35,rootStartY-0.2,start.z+Math.sin(angle)*straightLength*0.35);
const bd=Math.max(0,Math.round(bl*cfg.dolphinFrequency*0.7));
rootsGroup.add(createRootWithDolphins(branchStart,branchAngle,bl,bd,randFn,cfg));
}}
buildLeafInstancedMesh(leafAccum);
builtT=t;
}
function setColors(trunkHex,leafHex,rootHex){
if(!ready)return;ensureAssets();
barkMat.color.set(trunkHex);
leafMaterial.color.set(leafHex);
barkDarkMat.color.set(rootHex||trunkHex);
}
function render(t,time,shake){
if(!ready)return null;
const tq=Math.round(t*50)/50;
if(tq!==builtT)build(tq);
treeGroup.rotation.z=Math.sin(time*1.3)*0.015+(shake||0)*0.02*Math.sin(time*60);
treeGroup.rotation.x=Math.cos(time*0.9)*0.008;
renderer.render(scene,camera);
return canvas;
}
return{init,render,setColors,isReady:()=>ready,BASE_Y};
})();

function applyTreeSkin(){
const ts=TREE_SKINS[S.treeSkin]||TREE_SKINS.oak;
Tree3D.setColors(ts.trunk[0],ts.canopy[2],ts.trunk[1]);
}

function drawTree2DFallback(g,ts,bx,by,t){
const h=40+50*t,R=30+40*t;
ctx.fillStyle='rgba(0,0,0,.42)';ell(bx,by+4,R*1.05,R*.44);
const tw=6+6*t;
const tg2=ctx.createLinearGradient(bx-tw,by,bx+tw,by);
tg2.addColorStop(0,ts.trunk[1]);tg2.addColorStop(.5,ts.trunk[0]);tg2.addColorStop(1,ts.trunk[1]);
ctx.fillStyle=tg2;ctx.beginPath();
ctx.moveTo(bx-tw,by);ctx.quadraticCurveTo(bx-tw*.6,by-h*.5,bx-tw*.3,by-h);
ctx.lineTo(bx+tw*.3,by-h);ctx.quadraticCurveTo(bx+tw*.6,by-h*.5,bx+tw,by);ctx.closePath();ctx.fill();
ctx.fillStyle=radg(bx,by-h,R*.2,R,[[0,ts.canopy[3]],[.6,ts.canopy[1]],[1,'rgba(10,20,12,.4)']]);
ctx.beginPath();ctx.arc(bx,by-h,R,0,TAU);ctx.fill();
}

function drawTree(){
const g=treeGeom(),L=g.L;
const t=1-Math.exp(-L/250);
const ts=TREE_SKINS[S.treeSkin]||TREE_SKINS.oak;
const bx=cx,by=cy;
drawAttackRing();
drawRootKnobs();
ctx.fillStyle=radg(bx,by-60,10,150,[[0,'rgba('+ts.glow+','+(0.10+pulse*0.45).toFixed(2)+')'],[1,'rgba('+ts.glow+',0)']]);
ctx.beginPath();ctx.arc(bx,by-60,150,0,TAU);ctx.fill();
ctx.fillStyle='rgba(0,0,0,.35)';ell(bx,by+4,70,26);
const shake=(treeShakeT>0?treeShakeT:0)+(flinch>0?flinch*0.6:0);
const c=Tree3D.render(t,T,shake);
if(c){
const draw=Math.min(300+70*t, Math.min(W,H)*0.62);
ctx.drawImage(c,bx-draw/2,by-Tree3D.BASE_Y*draw,draw,draw);
}else{
drawTree2DFallback(g,ts,bx,by,t);
}
if(branchFx>0&&abilPct('branch')>0){const r=60+8*ab('branch'),a0=branchAng,a1=branchAng+2.4*branchDir;
ctx.strokeStyle='rgba(160,120,70,'+(branchFx*.8).toFixed(2)+')';ctx.lineWidth=5;ctx.lineCap='round';
ctx.beginPath();ctx.ellipse(bx,by,r,r*ISO,0,Math.min(a0,a1),Math.max(a0,a1));ctx.stroke();}
drawTreeHp(bx,by);
}

function drawTreeHp(bx,by){
const pct=clamp(S.treeHp/treeMaxHp(),0,1);
ctx.fillStyle='rgba(8,12,9,.7)';rr(bx-38,by+16,76,6,3);ctx.fill();
if(pct>0){ctx.fillStyle=pct>.5?'#8fd68a':pct>.25?'#e8b64c':'#e0564f';rr(bx-37,by+17,Math.max(3,74*pct),4,2);ctx.fill();}
ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;rr(bx-38,by+16,76,6,3);ctx.stroke();
}

function hpBar(x,y,w,pct,boss){const h=boss?5:3.5,r=h/2;
ctx.fillStyle='rgba(8,12,9,.7)';rr(x-w/2,y,w,h,r);ctx.fill();
if(pct>0){ctx.fillStyle=pct>.5?'#8fd68a':pct>.25?'#e8b64c':'#e0564f';rr(x-w/2+1,y+1,Math.max(2,(w-2)*pct),h-2,(h-2)/2);ctx.fill();}}

function drawEnemy(e){
const gx=cx+e.x,gy=cy+e.y*ISO;const sy=gy-e.lift;const r=e.r;
ctx.globalAlpha=.25+.75*e.born;
ctx.fillStyle='rgba(0,0,0,'+(.35*(1-e.lift/30)).toFixed(2)+')';ell(gx,gy+2,r*.95,r*.4);
const walk=Math.sin(T*8+e.phase);const bob=Math.cos(T*8+e.phase)*1.2;
const fa=Math.atan2(-e.y*ISO,-e.x);
const face=(e.type==='golem'||e.type==='boss')?fa+Math.PI/2:fa;
ctx.save();ctx.translate(gx,sy-r*.35+bob);
ctx.rotate(face+clamp(Math.sin(T*8+e.phase)*.04,-.05,.05));
try{
if(e.type==='beetle'){
ctx.strokeStyle='#241008';ctx.lineWidth=1.6;ctx.lineCap='round';
for(let i=0;i<3;i++){const ly=(i-1)*r*.4;const wk=Math.sin(T*12+e.phase+i)*2.5;
ctx.beginPath();ctx.moveTo(-r*.3,ly);ctx.lineTo(-r*.7,ly-r*.4+wk);ctx.stroke();
ctx.beginPath();ctx.moveTo(-r*.3,ly);ctx.lineTo(-r*.7,ly+r*.4-wk);ctx.stroke();}
ctx.fillStyle=radg(-r*.2,-r*.2,r*.1,r,[[0,'#7a4636'],[.6,'#4a2823'],[1,'#2a140e']]);
ctx.beginPath();ctx.ellipse(0,0,r*.95,r*.7,0,0,TAU);ctx.fill();
ctx.fillStyle='rgba(255,180,140,.25)';ctx.beginPath();ctx.ellipse(-r*.2,-r*.25,r*.4,r*.22,-.4,0,TAU);ctx.fill();
ctx.strokeStyle='rgba(20,8,4,.7)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*.8,0);ctx.lineTo(r*.5,0);ctx.stroke();
ctx.fillStyle='#2a140e';ctx.beginPath();ctx.arc(r*.7,0,r*.42,0,TAU);ctx.fill();
ctx.fillStyle='#ff6a52';ctx.shadowColor='#ff6a52';ctx.shadowBlur=6;
ctx.beginPath();ctx.arc(r*.95,-r*.18,1.6,0,TAU);ctx.arc(r*.95,r*.18,1.6,0,TAU);ctx.fill();ctx.shadowBlur=0;
}else if(e.type==='wolf'){
ctx.strokeStyle='#1a2030';ctx.lineWidth=2.4;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(-r*.4,r*.3);ctx.lineTo(-r*.5+walk*2,r*.7);ctx.stroke();
ctx.beginPath();ctx.moveTo(r*.3,r*.3);ctx.lineTo(r*.4-walk*2,r*.7);ctx.stroke();
ctx.fillStyle='#1d2330';ctx.beginPath();ctx.moveTo(-r*.9,0);ctx.quadraticCurveTo(-r*1.5,-r*.3+walk*2,-r*1.3,r*.2);ctx.quadraticCurveTo(-r*1.1,r*.1,-r*.9,r*.15);ctx.fill();
ctx.fillStyle=radg(-r*.1,-r*.2,r*.1,r*1.1,[[0,'#3a4458'],[.6,'#262d3c'],[1,'#14181f']]);
ctx.beginPath();ctx.ellipse(0,0,r*1.0,r*.6,0,0,TAU);ctx.fill();
ctx.fillStyle='rgba(150,180,220,.18)';ctx.beginPath();ctx.ellipse(-r*.2,-r*.2,r*.4,r*.2,-.3,0,TAU);ctx.fill();
ctx.fillStyle='#262d3c';ctx.beginPath();ctx.moveTo(r*.6,-r*.35);ctx.lineTo(r*1.4,0);ctx.lineTo(r*.6,r*.35);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.moveTo(r*.7,-r*.35);ctx.lineTo(r*.85,-r*.7);ctx.lineTo(r*1.0,-r*.35);ctx.closePath();ctx.fill();
ctx.fillStyle='#9fd0ff';ctx.shadowColor='#9fd0ff';ctx.shadowBlur=7;ctx.beginPath();ctx.arc(r*.95,-r*.1,1.7,0,TAU);ctx.fill();ctx.shadowBlur=0;
}else if(e.type==='golem'){
ctx.fillStyle='#3a362e';rr(-r*.6,r*.3,r*.4,r*.5,3);ctx.fill();rr(r*.2,r*.3,r*.4,r*.5,3);ctx.fill();
ctx.fillStyle='#3a362e';rr(-r*.8,-r*.8,r*1.6,r*1.6,5);ctx.fill();
ctx.fillStyle='#5a5448';rr(-r*.8,-r*.8,r*1.6,r*.5,5);ctx.fill();
ctx.fillStyle='rgba(0,0,0,.25)';rr(-r*.8,r*.1,r*1.6,r*.7,5);ctx.fill();
ctx.fillStyle='rgba(90,140,90,.6)';ctx.beginPath();ctx.arc(-r*.4,-r*.7,r*.3,0,TAU);ctx.arc(r*.3,-r*.6,r*.25,0,TAU);ctx.fill();
ctx.strokeStyle='#2a2620';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*.7,0);ctx.lineTo(r*.7,0);ctx.stroke();
ctx.fillStyle='#ffc46a';ctx.shadowColor='#ffc46a';ctx.shadowBlur=6;
ctx.beginPath();ctx.arc(-r*.25,-r*.3,2,0,TAU);ctx.arc(r*.25,-r*.3,2,0,TAU);ctx.fill();ctx.shadowBlur=0;
}else if(e.type==='spirit'){
const fl=Math.sin(T*5+e.phase)*.18;
ctx.save();ctx.globalCompositeOperation='lighter';
ctx.fillStyle=radg(0,0,1,r*1.6,[[0,'rgba(150,230,200,.55)'],[1,'rgba(150,230,200,0)']]);
ctx.beginPath();ctx.arc(0,0,r*1.6,0,TAU);ctx.fill();ctx.restore();
ctx.fillStyle=radg(0,-r*.3,r*.1,r,[[0,'rgba(220,255,235,'+(.8+fl).toFixed(2)+')'],[1,'rgba(120,200,170,'+(.4+fl).toFixed(2)+')']]);
ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.8,-r*.2,r*.5,r*.6);
ctx.quadraticCurveTo(0,r*.3+Math.sin(T*6+e.phase)*2,-r*.5,r*.6);ctx.quadraticCurveTo(-r*.8,-r*.2,0,-r);ctx.fill();
ctx.fillStyle='#0a3024';ctx.beginPath();ctx.arc(-r*.22,-r*.1,1.3,0,TAU);ctx.arc(r*.22,-r*.1,1.3,0,TAU);ctx.fill();
if(Math.random()<.3)parts.push({x:e.x+rand(-5,5),y:e.y*ISO-e.r*.5,vx:rand(-4,4),vy:rand(-14,-4),l:.4,ml:.4,sz:1.2,c:'170,240,210'});
}else{
const pr=r;const auraP=.5+.5*Math.sin(T*2.4+e.phase);
ctx.save();ctx.globalCompositeOperation='lighter';
ctx.fillStyle=radg(0,0,pr*.3,pr*2.4,[[0,'rgba(224,86,79,'+(0.20+0.10*auraP).toFixed(2)+')'],[.6,'rgba(176,60,40,'+(0.09+0.05*auraP).toFixed(2)+')'],[1,'rgba(176,60,40,0)']]);
ctx.beginPath();ctx.arc(0,0,pr*2.4,0,TAU);ctx.fill();ctx.restore();
ctx.fillStyle='#2a1810';ctx.beginPath();ctx.ellipse(-pr*.55,pr*.5+walk*1.5,pr*.3,pr*.35,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(pr*.55,pr*.5-walk*1.5,pr*.3,pr*.35,0,0,TAU);ctx.fill();
ctx.fillStyle='#3a2418';ctx.beginPath();ctx.ellipse(-pr*.4,pr*.6-walk*1.5,pr*.26,pr*.32,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.ellipse(pr*.4,pr*.6+walk*1.5,pr*.26,pr*.32,0,0,TAU);ctx.fill();
ctx.fillStyle=radg(-pr*.2,-pr*.2,pr*.2,pr,[[0,'#6b4329'],[.6,'#4a2e1c'],[1,'#2a1810']]);
ctx.beginPath();ctx.ellipse(0,pr*.05,pr*.95,pr*.85,0,0,TAU);ctx.fill();
ctx.fillStyle='rgba(150,100,70,.22)';ctx.beginPath();ctx.ellipse(-pr*.25,-pr*.2,pr*.4,pr*.3,-.3,0,TAU);ctx.fill();
ctx.fillStyle=radg(pr*.1,-pr*.7,pr*.1,pr*.6,[[0,'#6b4329'],[1,'#3a2418']]);
ctx.beginPath();ctx.arc(0,-pr*.7,pr*.55,0,TAU);ctx.fill();
ctx.fillStyle='#2a1810';ctx.beginPath();ctx.arc(-pr*.4,-pr*1.05,pr*.22,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(pr*.4,-pr*1.05,pr*.22,0,TAU);ctx.fill();
ctx.fillStyle='#6b4329';ctx.beginPath();ctx.arc(-pr*.4,-pr*1.05,pr*.1,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(pr*.4,-pr*1.05,pr*.1,0,TAU);ctx.fill();
ctx.fillStyle='#7a5236';ctx.beginPath();ctx.ellipse(0,-pr*.55,pr*.3,pr*.24,0,0,TAU);ctx.fill();
ctx.fillStyle='#1a0e08';ctx.beginPath();ctx.ellipse(0,-pr*.62,pr*.12,pr*.09,0,0,TAU);ctx.fill();
ctx.fillStyle='#ff5a3c';ctx.shadowColor='#ff5a3c';ctx.shadowBlur=7+3*auraP;
ctx.beginPath();ctx.arc(-pr*.2,-pr*.78,pr*.09,0,TAU);ctx.arc(pr*.2,-pr*.78,pr*.09,0,TAU);ctx.fill();ctx.shadowBlur=0;
}
}catch(err){}
ctx.restore();
ctx.globalAlpha=1;
if(e.held>0){ctx.strokeStyle='rgba(120,90,50,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(gx,sy-r*.35,r*1.1,0,TAU);ctx.stroke();}
if(e.bleed>0&&e.bleedT>0){ctx.strokeStyle='rgba(168,220,120,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(gx,sy-r*.35,r*1.05,0,TAU);ctx.stroke();}
if(e.flash>0){ctx.fillStyle='rgba(255,255,255,'+(e.flash*.5).toFixed(2)+')';ctx.beginPath();ctx.arc(gx,sy-r*.35,r*1.05,0,TAU);ctx.fill();}
if(e.born>.6)hpBar(gx,sy-r-12,r*2.2,e.hp/e.maxHp,e.type==='boss');
}

function drawSquirrel(){
if(!squirrel)return;
const p=squirrel.t/squirrel.dur;
const x=lerp(squirrel.fx,squirrel.tx,p);const y=lerp(squirrel.fy,squirrel.ty,p)-Math.abs(Math.sin(p*Math.PI*4))*14;
const dir=squirrel.tx>squirrel.fx?1:-1;
ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,8,7,2.5,0,0,TAU);ctx.fill();
ctx.fillStyle='#b06a3a';ctx.beginPath();ctx.ellipse(0,0,6,4.5,0,0,TAU);ctx.fill();
ctx.beginPath();ctx.arc(5,-3,3.4,0,TAU);ctx.fill();
ctx.strokeStyle='#c8824a';ctx.lineWidth=3;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(-4,-1);ctx.quadraticCurveTo(-10,-6+Math.sin(T*10+squirrel.seed)*2,-7,-10);ctx.stroke();
ctx.fillStyle='#3a2010';ctx.beginPath();ctx.arc(6.5,-3.5,1,0,TAU);ctx.fill();
ctx.fillStyle='#e0a060';ctx.beginPath();ctx.arc(4,-5.5,1.4,0,TAU);ctx.fill();
ctx.restore();
const pu=.5+.5*Math.sin(T*6);
ctx.fillStyle='rgba(124,201,232,'+(.4+.3*pu).toFixed(2)+')';ctx.beginPath();ctx.arc(x,y-12,2,0,TAU);ctx.fill();}

function drawShots(){
ctx.save();if(!LOW_GFX())ctx.globalCompositeOperation='lighter';
for(const s of shots){
if(s.kind==='thorn'){const x=cx+s.x,y=cy+s.y;const a=Math.atan2(s.vy,s.vx);
ctx.save();ctx.translate(x,y);ctx.rotate(a);
ctx.fillStyle='#c8eb96';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-3.2);ctx.lineTo(-4,0);ctx.lineTo(-6,3.2);ctx.closePath();ctx.fill();ctx.restore();continue;}
if(s.kind==='branchfall'){const x=cx+s.x,y=cy+s.y;const pr=clamp(s.t/s.dur,0,1);
ctx.save();ctx.translate(x,y);ctx.rotate(0.6+pr*2);
ctx.fillStyle='#7a5232';rr(-3.5,-14,7,28,3.5);ctx.fill();ctx.restore();continue;}
if(s.kind==='fruit'){const x=cx+(s.cx!=null?s.cx:s.x),y=cy+(s.cy!=null?s.cy:s.y);
ctx.fillStyle='#e07a48';ctx.beginPath();ctx.arc(x,y,6.5,0,TAU);ctx.fill();
ctx.fillStyle='#5fae74';ctx.beginPath();ctx.ellipse(x+1,y-6.5,3,1.8,-.5,0,TAU);ctx.fill();continue;}
if(s.kind==='acidstream'){const x=cx+s.x,y=cy+s.y;
ctx.fillStyle='rgba(190,240,110,.85)';ctx.beginPath();ctx.arc(x,y,5,0,TAU);ctx.fill();continue;}
if(s.kind==='ring'){const x=cx+s.x,y=cy+s.y*ISO;ctx.save();ctx.translate(x,y);ctx.rotate(s.rot);
ctx.fillStyle='#a8dc92';ctx.beginPath();ctx.ellipse(0,0,5,2.4,0,0,TAU);ctx.fill();ctx.restore();continue;}
const x=cx+s.x,y=cy+s.y;
ctx.fillStyle='#ffcf7a';ctx.beginPath();ctx.arc(x,y,3.5,0,TAU);ctx.fill();}
ctx.restore();}

function drawParts(){
for(const p of parts){const a=clamp(p.l/p.ml,0,1),x=cx+p.x,y=cy+p.y;
if(p.ring){ctx.strokeStyle='rgba('+p.c+','+(a*.7).toFixed(2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,p.r0+(p.r1-p.r0)*(1-a),0,TAU);ctx.stroke();}
else if(p.leaf){
if(p.lk==='snow'){ctx.fillStyle='rgba('+p.c+','+a.toFixed(2)+')';ctx.beginPath();ctx.arc(x,y,1.7,0,TAU);ctx.fill();}
else if(p.lk==='spark'){ctx.fillStyle='rgba('+p.c+','+a.toFixed(2)+')';ctx.shadowColor='rgb('+p.c+')';ctx.shadowBlur=6;ctx.beginPath();ctx.arc(x,y,1.6,0,TAU);ctx.fill();ctx.shadowBlur=0;}
else{ctx.save();ctx.translate(x,y);ctx.rotate(p.l*4+p.ph);ctx.fillStyle='rgba('+p.c+','+a.toFixed(2)+')';
ctx.beginPath();ctx.ellipse(0,0,p.lk==='petal'?2.8:3.4,p.lk==='petal'?1.9:1.6,0,0,TAU);ctx.fill();ctx.restore();}}
else{ctx.fillStyle='rgba('+p.c+','+a.toFixed(2)+')';ctx.beginPath();ctx.arc(x,y,p.sz*a+.4,0,TAU);ctx.fill();}}}

function drawFloats(){
ctx.textAlign='center';
for(const f of floats){const a=clamp(f.l/f.ml,0,1);const x=cx+f.x,y=cy+f.y-(1-a)*26;
ctx.globalAlpha=a;ctx.font='800 '+f.sz+'px Manrope, sans-serif';
ctx.strokeStyle='rgba(6,10,7,.8)';ctx.lineWidth=3;ctx.strokeText(f.txt,x,y);ctx.fillStyle=f.c;ctx.fillText(f.txt,x,y);}
ctx.globalAlpha=1;}

function render(dt){
ctx.setTransform(DPR,0,0,DPR,0,0);
if(ground)ctx.drawImage(ground,0,0,W,H);else{ctx.fillStyle='#0a120d';ctx.fillRect(0,0,W,H);}
drawGrass();drawFlies(dt);
ctx.save();
if(shakeM>0){shakeM=Math.max(0,shakeM-dt*20);if(S.shake)ctx.translate(rand(-1,1)*shakeM,rand(-1,1)*shakeM);}
drawZones();drawRoots();
const objs=[];
for(const s of scenery){if(s.type!=='grass')objs.push({y:s.y,fn:()=>drawSceneryObj(s)});}
for(const e of enemies)objs.push({y:e.y,fn:()=>drawEnemy(e)});
objs.push({y:cy,fn:drawTree});
objs.sort((a,b)=>a.y-b.y);
for(const o of objs){try{o.fn();}catch(err){}}
drawSquirrel();drawShots();drawParts();drawFloats();
ctx.restore();}

let last=performance.now();
function loop(now){requestAnimationFrame(loop);
let dt=(now-last)/1000;last=now;if(dt>.05)dt=.05;T+=dt;
FRR=rootReach();
const steps=gameSpeed;const subDt=dt/steps;
try{ if(!S.over){for(let i=0;i<steps;i++)simulate(subDt);} }catch(err){ if(!loop.errS){loop.errS=true;console.error('sim:',err);} }
try{ updateFx(dt);render(dt); }catch(err){ if(!loop.errR){loop.errR=true;console.error('render:',err);} }
dispSeeds+=(S.seeds-dispSeeds)*Math.min(1,dt*10);
if(Math.abs(S.seeds-dispSeeds)<.5)dispSeeds=S.seeds;
const s=fmt(dispSeeds);if(s!==lastStr){lastStr=s;el.seeds.textContent=s;}}

cv.addEventListener('pointerdown',ev=>{
if(anySheetOpen()){closeAllSheets();return;}
if(['boost','cards','powers'].includes(S.tutPhase))return;
const sx=ev.clientX,sy=ev.clientY;
if(squirrel&&!squirrel.clicked&&!anyOverlayOpen()){
const p=squirrel.t/squirrel.dur;
const bx=lerp(squirrel.fx,squirrel.tx,p),by=lerp(squirrel.fy,squirrel.ty,p)-Math.abs(Math.sin(p*Math.PI*4))*14;
if(Math.hypot(sx-bx,sy-by)<26){squirrel.clicked=true;const n=Math.floor(rand(3,9));if(S.tutorialDone){S.dew+=n;bump('#dewPill');}
floats.push({x:(bx-cx),y:(by-cy)-14,txt:'+'+fmt(n)+' росы',l:1.2,ml:1.2,c:'#a5e8f0',sz:13});
sfx.squirrel();save();updateHUD();return;}}
const x=sx-cx,y=sy-cy;
parts.push({ring:true,x,y,l:.35,ml:.35,r0:4,r1:34,c:'159,222,187'});
let best=null,bd=1e9;
for(const e of enemies){const d=Math.hypot(e.x-x,e.y*ISO-y)-e.r;if(d<bd){bd=d;best=e;}}
if(best&&bd<48)hit(best,Math.max(1,coreDmg()*.55),false);});

function buy(k,btn){if(S.over)return;
if(S.tutPhase==='boost'&&k!=='dmg'&&S.dmgLvl<10){toast(t('dmgFirst'));return;}
const cur=S[k+'Lvl']||0;
let n=buyMul==='max'?maxAfford(k).n:buyMul;
if(cur+n>CONFIG.UPG.LVL_CAP)n=CONFIG.UPG.LVL_CAP-cur;
if(n<=0)return;
const c=costRange(k,cur,n);if(S.seeds<c)return;
S.seeds-=c;const before=treeMaxHp();
S[k+'Lvl']=cur+n;
if(k==='hp'){S.treeHp=Math.min(treeMaxHp(),S.treeHp+(treeMaxHp()-before));}
if(S.dailyProg)S.dailyProg.upg=(S.dailyProg.upg||0)+n;
pulse=1;leafBurst();sfx.upgrade();checkAmber();
btn.classList.remove('bought');void btn.offsetWidth;btn.classList.add('bought');
if(k==='dmg'&&S.tutPhase==='boost'&&S.dmgLvl>=10){enterPlay();}
save();updateHUD();}
el.ud.addEventListener('click',()=>buy('dmg',el.ud));
el.us.addEventListener('click',()=>buy('spd',el.us));
el.ur.addEventListener('click',()=>buy('rad',el.ur));
el.uc.addEventListener('click',()=>buy('cc',el.uc));
el.ux.addEventListener('click',()=>buy('cd',el.ux));
el.uh.addEventListener('click',()=>buy('hp',el.uh));
el.urg.addEventListener('click',()=>buy('regen',el.urg));

$('#mulRow').addEventListener('click',e=>{const b=e.target.closest('[data-mul]');if(!b)return;
const v=b.dataset.mul;buyMul=v==='max'?'max':parseInt(v,10);
$('#mulRow').querySelectorAll('.mul-btn').forEach(x=>x.classList.toggle('on',x===b));
if(S.tutPhase==='boost'&&tutStep==='mul'){tutStep='dmg';}
updateTutHighlights();updateHUD();});

$('#cardMulRow').addEventListener('click',e=>{const b=e.target.closest('[data-cmul]');if(!b)return;
cardMul=parseInt(b.dataset.cmul,10);
$('#cardMulRow').querySelectorAll('.mul-btn').forEach(x=>x.classList.toggle('on',x===b));
if(cardPhase==='idle'||cardPhase==='show'||cardPhase==='memorize')genCards();else updateSpinBtn();});

function bindTab(btn,sel,fn){$(btn).addEventListener('click',()=>{
if(!allowedSheets().includes(sel))return;
const was=$(sel).classList.contains('open');closeAllSheets();
if(!was){open(sel);
if(sel==='#upgOverlay'&&S.tutPhase==='boost'){tutStep='mul';setTimeout(updateTutHighlights,350);}
if(sel==='#abilitiesOverlay'&&S.tutPhase==='powers'){setTimeout(updateTutHighlights,350);}
fn&&fn();}});}

bindTab('#navUpg','#upgOverlay',()=>updateHUD());
bindTab('#navRoulette','#rouletteOverlay',()=>{if(cardPhase==='idle')genCards();else{renderCards();updateSpinBtn();}});
bindTab('#navTree','#skillTreeOverlay',()=>{renderSkillTree();initTreeDrag();});
bindTab('#navAbilities','#abilitiesOverlay',renderAbilities);
bindTab('#navArtifacts','#artifactsOverlay',renderArtifacts);
bindTab('#navQuests','#questsOverlay',renderQuests);
bindTab('#shopBtn','#shopOverlay',renderShop);

document.querySelectorAll('.panel-close').forEach(b=>b.addEventListener('click',()=>{
const sh=b.closest('.sheet');if(sh)closeSheet('#'+sh.id);}));

$('#spinBtn').addEventListener('click',startSpin);
$('#claimBtn').addEventListener('click',claimCards);

let treeDrag=null;
function initTreeDrag(){
const container=$('#skillTreeContainer');const tree=$('#skillTree');
if(!treeDrag){treeDrag={x:0,y:0,dragging:false,startX:0,startY:0,scrollX:0,scrollY:0};
container.addEventListener('pointerdown',startDrag);
window.addEventListener('pointermove',onDrag);window.addEventListener('pointerup',endDrag);}
treeDrag.x=0;treeDrag.y=-230;
tree.style.transform=`translate(${treeDrag.x}px,${treeDrag.y}px)`;}
function startDrag(e){if(e.target.closest('.skill-node'))return;treeDrag.dragging=true;
treeDrag.startX=e.clientX;treeDrag.startY=e.clientY;treeDrag.scrollX=treeDrag.x;treeDrag.scrollY=treeDrag.y;}
function onDrag(e){if(!treeDrag||!treeDrag.dragging)return;
treeDrag.x=treeDrag.scrollX+(e.clientX-treeDrag.startX);treeDrag.y=treeDrag.scrollY+(e.clientY-treeDrag.startY);
$('#skillTree').style.transform=`translate(${treeDrag.x}px,${treeDrag.y}px)`;}
function endDrag(){if(treeDrag)treeDrag.dragging=false;}

document.querySelectorAll('.panel-grip').forEach(g=>{
let sy=0,dy=0,drag=false;
g.addEventListener('pointerdown',e=>{drag=true;sy=e.clientY;dy=0;try{g.setPointerCapture(e.pointerId);}catch(_){}});
g.addEventListener('pointermove',e=>{if(!drag)return;dy=e.clientY-sy;
const p=g.closest('.panel');if(p)p.style.transform=dy>0?`translateY(${dy}px)`:'none';});
const end=()=>{if(!drag)return;drag=false;
const p=g.closest('.panel');if(p)p.style.transform='';
const sh=g.closest('.sheet');if(!sh)return;
if(dy>70||Math.abs(dy)<6)closeSheet('#'+sh.id);};
g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);});

$('#setBtn').addEventListener('click',()=>{
if(!allowedSheets().includes('#setOverlay'))return;
const was=$('#setOverlay').classList.contains('open');closeAllSheets();
if(!was){open('#setOverlay');
$('#volRange').value=Math.round((S.vol==null?1:S.vol)*100);$('#volVal').textContent=$('#volRange').value+'%';
const st=$('#shakeTog');st.textContent=S.shake?t('on'):t('off');st.classList.toggle('on',S.shake);
const dt=$('#dmgTog');dt.textContent=showDmg?t('on'):t('off');dt.classList.toggle('on',showDmg);
const tt=$('#toastTog');tt.textContent=toastsOn?t('on'):t('off');tt.classList.toggle('on',toastsOn);
$('#speedSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.sp===gameSpeed));
$('#gfxSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.gfx===gfxQuality));}});

$('#volRange').addEventListener('input',e=>{S.vol=+e.target.value/100;$('#volVal').textContent=e.target.value+'%';save();});
$('#shakeTog').addEventListener('click',()=>{S.shake=!S.shake;const st=$('#shakeTog');st.textContent=S.shake?t('on'):t('off');st.classList.toggle('on',S.shake);save();});
$('#dmgTog').addEventListener('click',()=>{showDmg=!showDmg;const dt=$('#dmgTog');dt.textContent=showDmg?t('on'):t('off');dt.classList.toggle('on',showDmg);});
$('#toastTog').addEventListener('click',()=>{toastsOn=!toastsOn;const tt=$('#toastTog');tt.textContent=toastsOn?t('on'):t('off');tt.classList.toggle('on',toastsOn);});

$('#speedSeg').addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(!b)return;gameSpeed=+b.dataset.sp;S.gameSpeed=gameSpeed;
$('#speedSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));save();});

$('#gfxSeg').addEventListener('click',e=>{const b=e.target.closest('[data-gfx]');if(!b)return;gfxQuality=b.dataset.gfx;S.gfxQuality=gfxQuality;
$('#gfxSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));resize();save();});

$('#langRu').addEventListener('click',()=>{S.lang='ru';save();applyLang();});
$('#langEn').addEventListener('click',()=>{S.lang='en';save();applyLang();});

function applyLang(){document.documentElement.lang=S.lang;
$('#langRu').classList.toggle('on',S.lang==='ru');$('#langEn').classList.toggle('on',S.lang==='en');
document.querySelectorAll('[data-i18n]').forEach(elc=>{const key=elc.dataset.i18n;const val=(I18N[S.lang]||I18N.ru)[key];if(val)elc.textContent=val;});
try{renderShop();renderQuests();renderAbilities();renderArtifacts();updateHUD();}catch(e){}}

$('#afkClaim').addEventListener('click',()=>{
S.seeds+=afkReward;runSeeds+=afkReward;
if(afkDew>0){S.dew+=afkDew;bump('#dewPill');}
afkReward=0;afkDew=0;close('#afkOverlay');sfx.claim();save();updateHUD();});

$('#reviveBtn').addEventListener('click',()=>{
S.over=false;S.treeHp=treeMaxHp();
enemies.length=0;shots.length=0;roots.length=0;zones.length=0;
S.killed=0;spawned=0;bossActive=false;betweenT=3;spawnT=1.2;rootT=0;branchCd=2;leafCd=6;branchFx=0;
close('#overOverlay');banner(t('stage')+' '+stageOf(S.wave), t('revived'), false);
sfx.upgrade();leafBurst();
if(S.tutPhase==='play'){setTimeout(()=>enterCards(), 600);}
save();updateHUD();});

const ALL_SAVE_KEYS=['drevo.save.v1','drevo.save.v2','drevo.save.v3','drevo.save.v4','drevo.save.v5','drevo.save.v6','drevo.save.v7','drevo.save.v8','drevo.save.v9'];
function fullReset(){
ALL_SAVE_KEYS.forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});
S.seeds=500;S.dew=0;S.amber=0;S.wave=1;S.killed=0;S.totalKills=0;
S.dmgLvl=0;S.spdLvl=0;S.hpLvl=0;S.radLvl=0;S.ccLvl=0;S.cdLvl=0;S.regenLvl=0;
S.muted=false;S.shake=true;S.vol=1;S.lang='ru';
S.lastSeen=Date.now();S.bestWave=1;S.seen=true;S.tipShop=false;S.amberTier=0;
S.abilities={};S.equip=[];S.artifacts={};S.artifactEquip=[];S.mutations=[];
S.treeSkins=['oak'];S.treeSkin='oak';S.skill={};S.gameSpeed=1;S.gfxQuality='full';
S.dailyDate=0;S.dailyDone={};S.dailyProg={kills:0,waves:0,spins:0,crits:0,upg:0};
S.waveQ={prog:0,done:false,claimed:false};S.onceDone={};S.chaptersCleared=0;
S.huntKills=0;S.huntDone=0;S.passDone={};S.tutorialDone=false;S.tutPhase='new';S.over=false;
S.treeHp=maxHpOf(S);gameSpeed=1;gfxQuality='full';
enemies.length=0;shots.length=0;roots.length=0;zones.length=0;parts.length=0;floats.length=0;
spawned=0;bossActive=false;betweenT=2.4;spawnT=1.4;
runKills=0;runSeeds=0;dispSeeds=S.seeds;lastStr='';buyMul=1;tutStep='tab';
$('#mulRow').querySelectorAll('.mul-btn').forEach(x=>x.classList.toggle('on',x.dataset.mul==='1'));
refreshTutUI();updateTutHighlights();save();updateHUD();toast('Прогресс сброшен');}

$('#resetBtn').addEventListener('click',()=>{if(confirm(t('resetConfirm'))){fullReset();}});
$('#muteBtn').addEventListener('click',()=>{S.muted=!S.muted;$('#muteBtn').classList.toggle('off',S.muted);save();});
$('#muteBtn').classList.toggle('off',S.muted);

const CHEAT={god:false};
window.DEBUG={
rich(){S.seeds+=1e6;S.dew+=200;S.amber+=100;updateHUD();save();},
seeds(n){S.seeds+=n;updateHUD();save();},
dew(n){S.dew+=n;bump('#dewPill');updateHUD();save();},
amber(n){S.amber+=n;updateHUD();save();},
upg(n){['dmgLvl','spdLvl','hpLvl','radLvl','ccLvl','cdLvl','regenLvl'].forEach(k=>S[k]+=n);S.treeHp=treeMaxHp();checkAmber();updateHUD();save();},
give(k,l){S.abilities[k]=(S.abilities[k]||0)+(l||1);if(k!=='seedshot'&&!S.equip.includes(k)&&S.equip.length<slotCap())S.equip.push(k);updateHUD();save();},
all(){ABIL.forEach(a=>window.DEBUG.give(a.k,3));},
skills(){SKDEF.forEach(n=>S.skill[n.k]=1);S.treeHp=treeMaxHp();updateHUD();save();},
arts(){ARTIFACTS.forEach(a=>S.artifacts[a.k]=(S.artifacts[a.k]||0)+1);renderArtifacts();updateHUD();save();},
skins(){S.treeSkins=Object.keys(TREE_SKINS);updateHUD();save();},
wave(n){S.wave=Math.max(1,S.wave+n);S.bestWave=Math.max(S.bestWave,S.wave);S.killed=0;spawned=0;bossActive=false;betweenT=1.5;updateHUD();save();},
chap(n){const add=n*7;S.wave=Math.max(1,S.wave+add);S.bestWave=Math.max(S.bestWave,S.wave);S.killed=0;spawned=0;bossActive=false;betweenT=1.5;S.chaptersCleared=Math.max(S.chaptersCleared,chapterOf(S.wave));updateHUD();save();},
waveSkip(){const n=parseInt(document.getElementById('dbgSkipW').value)||0;window.DEBUG.wave(n);},
chapSkip(){const n=parseInt(document.getElementById('dbgSkipC').value)||0;window.DEBUG.chap(n);},
tut(){if(S.tutPhase==='done'||S.tutPhase==='cards')S.tutPhase='new';else S.tutPhase='done';refreshTutUI();updateTutHighlights();updateNav();save();},
spawn(tt){spawn(tt||'boss');},
clear(){enemies.length=0;shots.length=0;roots.length=0;zones.length=0;},
god(){CHEAT.god=!CHEAT.god;toast('GOD: '+(CHEAT.god?'ON':'OFF'));const b=document.querySelector('#dbgGod');if(b)b.classList.toggle('on',CHEAT.god);return CHEAT.god;},
wipe(){fullReset();}
};
setInterval(()=>{if(CHEAT.god&&!S.over)S.treeHp=treeMaxHp();},250);

const dbg=document.createElement('div');dbg.id='dbg';
dbg.innerHTML=
'<b>ЧИТЫ <span id="dbgX">✕</span></b>'+
'<button data-c="DEBUG.rich()">+1M / dew / amber</button>'+
'<button data-c="DEBUG.upg(100)">all upgrades +100</button>'+
'<button data-c="DEBUG.skills()">all skill leaves</button>'+
'<button data-c="DEBUG.give(\'seedshot\',3)">+ seeds ability</button>'+
'<button data-c="DEBUG.all()">all abilities +3</button>'+
'<button data-c="DEBUG.arts()">all artifacts</button>'+
'<button data-c="DEBUG.skins()">all looks</button>'+
'<button data-c="DEBUG.tut()">toggle tutorial</button>'+
'<div class="skip-row"><input id="dbgSkipW" type="number" value="10" min="1"><button data-c="DEBUG.waveSkip()">+волн</button></div>'+
'<div class="skip-row"><input id="dbgSkipC" type="number" value="5" min="1"><button data-c="DEBUG.chapSkip()">+глав</button></div>'+
'<button data-c="DEBUG.spawn(\'boss\')">spawn boss</button>'+
'<button data-c="DEBUG.clear()">clear field</button>'+
'<button id="dbgGod" data-c="DEBUG.god()">god mode</button>'+
'<button data-c="DEBUG.wipe()" style="border-color:rgba(224,86,79,.5);color:#e8a49b">⚠ HARD WIPE</button>';
document.body.appendChild(dbg);

dbg.addEventListener('click',e=>{if(e.target.id==='dbgX'){dbg.classList.remove('open');return;}
const b=e.target.closest('[data-c]');if(b){try{eval(b.dataset.c);}catch(err){console.error(err);}}});

$('#cheatFab').addEventListener('click',()=>dbg.classList.toggle('open'));
document.addEventListener('keydown',e=>{
if(e.ctrlKey&&e.shiftKey&&(e.code==='KeyD'||e.key==='D'||e.key==='d')){e.preventDefault();dbg.classList.toggle('open');}});

Tree3D.init();
applyTreeSkin();
resize();ensureDaily();applyLang();refreshTutUI();updateTutHighlights();updateHUD();

if(afkReward>0){
const at=$('#afkTime');if(at)at.textContent=fmtTime(afkSec);
const aa=$('#afkAmount');if(aa)aa.textContent='+'+fmt(afkReward);
open('#afkOverlay');}
else if(!S.seen){S.seeds=500;S.dew=0;S.seen=true;save();updateHUD();}

banner(t('stage')+' '+stageOf(S.wave), t('protect'), false);
requestAnimationFrame(tt=>{last=tt;loop(tt);});
setInterval(save,5000);
setInterval(renderMutBar,1000);
addEventListener('beforeunload',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
})();
