import {WILD_ITEMS,WILD_NODES,WILD_RECIPES,DISHES,weather,shelterAt,initWilderness,stepWilderness,impact} from './wilderness.js';
export {DISHES,weather,shelterAt};
import {LEVEL_NAMES,LEVEL_ROMAN,LEVEL_BENEFITS,EXTRA_ITEMS,EXTRA_NODES,EXTRA_TECHS,EXTRA_RECIPES,TRIALS,CHAPTERS} from './chapters.js';
export {LEVEL_NAMES,LEVEL_ROMAN,LEVEL_BENEFITS,TRIALS,CHAPTERS};
// 《九级》生存规则。世界、采集、制作与研究均可脱离画面独立验证。
export const VERSION = 4;
export const WORLD = { width: 3600, height: 2800, spawn: { x: 1260, y: 1640 }, dayLength: 300 };
export const ITEMS = {
  wood:{name:'木材',icon:'wood'},twig:{name:'树枝',icon:'twig'},stone:{name:'石料',icon:'rock'},flint:{name:'燧石',icon:'flint'},grass:{name:'纤维',icon:'grass'},berry:{name:'浆果',icon:'bush',food:13,health:1},seed:{name:'种子',icon:'seed'},flower:{name:'荧光花',icon:'flower'},ore:{name:'铜矿',icon:'ore'},ingot:{name:'铜锭',icon:'ingot'},crystal:{name:'原晶',icon:'crystal'},board:{name:'木板',icon:'board'},cooked:{name:'烤浆果',icon:'food',food:30,health:7},ration:{name:'旅行口粮',icon:'food',food:48,health:12},axe:{name:'石斧',icon:'axe',durability:90},pickaxe:{name:'石镐',icon:'pickaxe',durability:110},spear:{name:'石矛',icon:'spear',durability:120},copperSpear:{name:'铜矛',icon:'spear',durability:180},torch:{name:'火炬',icon:'torch'},bedroll:{name:'草编睡袋',icon:'bedroll'}
};
Object.assign(ITEMS,EXTRA_ITEMS,WILD_ITEMS);
export const RESOURCE_NAMES = {...Object.fromEntries(Object.entries(ITEMS).map(([k,v])=>[k,v.name])),insight:'洞见',resonance:'共鸣'};
export const NODES = {
  tree:{name:'青杉',tool:'axe',hp:3,time:.65,drop:{wood:4,twig:1,seed:1},eco:-1.2},
  rock:{name:'岩石',tool:'pickaxe',hp:3,time:.65,drop:{stone:5,flint:2},eco:-.3},
  ore:{name:'铜矿脉',tool:'pickaxe',hp:4,time:.65,drop:{ore:5,stone:2},eco:-.8},
  crystal:{name:'原晶簇',tool:'pickaxe',hp:4,time:.75,drop:{crystal:3,stone:1},eco:-.5},
  bush:{name:'浆果丛',hp:1,time:.65,drop:{berry:4,seed:1},regrow:150},
  grass:{name:'长草',hp:1,time:.45,drop:{grass:4},regrow:130},
  twig:{name:'枯枝',hp:1,time:.45,drop:{twig:3}},
  flint:{name:'散落燧石',hp:1,time:.45,drop:{flint:3,stone:1}},
  flower:{name:'荧光花',hp:1,time:.65,drop:{flower:3},regrow:170},
  ruin:{name:'先行者遗迹',hp:1,time:1.8,drop:{crystal:2},insight:9,resonance:3}
};
Object.assign(NODES,EXTRA_NODES,WILD_NODES);
export const TECHS = [
  {id:'stonework',name:'石器精研',branch:'matter',cost:{insight:4,stone:6},requires:[],text:'解锁熔炉。更好地理解材料，开始建设稳定营地。'},
  {id:'smelting',name:'金属冶炼',branch:'matter',cost:{insight:7,ore:6},requires:['stonework'],text:'在熔炉旁冶炼铜锭，制作更耐用的铜矛。'},
  {id:'crystal',name:'晶体导能',branch:'matter',cost:{insight:9,ingot:3,crystal:2},requires:['smelting'],text:'解锁共鸣台，将物质工程与意识研究连接起来。'},
  {id:'drilling',name:'地脉采集',branch:'matter',cost:{insight:8,ingot:3},requires:['smelting'],level:2,text:'解锁晶能采矿机，在矿脉附近持续采集铜矿。'},
  {id:'observe',name:'万物观察',branch:'mind',cost:{insight:3,flower:2},requires:[],text:'解锁营火冥想，用荧光花获得共鸣并恢复意识。'},
  {id:'steward',name:'共生实践',branch:'mind',cost:{insight:5,resonance:4},requires:['observe'],planted:3,text:'亲手播种三次。解锁循环农圃，学会归还土地。'},
  {id:'resonate',name:'意识共振',branch:'mind',cost:{insight:8,resonance:8},requires:['steward'],text:'能够启动共鸣台，完成一级文明的晋升仪式。'},
  {id:'ward',name:'心光庇护',branch:'mind',cost:{insight:8,resonance:6},requires:['resonate'],level:2,text:'解锁长明灯与星火信标。以稳定的光守护远行。'}
];
export const RECIPES = [
  {id:'axe',name:'石斧',category:'tools',cost:{twig:2,flint:2},item:'axe',desc:'砍伐青杉，获取木材。制作新斧可恢复耐久。'},
  {id:'pickaxe',name:'石镐',category:'tools',cost:{twig:3,flint:3},item:'pickaxe',desc:'开采岩石、铜矿与原晶。'},
  {id:'spear',name:'石矛',category:'tools',cost:{wood:3,flint:2,grass:2},item:'spear',desc:'攻击造成 20 点伤害。空格攻击附近夜影。'},
  {id:'copperSpear',name:'铜矛',category:'tools',cost:{ingot:2,wood:3},item:'copperSpear',tech:'smelting',desc:'更坚固的武器，攻击造成 30 点伤害。'},
  {id:'torch',name:'火炬',category:'survival',cost:{twig:2,grass:3},item:'torch',desc:'照亮身边 120 秒。制作后自动点亮，可随时熄灭。'},
  {id:'bedroll',name:'草编睡袋',category:'survival',cost:{grass:6,twig:2},item:'bedroll',desc:'黄昏或夜间，在有燃料的营火旁睡到清晨。'},
  {id:'cooked',name:'烤浆果',category:'survival',cost:{berry:2},item:'cooked',station:'campfire',desc:'饱食 +30，生命 +7。需要燃烧的营火。'},
  {id:'ration',name:'旅行口粮',category:'survival',cost:{cooked:1,seed:2},item:'ration',station:'campfire',desc:'饱食 +48，生命 +12。适合深入未知区域。'},
  {id:'board',name:'木板',category:'materials',cost:{wood:3},item:'board',desc:'经过整理的木材，用于建造远行设施。'},
  {id:'ingot',name:'铜锭',category:'materials',cost:{ore:3,wood:2},item:'ingot',tech:'smelting',station:'furnace',desc:'冶炼一块铜锭。木材同时提供燃料。'},
  {id:'campfire',name:'营火',category:'camp',cost:{wood:5,stone:4,grass:2},building:'campfire',desc:'温暖、安全与烹饪的起点。初始燃料 150 秒，可添柴。'},
  {id:'table',name:'研究台',category:'camp',cost:{wood:10,stone:6,grass:4},building:'table',desc:'在附近研究物质与意识科技。首次建成获得洞见。'},
  {id:'furnace',name:'熔炉',category:'camp',cost:{stone:10,wood:6},building:'furnace',tech:'stonework',desc:'在附近将铜矿与木材冶炼成铜锭。'},
  {id:'farm',name:'循环农圃',category:'camp',cost:{wood:5,grass:5,seed:3},building:'farm',tech:'steward',desc:'每 75 秒成熟，收获浆果与种子，逐步修复生态。'},
  {id:'resonator',name:'共鸣台',category:'camp',cost:{stone:8,ingot:6,crystal:5,resonance:4},building:'resonator',tech:'crystal',desc:'科技与意识在此交汇。完成试炼后晋升二级。'},
  {id:'drill',name:'晶能采矿机',category:'advanced',cost:{stone:6,ingot:5,crystal:3},building:'drill',tech:'drilling',level:2,desc:'放在铜矿附近，每 15 秒产出 1 铜矿。进入附近按 E 取出。'},
  {id:'lantern',name:'长明灯',category:'advanced',cost:{ingot:2,crystal:3,resonance:5},building:'lantern',tech:'ward',level:2,desc:'持续照明，驱离夜影。帮助你建立远行路线。'},
  {id:'beacon',name:'星火信标',category:'advanced',cost:{ingot:7,crystal:5,board:5},building:'beacon',tech:'ward',level:2,desc:'在星陨高地建造。投入 10 共鸣，点亮信标，完成第二级试炼。'}
];
TECHS.push(...EXTRA_TECHS);
RECIPES.push(...EXTRA_RECIPES,...WILD_RECIPES);
export const BUILDING_NAMES = Object.fromEntries(RECIPES.filter(r=>r.building).map(r=>[r.building,r.name]));
export function phase(s){const t=s.time%WORLD.dayLength;return t<190?'day':t<230?'dusk':'night';}
export function day(s){return Math.floor(s.time/WORLD.dayLength)+1;}
export function biome(x,y){if(x>2450&&y<1050)return{id:'highland',name:'星陨高地',color:'#769894'};if(x>1900&&y<1680)return{id:'ridge',name:'铜脊丘陵',color:'#a49c78'};if(y>1850)return{id:'meadow',name:'荧光草甸',color:'#809771'};if(x<1350&&y<1380)return{id:'forest',name:'青杉密林',color:'#4e7762'};return{id:'bay',name:'苔湾',color:'#739578'};}
export function isLand(x,y){const dx=(x-1800)/1510,dy=(y-1390)/1100,a=Math.atan2(dy,dx),edge=1+.055*Math.sin(a*5)+.025*Math.sin(a*9);return dx*dx+dy*dy<edge*edge&&x>80&&y>80&&x<3520&&y<2720;}
export function walkable(s,x,y){return isLand(x,y)&&!(s.level<2&&biome(x,y).id==='highland');}
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function random(s){let x=s.rng;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function say(s,text,important=false){s.message={id:++s.messageSeq,text};if(important){s.journal.unshift({day:day(s),text});s.journal=s.journal.slice(0,80);}}
const fail=(s,text)=>{say(s,text);return{ok:false,reason:text};};
export function amount(s,id){return id==='insight'||id==='resonance'?s[id]:(s.inventory[id]||0);}
export function affordable(s,cost={}){return Object.entries(cost).every(([id,n])=>amount(s,id)>=n);}
function pay(s,cost={}){for(const[id,n]of Object.entries(cost)){if(id==='insight'||id==='resonance')s[id]-=n;else s.inventory[id]-=n;}}
function give(s,items){for(const[id,n]of Object.entries(items))s.inventory[id]=Math.min(9999,(s.inventory[id]||0)+n);}
function discovered(s,key,reward=3){if(s.discoveries.includes(key))return;s.discoveries.push(key);s.insight+=reward;}
export function createGame(seed=20261022){
  const s={version:VERSION,seed,rng:seed>>>0,time:28,level:1,status:'playing',player:{...WORLD.spawn,hp:100,hunger:100,clarity:100,face:1,walk:0},inventory:{berry:2,grass:2},durability:{},insight:0,resonance:0,ecology:78,tech:[],nodes:[],buildings:[],enemies:[],discoveries:[],visited:['bay'],explored:[],journal:[{day:1,text:'你在苔湾醒来。远处的古老信标仍然沉默。'}],stats:{gathered:0,crafted:0,planted:0,nights:0,defeated:0},crafted:[],target:null,path:[],action:null,attackCooldown:0,interactCooldown:0,meditationCooldown:0,torchOn:false,torchFuel:0,darkTime:0,enemyClock:0,messageSeq:0,message:null,fx:[],chapterCompleted:false};
  const add=(type,x,y)=>s.nodes.push({id:'n'+s.nodes.length,type,x,y,hp:NODES[type].hp,available:true,respawnAt:0});
  for(const[type,dx,dy]of[['twig',-65,20],['twig',95,-30],['flint',45,75],['flint',-100,-75],['grass',-20,105],['grass',90,105],['tree',-155,-105],['tree',-220,35],['tree',-145,150],['rock',190,-80],['bush',160,90],['flower',-200,210]])add(type,WORLD.spawn.x+dx,WORLD.spawn.y+dy);
  const scatter=(type,count,filter=()=>true)=>{for(let i=0;i<count;i++){let ok=false;for(let j=0;j<500&&!ok;j++){const x=300+random(s)*3000,y=350+random(s)*2150;if(!isLand(x,y)||!filter(x,y)||distance({x,y},WORLD.spawn)<220||s.nodes.some(n=>distance(n,{x,y})<55))continue;add(type,x,y);ok=true;}}};
  scatter('tree',70,(x,y)=>x<2300&&biome(x,y).id!=='ridge');scatter('rock',28);scatter('ore',25,(x,y)=>x>1850&&y<1750);scatter('crystal',15,(x,y)=>x>1900);scatter('bush',25,(x,y)=>y>1000);scatter('grass',35);scatter('twig',22,(x)=>x<2450);scatter('flint',22);scatter('flower',22,(x,y)=>y>1650);
  add('ruin',1690,1320);add('ruin',2120,1880);add('ruin',965,1000);add('ruin',2850,690);
  initExpansion(s);initWilderness(s);reveal(s);return s;
}
export function nearby(s,type,radius=155){return s.buildings.find(b=>(!type||b.type===type)&&distance(s.player,b)<radius&&!(b.type==='campfire'&&b.fuel<=0));}
export function nearest(s,range=90){
  const items=[...s.nodes.filter(n=>n.available),...s.buildings.map(b=>({...b,building:true}))];
  let best=null,bestD=range;for(const n of items){const d=distance(s.player,n);if(d<bestD){best=n;bestD=d;}}return best;
}
export function recipeReason(s,r){
  if(!r)return'未知配方';if(s.status!=='playing')return'当前旅程已结束';
  if(r.item&&ITEMS[r.item]?.unique&&s.inventory[r.item])return'已经拥有';
  if(r.level&&s.level<r.level)return'需要'+r.level+'级文明';
  if(r.tech&&!s.tech.includes(r.tech))return'需要研究「'+TECHS.find(t=>t.id===r.tech).name+'」';
  if(r.station&&!nearby(s,r.station))return'需要靠近'+(r.station==='campfire'?'燃烧的营火':BUILDING_NAMES[r.station]);
  if(!affordable(s,r.cost))return'材料不足';return'';
}
export function craft(s,id){
  const r=RECIPES.find(r=>r.id===id),reason=recipeReason(s,r);if(reason)return fail(s,reason);
  if(r.building)return{ok:true,placing:r.building};
  pay(s,r.cost);give(s,{[r.item]:1});
  if(ITEMS[r.item].durability){s.inventory[r.item]=1;s.durability[r.item]=ITEMS[r.item].durability;}
  if(r.item==='torch'){if(!s.torchFuel)s.torchFuel=120;s.torchOn=true;}
  if(r.station==='furnace')nearby(s,'furnace').workingUntil=s.time+12;
  if(!s.crafted.includes(id)){s.crafted.push(id);s.insight+=2;}s.stats.crafted++;
  say(s,'制作完成：'+r.name);return{ok:true};
}
export function placementReason(s,type,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!walkable(s,x,y))return'这里无法建造';if(distance(s.player,{x,y})>210)return'请走近再建造';
  if(s.buildings.some(b=>distance(b,{x,y})<88))return'离其他建筑太近';
  if(s.nodes.some(n=>n.available&&['tree','rock','ore','crystal','ruin','trial','meteor','burrow'].includes(n.type)&&distance(n,{x,y})<54))return'需要一片空地';
  if(type==='trap'&&!s.nodes.some(n=>n.type==='burrow'&&distance(n,{x,y})<180))return'诱捕笼需要放在兔洞 180 步内';
  if(type==='drill'&&!s.nodes.some(n=>n.type==='ore'&&distance(n,{x,y})<240))return'采矿机需要放在铜矿脉附近';
  if(type==='beacon'&&biome(x,y).id!=='highland')return'星火信标需要建在星陨高地';return'';
}
export function place(s,id,x,y){
  const r=RECIPES.find(r=>r.building===id),reason=recipeReason(s,r)||placementReason(s,id,x,y);if(reason)return fail(s,reason);
  pay(s,r.cost);s.buildings.push({id:'b'+s.stats.crafted+'-'+Math.floor(s.time*100),type:id,x,y,fuel:id==='campfire'?150:0,readyAt:s.time+75,stored:0,productionAt:s.time,workingUntil:0,...(['cookpot','trap'].includes(id)?{inventory:{}}:{})});
  if(!s.crafted.includes(id)){s.crafted.push(id);s.insight+=3;}s.stats.crafted++;say(s,'建成「'+r.name+'」。',true);return{ok:true};
}
export function placementNearPlayer(s,type){
  for(const r of[95,135,180])for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=s.player.x+Math.cos(a)*r,y=s.player.y+Math.sin(a)*r;if(!placementReason(s,type,x,y))return{x,y};}return null;
}
export function plant(s,x=s.player.x+35,y=s.player.y+35){
  if(s.status!=='playing')return fail(s,'当前旅程已经结束');
  if(!s.inventory.seed)return fail(s,'需要 1 颗种子');
  if(!walkable(s,x,y)||distance(s.player,{x,y})>160||s.nodes.some(n=>(n.available||n.sapling)&&distance(n,{x,y})<36)||s.buildings.some(b=>distance(b,{x,y})<55))return fail(s,'请在空地上播种');
  s.inventory.seed--;s.stats.planted++;s.ecology=clamp(s.ecology+3);s.nodes.push({id:'p'+s.stats.planted,type:'tree',x,y,hp:3,available:false,respawnAt:s.time+85,sapling:true});say(s,'种下一株青杉。生态 +3；成长后共鸣 +1。');return{ok:true};
}
export function useItem(s,id){
  if(s.status!=='playing')return fail(s,'当前旅程已经结束');
  if(!s.inventory[id])return fail(s,'背包中没有'+(ITEMS[id]?.name||'该物品'));
  const item=ITEMS[id];if(item.food||item.health){s.inventory[id]--;s.player.hunger=clamp(s.player.hunger+(item.food||0));s.player.clarity=clamp(s.player.clarity+(item.clarity||0));if(['stew','feast'].includes(id))s.wilderness.wetness=Math.max(0,s.wilderness.wetness-25);s.player.hp=clamp(s.player.hp+(item.health||0),0,maxHealth(s));say(s,`使用${item.name}，${item.food?'饱食 +'+item.food:'生命 +'+item.health}。`);return{ok:true};}
  if(id==='coat')return fail(s,'毛皮披肩已自动穿戴，淋雨速度降低 75%。');
  if(id==='torch'){s.torchOn=!s.torchOn;s.torchFuel||=120;say(s,s.torchOn?'点亮火炬。':'熄灭火炬，保存燃料。');return{ok:true};}
  if(id==='seed')return plant(s);
  return fail(s,item.durability?'工具在采集和攻击时自动使用。':'这份材料可以用于合成与研究。');
}
export function researchReason(s,t){
  if(s.status!=='playing')return'当前旅程已经结束';
  if(s.tech.includes(t.id))return'已掌握';if(!nearby(s,'table',185))return'需要靠近研究台';
  if(t.level&&s.level<t.level)return'需要'+t.level+'级文明';if(!t.requires.every(id=>s.tech.includes(id)))return'前置研究未完成';
  if(t.planted&&s.stats.planted<t.planted)return`需要亲手播种 ${t.planted} 次（当前 ${s.stats.planted}）`;
  if(!affordable(s,t.cost))return'研究资源不足';return'';
}
export function research(s,id){const t=TECHS.find(t=>t.id===id);if(!t)return fail(s,'未知研究');const reason=researchReason(s,t);if(reason)return fail(s,reason);pay(s,t.cost);s.tech.push(id);say(s,'点亮科技：「'+t.name+'」。',true);return{ok:true};}
export function promotionRequirements(s){return[
  {ok:s.tech.includes('crystal'),text:'完成物质研究「晶体导能」'},
  {ok:s.tech.includes('resonate'),text:'完成意识研究「意识共振」'},
  {ok:s.stats.nights>=1,text:`度过至少一个夜晚 · ${s.stats.nights}/1`},
  {ok:s.ecology>=60,text:`生态 ≥60 · 当前 ${Math.round(s.ecology)}`},
  {ok:s.player.clarity>=60,text:`意识 ≥60 · 当前 ${Math.round(s.player.clarity)}`},
  {ok:s.resonance>=8,text:`储备 8 共鸣 · 当前 ${Math.floor(s.resonance)}`}
];}
export function stationAction(s,action,id){
  if(s.status!=='playing')return fail(s,'当前旅程已经结束');
  const b=s.buildings.find(b=>b.id===id);if(!b||distance(s.player,b)>180)return fail(s,'请先走近设施');
  if(action==='collect'||action==='bait'||action.startsWith('cook:'))return campAction(s,b,action);
  if(action==='ascend')return ascend(s,b);
  if(action.startsWith('manifest:'))return manifest(s,b,action.split(':')[1]);
  if(action==='ending:stay'||action==='ending:return')return chooseEnding(s,action.split(':')[1]);
  if(action==='fuel'){
    if(b.type!=='campfire')return fail(s,'这里不能添柴');if(!s.inventory.wood)return fail(s,'需要 1 木材');if(b.fuel>=280)return fail(s,'燃料已经充足');s.inventory.wood--;b.fuel=Math.min(300,b.fuel+70);say(s,'为营火添柴，增加 70 秒燃料。');return{ok:true};
  }
  if(action==='meditate'){
    if(b.type!=='campfire'||b.fuel<=0)return fail(s,'需要一处燃烧的营火');if(!s.tech.includes('observe'))return fail(s,'先研究「万物观察」');if(s.meditationCooldown>0)return fail(s,`心绪尚未平复，还需 ${Math.ceil(s.meditationCooldown)} 秒`);if(!s.inventory.flower)return fail(s,'需要 1 朵荧光花');s.inventory.flower--;s.resonance=Math.min(100,s.resonance+4);s.player.clarity=clamp(s.player.clarity+18);s.meditationCooldown=12;say(s,'你听见了风与树林的回应。共鸣 +4，意识 +18。',true);return{ok:true};
  }
  if(action==='sleep'){
    if(b.type!=='campfire'||b.fuel<65)return fail(s,'营火至少需要 65 秒燃料');if(!s.inventory.bedroll)return fail(s,'需要草编睡袋');if(phase(s)==='day')return fail(s,'黄昏与夜晚才能休息');if(s.player.hunger<30)return fail(s,'饱食不足 30，先吃些食物');if(s.enemies.some(e=>distance(e,s.player)<200))return fail(s,'附近有夜影，暂时无法安睡');
    b.fuel-=65;s.player.hunger-=24;s.player.hp=clamp(s.player.hp+25,0,maxHealth(s));s.player.clarity=clamp(s.player.clarity+25);s.time=(Math.floor(s.time/WORLD.dayLength)+1)*WORLD.dayLength+8;s.stats.nights++;s.enemies=[];s.darkTime=0;s.action=null;s.target=null;s.path=[];s.meditationCooldown=0;say(s,'你在营火旁醒来。新的一天开始了。',true);return{ok:true};
  }
  if(action==='promote'){
    if(b.type!=='resonator')return fail(s,'需要一座共鸣台');if(s.level>=2)return fail(s,'初醒试炼已经完成');if(!promotionRequirements(s).every(r=>r.ok))return fail(s,'文明试炼条件尚未满足');s.resonance-=8;s.level=2;s.player.hp=120;s.player.clarity=100;say(s,'晋升二级 · 协同。星陨高地的屏障为你打开。',true);return{ok:true,promoted:true};
  }
  if(action==='beacon'){
    if(b.type!=='beacon')return fail(s,'需要一座星火信标');if(s.chapterCompleted)return fail(s,'信标已点亮');if(s.level<2||!s.tech.includes('ward')||!s.buildings.some(b=>b.type==='drill'))return fail(s,'需要心光庇护研究，并建成至少一座晶能采矿机');if(s.resonance<10)return fail(s,'点亮信标需要 10 共鸣');s.resonance-=10;s.chapterCompleted=true;levelUp(s,3);say(s,'星火已亮。晋升三级，遗迹中的回声开始回应你。',true);return{ok:true,promoted:true};
  }
  return fail(s,'未知设施操作');
}
export function interact(s,id){
  if(s.status!=='playing')return fail(s,'当前旅程已经结束');
  if(s.action||s.channel)return{ok:false,reason:'正在行动'};
  let n=id?s.nodes.find(n=>n.id===id&&n.available)||s.buildings.find(b=>b.id===id):nearest(s);
  if(n?.building)n=s.buildings.find(b=>b.id===n.id);
  if(!n)return fail(s,'走近资源后按 E，或点击资源自动走近采集');
  if(distance(s.player,n)>95)return fail(s,'再走近一些');
  if(n.type==='burrow')return fail(s,'在兔洞 180 步内放置诱捕笼，加入浆果，等待野兔来访。');
  if(n.type==='trial')return{ok:true,panel:'trial',trialId:n.trialId};
  if(NODES[n.type]?.level>s.level)return fail(s,'需要'+NODES[n.type].level+'级文明才能采集');
  if(!NODES[n.type]){
    if(n.type==='farm'){if(s.time<n.readyAt)return fail(s,`农圃还需 ${Math.ceil(n.readyAt-s.time)} 秒成熟`);give(s,{berry:5,seed:2});n.readyAt=s.time+75;s.ecology=clamp(s.ecology+1);say(s,'收获浆果 ×5、种子 ×2。');return{ok:true};}
    if(n.type==='drill'){if(!n.stored)return fail(s,'采矿机正在工作，稍后再来');give(s,{ore:n.stored});say(s,'取出铜矿 ×'+n.stored+'。');n.stored=0;return{ok:true};}
    if(n.type==='table')return{ok:true,panel:'tech'};
    if(n.type==='lantern')return fail(s,'长明灯正在照亮这片土地。');
    return{ok:true,panel:'station',buildingId:n.id};
  }
  const data=NODES[n.type];if(data.tool&&(!(s.inventory[data.tool]>0)||!(s.durability[data.tool]>0)))return fail(s,'需要'+ITEMS[data.tool].name+'，先在合成栏制作');
  s.action={id:n.id,elapsed:0,duration:data.time};s.interactCooldown=.1;return{ok:true};
}
function finishHarvest(s){
  const n=s.nodes.find(n=>n.id===s.action?.id);s.action=null;if(!n?.available)return;
  const data=NODES[n.type];if(data.tool){if(!s.durability[data.tool])return;s.durability[data.tool]--;if(s.durability[data.tool]<=0){s.inventory[data.tool]=0;say(s,ITEMS[data.tool].name+'损坏了，可以重新制作。');}}
  impact(s,n);n.hp--;if(n.hp>0)return;
  n.felledAt=s.time;n.available=false;n.respawnAt=data.regrow?s.time+data.regrow:0;give(s,data.drop);s.stats.gathered++;s.ecology=clamp(s.ecology+(data.eco||0));discovered(s,'node:'+n.type);
  if(data.insight)s.insight+=data.insight;if(data.resonance)s.resonance=Math.min(100,s.resonance+data.resonance);
  const text=Object.entries(data.drop).map(([k,v])=>ITEMS[k].name+' +'+v).join(' · ');s.fx.push({x:n.x,y:n.y,at:s.time,text});s.fx=s.fx.slice(-6);say(s,text+(data.insight?' · 洞见 +'+data.insight+' · 共鸣 +'+data.resonance:''),n.type==='ruin');
  if(s.target?.id===n.id){s.target=null;s.path=[];}
}
function straight(s,a,b){const d=distance(a,b),steps=Math.max(1,Math.ceil(d/36));for(let i=1;i<=steps;i++)if(!walkable(s,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;}
export function goTo(s,x,y,targetId=null){
  if(!walkable(s,x,y))return fail(s,biome(x,y).id==='highland'?'星陨高地尚未开放。先晋升二级文明。':'海水太深，沿岸寻找另一条路');
  s.action=null;s.channel=null;s.target=targetId?{id:targetId}:null;
  if(straight(s,s.player,{x,y})){s.path=[{x,y}];return{ok:true};}
  // 点击移动采用网格寻路，避免角色沿海岸直走进入水中。
  const cell=70,key=(x,y)=>x+','+y,sx=Math.floor(s.player.x/cell),sy=Math.floor(s.player.y/cell),gx=Math.floor(x/cell),gy=Math.floor(y/cell);
  const start={x:sx,y:sy,g:0,f:0},open=[start],seen=new Map([[key(sx,sy),start]]),closed=new Set();let found=null,limit=0;
  while(open.length&&limit++<2500){open.sort((a,b)=>a.f-b.f);const n=open.shift(),nk=key(n.x,n.y);if(closed.has(nk))continue;closed.add(nk);if(n.x===gx&&n.y===gy){found=n;break;}
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const xx=n.x+dx,yy=n.y+dy,k=key(xx,yy);if(closed.has(k)||!walkable(s,(xx+.5)*cell,(yy+.5)*cell))continue;if(dx&&dy&&(!walkable(s,(n.x+dx+.5)*cell,(n.y+.5)*cell)||!walkable(s,(n.x+.5)*cell,(n.y+dy+.5)*cell)))continue;const g=n.g+Math.hypot(dx,dy);if(seen.has(k)&&seen.get(k).g<=g)continue;const v={x:xx,y:yy,g,f:g+Math.hypot(gx-xx,gy-yy),parent:n};seen.set(k,v);open.push(v);}
  }
  if(!found){s.target=null;return fail(s,'暂时找不到通路，请换一个落点');}
  const path=[{x,y}];while(found.parent){path.unshift({x:(found.x+.5)*cell,y:(found.y+.5)*cell});found=found.parent;}s.path=path;return{ok:true};
}
export function lightAt(s,x,y){
  if(s.level>=8&&distance(s.player,{x,y})<185)return true;
  if(s.torchOn&&s.torchFuel>0&&distance(s.player,{x,y})<145)return true;
  return s.buildings.some(b=>((b.type==='campfire'&&b.fuel>0)||b.type==='lantern'||(b.type==='beacon'&&s.chapterCompleted))&&distance(b,{x,y})<(b.type==='lantern'?215:b.type==='beacon'?260:190));
}
export function attack(s){
  if(s.status!=='playing')return{ok:false};if(s.attackCooldown>0)return{ok:false};s.attackCooldown=.55;s.swingUntil=s.time+.22;
  const weapon=s.inventory.copperSpear?'copperSpear':s.inventory.spear?'spear':null,damage=weapon==='copperSpear'?30:weapon==='spear'?20:5;
  const targets=s.enemies.filter(e=>distance(e,s.player)<105);for(const e of targets){e.hp-=damage;e.x+=(e.x-s.player.x)*.2;e.y+=(e.y-s.player.y)*.2;}
  if(weapon&&targets.length){s.durability[weapon]--;if(s.durability[weapon]<=0){s.inventory[weapon]=0;say(s,ITEMS[weapon].name+'损坏了。');}}
  for(const e of s.enemies.filter(e=>e.hp<=0)){s.stats.defeated++;s.insight+=2;s.fx.push({x:e.x,y:e.y,at:s.time,text:'夜影消散 · 洞见 +2'});}s.enemies=s.enemies.filter(e=>e.hp>0);return{ok:true};
}
function reveal(s){const cx=Math.floor(s.player.x/160),cy=Math.floor(s.player.y/160);for(let x=cx-2;x<=cx+2;x++)for(let y=cy-2;y<=cy+2;y++){const k=x+','+y;if(x>=0&&y>=0&&x<23&&y<18&&!s.explored.includes(k))s.explored.push(k);}}
export function step(s,dt,input={}){
  if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.12);
  const oldDay=day(s),oldPhase=phase(s);s.time+=dt;s.attackCooldown=Math.max(0,s.attackCooldown-dt);s.interactCooldown=Math.max(0,s.interactCooldown-dt);s.meditationCooldown=Math.max(0,s.meditationCooldown-dt);
  const p=s.player;let dx=input.x||0,dy=input.y||0,manual=!!(dx||dy);
  if(manual){s.channel=null;s.target=null;s.path=[];s.action=null;}else if(s.path.length&&!s.action){const point=s.path[0],d=distance(p,point);if(d<7)s.path.shift();else{dx=(point.x-p.x)/d;dy=(point.y-p.y)/d;}}
  if(s.target&&!s.channel){const n=s.nodes.find(n=>n.id===s.target.id&&n.available)||s.buildings.find(b=>b.id===s.target.id);if(!n){s.target=null;s.path=[];}else if(distance(p,n)<82){s.path=[];dx=dy=0;if(!s.action&&s.interactCooldown<=0){const result=interact(s,n.id);if(result.panel){s.request={...result};s.target=null;}else if(!result.ok){s.target=null;s.interactCooldown=.7;}}}}
  const length=Math.hypot(dx,dy);if(length&&!s.action){const speed=(input.sprint?260:195)*(p.hunger<=0?.65:1);let mx=dx/Math.max(1,length)*speed*dt,my=dy/Math.max(1,length)*speed*dt;
    // 到达落点时截断本帧位移，避免低帧率下跨过目标来回抖动。
    if(!manual&&s.path.length&&distance(p,s.path[0])<speed*dt){mx=s.path[0].x-p.x;my=s.path[0].y-p.y;}if(walkable(s,p.x+mx,p.y))p.x+=mx;if(walkable(s,p.x,p.y+my))p.y+=my;p.face=dy<-.2?-1:dy>.2?1:p.face;p.walk+=dt*(input.sprint?13:9);}
  else p.walk=0;
  if(input.interact&&!s.channel&&!s.action&&s.interactCooldown<=0){const n=nearest(s);if(n&&NODES[n.type]){interact(s,n.id);s.interactCooldown=.65;}}
  if(s.action){const n=s.nodes.find(n=>n.id===s.action.id);if(!n||distance(p,n)>105)s.action=null;else{s.action.elapsed+=dt;if(s.action.elapsed>=s.action.duration)finishHarvest(s);}}
  if(input.attack)attack(s);
  p.hunger=clamp(p.hunger-(s.level>=9?0:dt*(manual&&input.sprint?.12:.065)*(s.level>=7?.5:1)));
  advanceExpansion(s,dt,manual||input.attack);stepWilderness(s,dt);
  if(s.level>=7)p.hp=clamp(p.hp+dt*.12,0,maxHealth(s));
  const ph=phase(s),lit=lightAt(s,p.x,p.y);
  if(ph==='night'&&!lit){s.darkTime+=dt;p.clarity=clamp(p.clarity-dt*.32);if(s.darkTime>7)p.hp-=dt*2.4;}else{s.darkTime=0;if(nearby(s,'campfire',180))p.clarity=clamp(p.clarity+dt*.26);}
  if(p.hunger<=0)p.hp-=dt*.7;
  if(p.hunger>65&&nearby(s,'campfire',150))p.hp=clamp(p.hp+dt*.18,0,maxHealth(s));
  if(s.torchOn&&s.inventory.torch){s.torchFuel-=dt*(weather(s).raining?1.2:1);if(s.torchFuel<=0){s.inventory.torch--;s.torchFuel=s.inventory.torch?120:0;if(!s.inventory.torch){s.torchOn=false;say(s,'火炬熄灭了。尽快回到营火旁。');}}}
  for(const b of s.buildings){if(b.type==='campfire')b.fuel=Math.max(0,b.fuel-dt*(ph==='day'?.28:1)*(weather(s).raining?1.35:1));if(b.type==='drill'&&s.time-b.productionAt>=15){b.stored=Math.min(30,b.stored+Math.floor((s.time-b.productionAt)/15));b.productionAt=s.time;}if(b.type==='farm'&&s.ecology<100)s.ecology=clamp(s.ecology+dt*.009);}
  for(const n of s.nodes)if(!n.available&&n.respawnAt&&s.time>=n.respawnAt){n.available=true;n.hp=NODES[n.type].hp;n.respawnAt=0;if(n.sapling){n.sapling=false;s.resonance=Math.min(100,s.resonance+1);}}
  if(ph==='night'){
    s.enemyClock+=dt;if(s.enemyClock>19&&s.enemies.length<4){s.enemyClock=0;const a=random(s)*Math.PI*2,x=p.x+Math.cos(a)*430,y=p.y+Math.sin(a)*430;if(walkable(s,x,y))s.enemies.push({id:'e'+s.time,x,y,hp:35,cooldown:0});}
    for(const e of s.enemies){const d=distance(e,p),inLight=lightAt(s,e.x,e.y);let vx=(p.x-e.x)/Math.max(d,1),vy=(p.y-e.y)/Math.max(d,1);if(inLight){vx=-vx;vy=-vy;}const nx=e.x+vx*(inLight?120:80)*dt,ny=e.y+vy*(inLight?120:80)*dt;if(walkable(s,nx,ny)){e.x=nx;e.y=ny;}e.cooldown=Math.max(0,e.cooldown-dt);if(d<40&&!lit&&!e.cooldown){const armored=s.inventory.armor&&s.durability.armor>0;p.hp-=armored?6:11;if(armored){s.durability.armor=Math.max(0,s.durability.armor-8);if(!s.durability.armor)s.inventory.armor=0;}p.clarity=clamp(p.clarity-4);e.cooldown=1.5;s.hurtUntil=s.time+.3;}}
  }else{s.enemies=[];s.enemyClock=0;}
  if(day(s)>oldDay){s.stats.nights++;say(s,'第 '+day(s)+' 天。你平安度过了一个夜晚。',true);}
  if(ph!==oldPhase){if(ph==='dusk')say(s,'天色渐暗。准备营火、火炬和食物。',true);if(ph==='night')say(s,'夜晚降临。留在光里，夜影惧怕火光。',true);}
  const area=biome(p.x,p.y);if(!s.visited.includes(area.id)){s.visited.push(area.id);s.insight+=4;say(s,'发现「'+area.name+'」· 洞见 +4。',true);}reveal(s);
  s.fx=s.fx.filter(f=>s.time-f.at<2.2);
  if(p.hp<=0){p.hp=0;s.status='dead';s.action=null;s.path=[];s.target=null;say(s,'旅程在这里停下。你的脚步仍留在这片土地上。',true);}
}
export function getQuest(s){
  if(s.level>=3){if(s.level===9)return{index:9,title:s.expansion.ending?'九级 · 你选择了'+(s.expansion.ending==='stay'?'守护':'归源'):'在最后一道门前',text:s.expansion.ending?'继续探索、建设与守护你的世界。':'回到归一星环，选择留下守护，或回归本源。',progress:'九级已达成',hint:LEVEL_BENEFITS[9]};const chapter=CHAPTERS[s.level],req=chapterRequirements(s);return{index:s.level,title:chapter.title,text:chapter.text,progress:`晋升条件 ${req.filter(r=>r.ok).length}/${req.length}`,hint:LEVEL_BENEFITS[s.level]};}
  if(!s.crafted.includes('axe'))return{index:1,title:'第一把工具',text:'拾取树枝与燧石，合成一把石斧。',progress:`树枝 ${Math.min(2,amount(s,'twig'))}/2 · 燧石 ${Math.min(2,amount(s,'flint'))}/2`,hint:'点击地上的枯枝和燧石，自动走近采集。'};
  if(!s.buildings.some(b=>b.type==='campfire'))return{index:2,title:'在天黑前，留下一束光',text:'砍树、采石，建造你的第一堆营火。',progress:`木材 ${Math.min(5,amount(s,'wood'))}/5 · 石料 ${Math.min(4,amount(s,'stone'))}/4 · 纤维 ${Math.min(2,amount(s,'grass'))}/2`,hint:'先合成石镐开采岩石。营火建造后记得添柴。'};
  if(!s.buildings.some(b=>b.type==='table'))return{index:3,title:'把好奇变成知识',text:'建造研究台，开始探索物质与意识科技。',progress:`木材 ${Math.min(10,amount(s,'wood'))}/10 · 石料 ${Math.min(6,amount(s,'stone'))}/6`,hint:'探索新资源、制作新物品，都能获得洞见。'};
  if(!s.tech.includes('observe')||!s.tech.includes('stonework'))return{index:4,title:'两条成长的道路',text:'在研究台旁点亮「石器精研」和「万物观察」。',progress:`物质 ${s.tech.includes('stonework')?'✓':'待研究'} · 意识 ${s.tech.includes('observe')?'✓':'待研究'}`,hint:'按 T 打开科技树。营火冥想可以产生共鸣。'};
  if(s.level===1)return{index:5,title:'文明的第一次跃迁',text:'研究晶体导能与意识共振，建造并启动共鸣台。',progress:`已完成 ${promotionRequirements(s).filter(r=>r.ok).length}/6 项试炼条件`,hint:'铜矿在东部丘陵。种下种子、照料土地，度过第一个夜晚。'};
  if(!s.buildings.some(b=>b.type==='drill'))return{index:6,title:'让营地学会自持',text:'研究地脉采集，在铜矿旁建造晶能采矿机。',progress:'二级文明 · 自动采集已解锁',hint:'采矿机每 15 秒产出铜矿。靠近按 E 取出。'};
  if(!s.chapterCompleted)return{index:7,title:'把星火带到远方',text:'研究心光庇护，前往东北方星陨高地建造信标。',progress:`共鸣储备 ${Math.min(10,Math.floor(s.resonance))}/10`,hint:'带上口粮与火炬。完成信标后，在旁边按 E 启动。'};
  return{index:8,title:'星火已经亮起',text:'你完成了一级至二级的旅程。继续探索、建设你的营地。',progress:'本章已完成 · 自由生存',hint:'打开九级历程，查看接下来的旅程。'};
}
export function serialize(s){return JSON.stringify(s);}
export function parseSave(raw){
  if(typeof raw!=='string'||raw.length>500000)throw new Error('存档大小无效');const s=JSON.parse(raw),num=(n,a=0,b=100000)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  if(!s||![2,3,VERSION].includes(s.version)||!Number.isInteger(s.level)||s.level<1||s.level>9||!['playing','dead','won'].includes(s.status)||!num(s.time)||!num(s.seed,0,4294967295)||!num(s.rng,0,4294967295))throw new Error('不是受支持的九级生存存档');
  if(!s.player||!num(s.player.x,0,WORLD.width)||!num(s.player.y,0,WORLD.height)||!num(s.player.hp,0,200)||!num(s.player.hunger,0,100)||!num(s.player.clarity,0,100))throw new Error('角色数据无效');
  if(!s.inventory||Array.isArray(s.inventory)||Object.entries(s.inventory).some(([k,v])=>!Object.hasOwn(ITEMS,k)||!Number.isInteger(v)||!num(v,0,9999)))throw new Error('背包数据无效');
  if(!s.durability||Object.entries(s.durability).some(([k,v])=>!ITEMS[k]?.durability||!num(v,0,ITEMS[k].durability)))throw new Error('工具数据无效');
  if(!Array.isArray(s.tech)||s.tech.some(id=>!TECHS.some(t=>t.id===id))||new Set(s.tech).size!==s.tech.length)throw new Error('科技数据无效');
  if(!Array.isArray(s.nodes)||s.nodes.length>1500||s.nodes.some(n=>!n||!Object.hasOwn(NODES,n.type)||typeof n.id!=='string'||!num(n.x,0,WORLD.width)||!num(n.y,0,WORLD.height)||!num(n.hp,0,10)||!num(n.respawnAt)||typeof n.available!=='boolean'))throw new Error('资源地图数据无效');
  if(!Array.isArray(s.buildings)||s.buildings.length>300||s.buildings.some(b=>!b||!Object.hasOwn(BUILDING_NAMES,b.type)||typeof b.id!=='string'||!num(b.x,0,WORLD.width)||!num(b.y,0,WORLD.height)||!num(b.fuel,0,300)||!num(b.readyAt)||!num(b.stored,0,30)||!num(b.productionAt)))throw new Error('营地数据无效');
  if(new Set(s.nodes.map(n=>n.id)).size!==s.nodes.length||new Set(s.buildings.map(b=>b.id)).size!==s.buildings.length)throw new Error('地图对象编号重复');
  for(const key of['insight','resonance','ecology','messageSeq','torchFuel','darkTime','enemyClock','attackCooldown','interactCooldown','meditationCooldown'])if(!num(s[key]))throw new Error('生存状态无效');
  if(!s.stats||['gathered','crafted','planted','nights','defeated'].some(k=>!num(s.stats[k])))throw new Error('旅程数据无效');
  for(const key of['discoveries','visited','explored','crafted'])if(!Array.isArray(s[key])||s[key].length>3000||s[key].some(v=>typeof v!=='string'||v.length>80))throw new Error('探索数据无效');
  if(!Array.isArray(s.journal)||s.journal.length>80||s.journal.some(j=>!j||!num(j.day)||typeof j.text!=='string'||j.text.length>500))throw new Error('日志数据无效');
  if(s.version>=3)validateExpansion(s,num);
  if(s.version===VERSION)validateWilderness(s,num);
  initExpansion(s);initWilderness(s);
  if(typeof s.torchOn!=='boolean'||typeof s.chapterCompleted!=='boolean')throw new Error('存档状态无效');
  s.enemies=[];s.channel=null;s.action=null;s.target=null;s.path=[];s.fx=[];s.request=null;s.player.walk=0;s.message=null;return s;
}

export function maxHealth(s){return s.level===1?100:100+s.level*10;}
export function initExpansion(s){
  if(!s.expansion){
    s.expansion={completed:[],choices:{},ending:null,dashCooldown:0,returnCooldown:0,manifestCooldown:0,shifts:0};
    const add=(type,x,y,extra={})=>{if(!s.nodes.some(n=>n.id===extra.id))s.nodes.push({id:'x'+s.nodes.length,type,x,y,hp:NODES[type].hp,available:true,respawnAt:0,...extra});};
    for(const trial of TRIALS)add('trial',trial.x,trial.y,{id:'trial-'+trial.id,trialId:trial.id});
    for(const[x,y]of[[2590,890],[2710,660],[2910,960],[2320,1190],[3020,1220],[2200,730],[1920,880],[2080,1500]])add('meteor',x,y);
    for(const[x,y]of[[770,1190],[1140,940],[1590,2140],[2280,2210],[1530,2370],[2430,1910],[940,1920],[1920,2000]])add('lumen',x,y);
    if(s.version===2&&s.chapterCompleted){s.level=3;if(s.status==='won')s.status='playing';s.player.hp=Math.max(s.player.hp,120);s.journal.unshift({day:day(s),text:'旧旅程已接续：星火为你开启了三级。'});s.journal=s.journal.slice(0,80);}
  }
  s.version=VERSION;s.channel=null;
  for(const b of s.buildings)if(['chest','synthesizer'].includes(b.type))b.inventory||={};
  return s;
}
function validateExpansion(s,num){
  const e=s.expansion;if(!e||!Array.isArray(e.completed)||e.completed.length>6||e.completed.some(id=>!TRIALS.some(t=>t.id===id))||new Set(e.completed).size!==e.completed.length)throw new Error('遗迹进度无效');
  if(!e.choices||typeof e.choices!=='object'||Array.isArray(e.choices)||Object.entries(e.choices).some(([id,choice])=>!TRIALS.find(t=>t.id===id)?.options.some(o=>o.id===choice)))throw new Error('遗迹选择无效');
  if(![null,'stay','return'].includes(e.ending)||['dashCooldown','returnCooldown','manifestCooldown','shifts'].some(k=>!num(e[k])))throw new Error('能力状态无效');
  for(const b of s.buildings){if(b.inventory&&(typeof b.inventory!=='object'||Array.isArray(b.inventory)||!Object.keys(b.inventory).every(id=>Object.hasOwn(ITEMS,id))||Object.values(b.inventory).some(n=>!Number.isInteger(n)||!num(n,0,9999))))throw new Error('储物箱数据无效');}
  for(const n of s.nodes)if(n.type==='trial'&&!TRIALS.some(t=>t.id===n.trialId))throw new Error('遗迹位置无效');
}
function levelUp(s,level){s.level=level;s.player.hp=maxHealth(s);s.player.clarity=100;s.player.hunger=Math.max(60,s.player.hunger);s.insight+=8;say(s,'晋升'+level+'级 · '+LEVEL_NAMES[level]+'。'+LEVEL_BENEFITS[level],true);}
export function chapterRequirements(s){
  const c=CHAPTERS[s.level];if(!c)return[];
  const rows=c.tech.map(id=>({ok:s.tech.includes(id),text:'掌握「'+TECHS.find(t=>t.id===id).name+'」'}));
  rows.push({ok:s.expansion.completed.includes(c.trial),text:'完成遗迹「'+TRIALS.find(t=>t.id===c.trial).name+'」'},{ok:s.ecology>=c.eco,text:`生态 ≥${c.eco} · 当前 ${Math.round(s.ecology)}`},{ok:s.player.clarity>=60,text:`意识 ≥60 · 当前 ${Math.round(s.player.clarity)}`},{ok:s.resonance>=c.cost,text:`储备 ${c.cost} 共鸣 · 当前 ${Math.floor(s.resonance)}`});
  if(s.level===7)rows.push({ok:new Set(s.buildings.filter(b=>b.type==='garden').map(b=>biome(b.x,b.y).id)).size>=3,text:'在三个不同区域建成生态花园'});
  if(s.level===8)rows.push({ok:s.buildings.some(b=>b.type==='archive'),text:'建成记忆档案馆'},{ok:TRIALS.every(t=>s.expansion.completed.includes(t.id)),text:'完成全部六处遗迹'});
  return rows;
}
function ascend(s,b){const c=CHAPTERS[s.level];if(s.status!=='playing'||!c||c.station!==b.type)return fail(s,'这里不是当前阶段的晋升设施');if(!chapterRequirements(s).every(r=>r.ok))return fail(s,'晋升条件尚未满足');s.resonance-=c.cost;levelUp(s,c.target);return{ok:true,promoted:true};}
export function trialReason(s,id,choice){
  const t=TRIALS.find(t=>t.id===id),o=t?.options.find(o=>o.id===choice);if(s.status!=='playing'||!t||!o)return'无法进行这项试炼';if(s.expansion.completed.includes(id))return'这处遗迹已经完成';if(s.level<t.level)return'需要'+t.level+'级文明';if(!s.tech.includes(t.tech))return'先研究「'+TECHS.find(x=>x.id===t.tech).name+'」';if(distance(s.player,t)>140)return'请先走近遗迹';
  if(t.planted&&s.nodes.filter(n=>n.id.startsWith('p')&&distance(n,t)<220&&(n.available||n.sapling)).length<t.planted)return'请在遗迹附近亲手种下三株青杉';
  if(!affordable(s,o.cost))return'资源不足';return'';
}
export function beginTrial(s,id,choice){const reason=trialReason(s,id,choice);if(reason)return fail(s,reason);const t=TRIALS.find(t=>t.id===id),o=t.options.find(o=>o.id===choice);s.action=null;s.target=null;s.path=[];s.channel={id,choice,elapsed:0,duration:o.duration};say(s,'开始调谐「'+t.name+'」。保持静止；完成时才消耗材料。');return{ok:true};}
function advanceExpansion(s,dt,interrupted){
  const e=s.expansion;if(!e)return;for(const key of['dashCooldown','returnCooldown','manifestCooldown'])e[key]=Math.max(0,e[key]-dt);
  if(s.channel){if(interrupted){s.channel=null;say(s,'调谐已中断，材料未消耗。');}else{const a=s.channel;a.elapsed+=dt;if(a.elapsed>=a.duration){const reason=trialReason(s,a.id,a.choice);s.channel=null;if(reason)say(s,reason);else{const t=TRIALS.find(t=>t.id===a.id),o=t.options.find(o=>o.id===a.choice);pay(s,o.cost);e.completed.push(a.id);e.choices[a.id]=a.choice;s.insight+=12;s.resonance=Math.min(100,s.resonance+6);give(s,{echo:1});if(a.id==='grove')s.ecology=clamp(s.ecology+12);say(s,'完成「'+t.name+'」· 洞见 +12 · 共鸣 +6 · 记忆回响 +1。',true);}}}}
  for(const b of s.buildings){if(b.type==='synthesizer'){b.inventory||={};const cycles=Math.min(100,Math.floor((s.time-b.productionAt)/30));if(cycles>0){for(const[id,n]of Object.entries({wood:5,stone:4,ore:3,berry:4}))b.inventory[id]=Math.min(150,(b.inventory[id]||0)+n*cycles);b.productionAt=s.time;}}if(b.type==='garden'){s.ecology=clamp(s.ecology+dt*.04);s.resonance=Math.min(100,s.resonance+dt*.025);}}
}
export function dash(s,x=0,y=0){
  if(s.status!=='playing'||s.level<3)return fail(s,'三级解锁闪步');if(s.expansion.dashCooldown>0)return fail(s,'闪步冷却 '+Math.ceil(s.expansion.dashCooldown)+' 秒');if(s.player.clarity<4)return fail(s,'意识不足 4');if(!x&&!y)y=s.player.face===-1?-1:1;const len=Math.hypot(x,y);let last={...s.player};for(let i=1;i<=9;i++){const p={x:s.player.x+x/len*i*20,y:s.player.y+y/len*i*20};if(!walkable(s,p.x,p.y))break;last=p;}if(distance(last,s.player)<20)return fail(s,'前方没有足够空间');s.player.x=last.x;s.player.y=last.y;s.player.clarity-=4;s.expansion.dashCooldown=5;s.channel=null;s.action=null;s.target=null;s.path=[];reveal(s);say(s,'闪步 · 意识 −4');return{ok:true};
}
export function returnHome(s){
  if(s.status!=='playing'||s.level<4||!s.buildings.some(b=>b.type==='gate'))return fail(s,'四级建成折跃门后可使用');if(s.expansion.returnCooldown>0)return fail(s,'归途冷却 '+Math.ceil(s.expansion.returnCooldown)+' 秒');if(s.resonance<2)return fail(s,'需要 2 共鸣');const camp=s.buildings.find(b=>b.type==='campfire');if(!camp)return fail(s,'需要保留一座营火作为归途坐标');s.resonance-=2;s.player.x=camp.x;s.player.y=camp.y+25;s.action=null;s.channel=null;s.path=[];s.target=null;s.enemies=[];s.expansion.returnCooldown=45;s.expansion.shifts++;reveal(s);say(s,'你回到了最初的营火旁。');return{ok:true,teleported:true};
}
export function transfer(s,id,item,direction,count=1){
  const b=s.buildings.find(b=>b.id===id);if(s.status!=='playing'||!b||!['chest','synthesizer'].includes(b.type)||distance(b,s.player)>180)return fail(s,'请先走近储物设施');if(!Object.hasOwn(ITEMS,item)||ITEMS[item].durability||!Number.isInteger(count)||count<1||count>9999||!['in','out'].includes(direction))return fail(s,'转移参数无效');if(direction==='in'&&b.type!=='chest')return fail(s,'生产设施只可取出');b.inventory||={};const from=direction==='in'?s.inventory:b.inventory,to=direction==='in'?b.inventory:s.inventory;const n=Math.min(count,from[item]||0,9999-(to[item]||0));if(n<=0)return fail(s,'没有可转移的物品或空间不足');from[item]-=n;to[item]=(to[item]||0)+n;say(s,(direction==='in'?'存入':'取出')+ITEMS[item].name+' ×'+n);return{ok:true};
}
export function repair(s,item){
  if(s.status!=='playing'||!nearby(s,'table',185))return fail(s,'在研究台附近修理工具');if(!ITEMS[item]?.durability||!s.inventory[item])return fail(s,'没有这件装备');if(s.durability[item]>=ITEMS[item].durability)return fail(s,'耐久已经充足');const cost=item==='copperSpear'?{ingot:1,wood:1}:item==='armor'?{grass:3,wood:1}:{flint:1,twig:1};if(!affordable(s,cost))return fail(s,'修理材料不足');pay(s,cost);s.durability[item]=ITEMS[item].durability;say(s,ITEMS[item].name+' 已修复。');return{ok:true};
}
export function dismantle(s,id){
  const b=s.buildings.find(b=>b.id===id);if(s.status!=='playing'||!b||distance(s.player,b)>180)return fail(s,'走近设施后才能拆除');if(b.kitchen||b.baitAt)return fail(s,'请等待炖煮或诱捕完成');if(Object.values(b.inventory||{}).some(n=>n>0)||b.stored>0)return fail(s,'请先取空设施中的物品');const r=RECIPES.find(r=>r.building===b.type);const refund=Object.fromEntries(Object.entries(r.cost).filter(([k])=>Object.hasOwn(ITEMS,k)).map(([k,n])=>[k,Math.floor(n/2)]));give(s,refund);s.buildings=s.buildings.filter(x=>x.id!==id);say(s,'已拆除'+r.name+'，返还一半基础材料（向下取整）。',true);return{ok:true};
}
function manifest(s,b,item){const packs={wood:12,stone:10,ore:8,crystal:4,berry:8,grass:10,seed:6};if(s.level<6||b.type!=='forge'||!Object.hasOwn(packs,item))return fail(s,'需要塑能台');if(s.expansion.manifestCooldown>0)return fail(s,'塑能台还需 '+Math.ceil(s.expansion.manifestCooldown)+' 秒恢复');if(s.resonance<3)return fail(s,'需要 3 共鸣');s.resonance-=3;give(s,{[item]:packs[item]});s.expansion.manifestCooldown=5;say(s,'显化'+ITEMS[item].name+' ×'+packs[item]+'。');return{ok:true};}
export function chooseEnding(s,choice){if(s.status!=='playing'||s.level!==9||!['stay','return'].includes(choice)||s.expansion.ending)return fail(s,'尚未到达最终抉择');s.expansion.ending=choice;s.status='won';say(s,choice==='stay'?'你选择留下，做这片世界安静的守护者。':'你将经历归还星海，新的故事在远方醒来。',true);return{ok:true,won:true};}


function campAction(s,b,action){
  if(!['cookpot','trap'].includes(b.type))return fail(s,'这里不能进行这项操作');
  if(action==='collect'){
    const stock=Object.entries(b.inventory||{}).filter(([,n])=>n>0);if(!stock.length)return fail(s,'还没有可以领取的物品');
    for(const[id,n]of stock){const take=Math.min(n,9999-(s.inventory[id]||0));give(s,{[id]:take});b.inventory[id]-=take;}
    say(s,'已取出营地产物。');return{ok:true};
  }
  if(action==='bait'){
    if(b.type!=='trap'||b.baitAt||Object.values(b.inventory).some(n=>n>0))return fail(s,'请先收获，或等待诱捕完成');
    if(!s.inventory.berry)return fail(s,'需要 1 浆果作为诱饵');s.inventory.berry--;b.baitAt=s.time+60;say(s,'放好诱饵。60 秒后回来看看。');return{ok:true};
  }
  const dish=DISHES.find(d=>d.id===action.split(':')[1]);if(b.type!=='cookpot'||!dish)return fail(s,'未知烹饪配方');
  if(b.kitchen||Object.values(b.inventory).some(n=>n>0))return fail(s,'请等待当前炖煮完成并领取成品');
  if(!affordable(s,dish.cost))return fail(s,'烹饪材料不足');pay(s,dish.cost);b.kitchen={dish:dish.id,readyAt:s.time+dish.seconds};say(s,'开始炖煮，12 秒后即可领取。');return{ok:true};
}
export function craftBatch(s,id,count=1){
  if(!Number.isInteger(count)||count<1||count>5)return fail(s,'制作数量无效');
  const r=RECIPES.find(r=>r.id===id);if(!r||r.building||ITEMS[r.item]?.durability||ITEMS[r.item]?.unique)return fail(s,'这项配方不支持批量制作');
  const reason=recipeReason(s,r);if(reason)return fail(s,reason);
  if(!affordable(s,Object.fromEntries(Object.entries(r.cost).map(([k,n])=>[k,n*count]))))return fail(s,'批量制作材料不足');
  for(let i=0;i<count;i++)craft(s,id);say(s,'制作完成：'+r.name+' ×'+count);return{ok:true};
}
export function quickFuel(s){const b=s.buildings.filter(b=>b.type==='campfire'&&distance(b,s.player)<180).sort((a,b)=>distance(a,s.player)-distance(b,s.player))[0];return b?stationAction(s,'fuel',b.id):fail(s,'靠近营火后按 F 添柴');}
function validateWilderness(s,num){
  const w=s.wilderness;if(!w||!num(w.wetness,0,100)||!num(w.impactSeq)||!(w.pinned===null||RECIPES.some(r=>r.id===w.pinned)))throw new Error('荒野生存数据无效');
  for(const b of s.buildings){
    if(b.baitAt!==undefined&&(!num(b.baitAt)||b.type!=='trap'))throw new Error('诱捕进度无效');
    if(b.kitchen&& (b.type!=='cookpot'||!DISHES.some(d=>d.id===b.kitchen.dish)||!num(b.kitchen.readyAt)))throw new Error('烹饪进度无效');
  }
}
