// 由规则入口注入依赖，避免从远征模块加载时形成初始化循环。
let G;
export function bindSymbiosis(rules){G=rules;}
import {RIFT_REALMS,CO_ITEMS,CO_NODES,COMPANIONS,MODULES,ROUTES,RIFT_EVENTS} from './symbiosis-data.js';
export * from './symbiosis-data.js';
const own=(o,k)=>Object.hasOwn(o||{},k),clamp=(n,a=0,b=100)=>Math.min(b,Math.max(a,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fail=reason=>({ok:false,reason});
const say=(s,text)=>{s.message={id:++s.messageSeq,text};s.journal.unshift({day:G.day(s),text});s.journal=s.journal.slice(0,80);return{ok:true,reason:text};};
const fit=(bag,items)=>Object.entries(items).every(([k,n])=>(bag[k]||0)+n<=9999);
function give(bag,items){for(const[k,n]of Object.entries(items))bag[k]=(bag[k]||0)+n;}
function spend(s,cost){if(!G.craftAffordable(s,cost))return false;G.payCraft(s,cost);return true;}
export const inRift=s=>own(RIFT_REALMS,s.expedition?.current);
export const hasModule=(s,id)=>Object.values(s.symbiosis?.loadout||{}).some(list=>list.includes(id));
export const follows=(s,id)=>s.symbiosis?.following===id;
export function initSymbiosis(s){
 s.symbiosis??={sequence:0,nextSeed:null,deep:false,run:null,companions:{},following:null,unlocked:[],loadout:{gear:[],weapon:[],arms:[]},mail:{},history:[],projects:[],signals:[],endless:0,assistClock:0,facilityClock:0,tracked:null};
 return s.symbiosis;
}
export function riftGeometry(run){const offset=ROUTES[run.template].offset;return {zones:[{x:1200,y:1640},{x:1850,y:1090+offset},{x:2570,y:1630}],radius:300,road:110,points:[{x:1200,y:1640},{x:1320,y:1130+offset},{x:1850,y:1090+offset},{x:2470,y:1070+offset},{x:2570,y:1630}],shortcut:[{x:1200,y:1640},{x:1850,y:1670+offset/2},{x:2570,y:1630}]};}
function lineDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1);return dist(p,{x:a.x+dx*t,y:a.y+dy*t});}
const onPath=(p,list,width)=>list.slice(1).some((b,i)=>lineDistance(p,list[i],b)<=width);
export function highTide(s){return inRift(s)&&s.expedition.current==='tide'&&s.symbiosis.run.elapsed%90>=(s.symbiosis.run.weather==='扰动'?40:50);}
export function riftWalkable(s,x,y){if(!inRift(s))return true;const r=s.symbiosis?.run;if(!r)return false;const g=riftGeometry(r),p={x,y};return g.zones.some(q=>dist(p,q)<g.radius)||onPath(p,g.points,g.road)||onPath(p,g.shortcut,s.expedition.current==='tide'&&highTide(s)?38:85);}
export function createRiftMap(s,id){
 const e=initSymbiosis(s);let seed=e.nextSeed??((s.seed+Math.imul(e.sequence+1,2654435761))>>>0);e.nextSeed=null;e.sequence++;
 let rng=seed;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const events=RIFT_EVENTS.slice(id==='tide'?0:9,id==='tide'?9:18).map(x=>x.id);for(let i=events.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[events[i],events[j]]=[events[j],events[i]];}
 const r=e.run={id:e.sequence,realm:id,seed,template:seed%3,elapsed:0,deep:e.deep&&s.level===9,weather:random()<.5?'平静':'扰动',anchors:[false,false,false],switches:[[0,0,0],[0,0,0],[0,0,0]],hints:[0,0,0],choices:{},events:events.slice(0,3),guardian:false,reward:{blueprint:1},emergency:false};
 const map={nodes:[],buildings:[],creatures:[],explored:[],savedAt:s.time},g=riftGeometry(r);
 const add=(type,x,y,extra={})=>map.nodes.push({id:'co-'+id+'-'+map.nodes.length,type,x,y,hp:(CO_NODES[type]||G.NODES[type]).hp,available:true,respawnAt:0,...extra});
 add('wormhole',1120,1720,{destination:'home'});
 g.zones.forEach((p,i)=>{add('riftanchor',p.x,p.y-80,{anchor:i});add('riftevent',p.x+130,p.y+110,{eventId:r.events[i]});});
 for(let i=0;i<72;i++){const zone=g.zones[i%3],a=random()*Math.PI*2,rad=130+random()*140,x=zone.x+Math.cos(a)*rad,y=zone.y+Math.sin(a)*rad;if(map.nodes.some(n=>dist(n,{x,y})<55))continue;add([id==='tide'?'tidereed':'glowfungus','tree','rock','bush','grass','twig','flint','flower'][i%8],x,y);}
 const kinds=id==='tide'?['sandburrow','tidecaller','shellback','reedgrazer']:['sporebeetle','glowmoth','rootstalker','mosskeeper'];
 const spawn=(kind,x,y)=>map.creatures.push({id:'co-m'+map.creatures.length,kind,x,y,homeX:x,homeY:y,hp:G.CREATURES[kind].hp,cooldown:2,slow:0,stun:0,respawnAt:0,warning:null});
 for(let i=0;i<8;i++){const z=g.zones[1+i%2],a=i*2.399;spawn(kinds[i%4],z.x+Math.cos(a)*210,z.y+Math.sin(a)*210);}
 spawn(id==='tide'?'tideguardian':'sporeguardian',g.zones[2].x+40,g.zones[2].y-70);
 return map;
}
export function finishRift(s,from){
 const e=s.symbiosis,r=e?.run;if(!r||r.realm!==from)return;
 const solved=r.anchors.filter(Boolean).length,guardian=r.guardian||s.expedition.worlds[from]?.creatures.some(m=>G.CREATURES[m.kind]?.boss&&(m.pacified||m.hp<=0));
 const reward={};if(solved){reward.blueprint=solved;reward[from==='tide'?'tideglass':'sporepod']=solved*2;}
 // 战斗路线可以先处理守卫；没有完成观测点时也必须生成有效结算。
 if(guardian){reward.blueprint=(reward.blueprint||0)+2;reward.restoration=r.deep?3:1;}
 if(r.deep&&guardian){e.endless++;reward.blueprint+=2;}
 for(const[id,choice]of Object.entries(r.choices)){const o=RIFT_EVENTS.find(v=>v.id===id).options.find(v=>v.id===choice);give(reward,o.future);}
 // 奖励先进营地邮袋，满背包也不会吞掉；每次远征只结算一次。
 for(const[k,n]of Object.entries(reward))e.mail[k]=Math.min(9999,(e.mail[k]||0)+n);
 e.history.unshift({id:r.id,seed:r.seed,realm:r.realm,template:r.template,anchors:solved,guardian:!!guardian,deep:r.deep,emergency:r.emergency,elapsed:r.elapsed,choices:{...r.choices}});e.history=e.history.slice(0,30);
 delete s.expedition.worlds[from];e.run=null;e.deep=false;
 say(s,'远征归来 · 完成 '+solved+'/3 观测点'+(guardian?'，守卫已安定':'')+'。回营火领取图纸与事件回信。');
}
function nearCamp(s){return G.inHome(s)&&G.nearby(s,'campfire',220);}
export function puzzleTarget(r,index){const off=((r.seed>>>index)%3);return [0,1,2].map(i=>i===off?0:1);}
export function symbiosisAction(s,action,id='',value=''){
 const e=initSymbiosis(s);if(action!=='rescue'&&s.status!=='playing')return fail('先返回正在继续的旅程');
 if(action==='depart'){
  if(!own(RIFT_REALMS,id)||!nearCamp(s)||e.run)return fail('回原岛营火旁，结束当前远征后再出发');
  if(s.level<RIFT_REALMS[id].level)return fail('需要 '+RIFT_REALMS[id].level+' 级文明');
  if(Object.keys(e.mail).some(k=>e.mail[k]>9950))return fail('先领取营地邮袋中的奖励');
  const seed=value===''?null:Number(value);if(seed!==null&&(!Number.isInteger(seed)||seed<0||seed>4294967295))return fail('种子需要 0—4294967295 的整数');
  if(!spend(s,{wood:3,ration:1}))return fail('出发需要 3 木材、1 旅行口粮；返回不收取材料');
  e.nextSeed=seed;return G.enterRiftRealm(s,id);
 }
 if(action==='deep'){if(s.level!==9||e.run)return fail('九级且不在远征中时设置深层模式');e.deep=!e.deep;return say(s,e.deep?'深层远征已开启：扰动伤害加倍，额外图纸与纪念章。':'已切回普通远征。');}
 if(action==='rescue'){
  if(!inRift(s)||!e.run)return fail('仅在裂隙中使用紧急救援');const home=s.expedition.worlds.home;if(!home?.buildings.some(b=>b.type==='campfire'))return fail('原岛需要保留营火');
  e.run.emergency=true;for(const[k,n]of Object.entries(s.inventory))if(!G.ITEMS[k].durability&&!G.ITEMS[k].food&&!G.ITEMS[k].unique&&!['blueprint','restoration'].includes(k))s.inventory[k]-=Math.floor(n*(hasModule(s,'salvage')?.15:.3));
  s.status='playing';s.player.hp=Math.max(40,s.player.hp);s.player.hunger=Math.max(40,s.player.hunger);s.darkTime=0;return G.enterRiftRealm(s,'home');
 }
 if(action==='anchor-toggle'||action==='anchor-hint'||action==='anchor-check'||action==='pacify'||action==='event'){
  const r=e.run,n=s.nodes.find(n=>n.id===id);if(!inRift(s)||!r||!n||dist(n,s.player)>150)return fail('先走近对应远征地点');
  if(action==='event'){
   if(n.type!=='riftevent'||!r.events.includes(n.eventId)||own(r.choices,n.eventId))return fail('这段见闻已经做出选择');
   const option=RIFT_EVENTS.find(v=>v.id===n.eventId)?.options.find(v=>v.id===value);if(!option||!fit(s.inventory,option.drop)||!spend(s,option.cost))return fail('所需材料或背包空间不足');
   give(s.inventory,option.drop);s.ecology=clamp(s.ecology+option.eco);r.choices[n.eventId]=value;n.available=false;return say(s,option.name+'。后续回信将在返回原岛后送达。');
  }
  if(n.type!=='riftanchor'||!Number.isInteger(n.anchor))return fail('需要走近观测点');const i=n.anchor;
  if(action==='pacify'){
   if(i!==2||!r.anchors.every(Boolean))return fail('完成三个观测点，再来到第三处修复守卫');const m=s.expedition.creatures.find(m=>G.CREATURES[m.kind]?.boss);
   if(r.guardian||!m||m.hp<=0||m.pacified)return fail('守卫已经安定，不能重复领取');
   if(!spend(s,r.realm==='tide'?{tideglass:4,stone:3}:{sporepod:4,flower:3}))return fail('修复需要 4 专属材料及 3 石料（群岛）或荧光花（菌窟）');
   m.pacified=true;m.warning=null;r.guardian=true;return say(s,'守卫重新接入生态循环。回营结算与战斗路线相同。');
  }
  if(r.anchors[i])return fail('观测点已完成，不会重复奖励');
  if(action==='anchor-hint'){r.hints[i]=Math.min(3,r.hints[i]+1);return{ok:true};}
  if(action==='anchor-toggle'){const k=Number(value);if(!Number.isInteger(k)||k<0||k>2)return fail('未知阀门');r.switches[i][k]^=1;return{ok:true};}
  if(!r.switches[i].every((v,k)=>v===puzzleTarget(r,i)[k]))return fail('回路未连通。查看分层提示，再试一次；不扣材料。');
  r.anchors[i]=true;s.insight+=hasModule(s,'scanner')?6:4;s.ecology=clamp(s.ecology+2+(hasModule(s,'restore')?2:0));s.resonance=Math.min(100,s.resonance+2);return say(s,'观测点恢复 · 洞见与共鸣已记录，图纸回营统一领取。');
 }
 if(action==='recruit'){
  const d=COMPANIONS[id];if(!own(COMPANIONS,id)||!nearCamp(s)||s.level<d.level)return fail('在原岛营火旁达到对应等级后邀请伙伴');if(own(e.companions,id))return fail('伙伴已经加入');if(!spend(s,d.cost))return fail('邀请物资不足');
  e.companions[id]={job:false,clock:0,story:false,x:s.player.x+60,y:s.player.y+30,produced:0};return say(s,d.name+'接受邀请来到营地。你可以安排休息或随行。');
 }
 if(action==='follow'||action==='job'||action==='story'){
  const c=e.companions[id],d=COMPANIONS[id];if(!c||!d||!nearCamp(s))return fail('回原岛营火旁与伙伴商量');
  if(action==='follow'){if(e.following===id)e.following=null;else{if(e.following)e.companions[e.following].job=false;e.following=id;c.job=false;c.x=s.player.x+40;c.y=s.player.y+30;}return say(s,e.following?d.name+'与你同行。':'伙伴留在营地休息。');}
  if(action==='job'){if(s.level<5)return fail('五级后可以安排固定岗位');if(e.following===id)return fail('先结束随行，再安排岗位');if(!s.buildings.some(b=>b.type===d.station))return fail('先建造'+G.BUILDING_NAMES[d.station]);c.job=!c.job;return say(s,c.job?'已安排'+d.job+'，使用岗位库存；产物达到 20 后停止。':'岗位已暂停，已投入材料的任务留在原位。');}
  if(c.story)return fail('这段故事已经记入手册');if(!e.history.some(h=>h.anchors>0))return fail('先带回一段裂隙观测记录');if(!fit(s.inventory,{restoration:1})||!spend(s,d.storyCost))return fail('故事物资或背包空间不足');c.story=true;s.inventory.restoration=(s.inventory.restoration||0)+1;return say(s,d.storyText);
 }
 if(action==='module-unlock'||action==='module-equip'){
  const m=MODULES[id];if(!own(MODULES,id)||!nearCamp(s)||s.level<m.level)return fail('到原岛营火旁，并达到模块等级');
  if(action==='module-unlock'){if(e.unlocked.includes(id))return fail('模块图纸已掌握');if(!spend(s,m.cost))return fail('研发材料不足');e.unlocked.push(id);return say(s,'掌握模块：'+m.name);}
  if(!e.unlocked.includes(id))return fail('先研发该模块');const slots=e.loadout[m.slot];if(slots.includes(id)){e.loadout[m.slot]=slots.filter(x=>x!==id);return say(s,'已拆下'+m.name+'，图纸保留。');}if(slots.length>=2)return fail('同类最多两个模块，请先拆下一个');slots.push(id);return say(s,'已安装'+m.name+'。');
 }
 if(action==='claim'){
  if(!nearCamp(s))return fail('回原岛营火旁领取邮袋');let total=0;for(const[k,n]of Object.entries(e.mail)){const amount=Math.min(n,9999-(s.inventory[k]||0));if(amount){s.inventory[k]=(s.inventory[k]||0)+amount;e.mail[k]-=amount;total+=amount;}if(!e.mail[k])delete e.mail[k];}return total?say(s,'已领取远征奖励与回信。'):fail('邮袋为空，或背包已满');
 }
 if(action==='supply'||action==='collect'){
  const b=s.buildings.find(b=>b.id===id);if(!b||dist(b,s.player)>180||![...Object.values(COMPANIONS).map(v=>v.station),'purifier','tidewell'].includes(b.type))return fail('先走近伙伴岗位或生态设施');b.inventory??={};
  if(action==='supply'){const recipe=Object.values(COMPANIONS).find(v=>v.station===b.type)?.input||(b.type==='purifier'?{sporepod:1}:{wood:1});if(!fit(b.inventory,recipe)||!spend(s,recipe))return fail('投入材料不足或岗位已满');give(b.inventory,recipe);return say(s,'已投入一批材料；暂停和离线时不生产。');}
  let total=0;for(const[k,n]of Object.entries(b.inventory)){const take=Math.min(n,9999-(s.inventory[k]||0));if(take){give(s.inventory,{[k]:take});b.inventory[k]-=take;total+=take;}}return total?say(s,'已领取岗位库存。'):fail('库存为空或背包已满');
 }
 if(action==='project'){
  if(!nearCamp(s)||s.level<7||!['water','spores'].includes(id))return fail('七级后回原岛营火开展修复项目');if(e.projects.includes(id))return fail('该项目已完成');const type=id==='water'?'tidewell':'purifier';if(!s.buildings.some(b=>b.type===type))return fail('先建造'+G.BUILDING_NAMES[type]);const cost=id==='water'?{tideglass:8,watercrop:4}:{sporepod:8,seed:4};if(!e.history.some(h=>h.realm===(id==='water'?'tide':'fungus')&&h.anchors===3)||!spend(s,cost))return fail('先完成对应裂隙三个观测点，并备齐修复物资');e.projects.push(id);e.mail.restoration=(e.mail.restoration||0)+2;s.ecology=clamp(s.ecology+12);return say(s,'修复项目完成。原岛留下共生花带，邮袋收到 2 纪念章。');
 }
 if(action==='signal'){
  if(!nearCamp(s)||s.level<8||!['home','verdant','cinder','frost','mirror','orbit'].includes(id))return fail('八级后回营地协调六地请求');if(e.signals.includes(id))return fail('该营地已完成协调');if(!own(s.odyssey.contacts,id)||e.projects.length<2)return fail('先取得当地营地同意，并完成两项修复项目');const care=value==='care',cost=care?{sporepod:2,watercrop:2}:{tideglass:2,board:2};if(!['care','craft'].includes(value)||!spend(s,cost))return fail('援助方式或材料不足');e.signals.push(id);e.mail.blueprint=(e.mail.blueprint||0)+2;if(e.signals.length===6)e.mail.restoration=(e.mail.restoration||0)+3;return say(s,'已按对方意愿送出'+(care?'生态物资':'工程物资')+'。');
 }
 return fail('未知共生行动');
}
export function stepSymbiosis(s,dt){
 const e=s.symbiosis;if(!e)return;
 if(inRift(s)&&e.run){const r=e.run;r.elapsed+=dt;const g=riftGeometry(r);const zone=g.zones.findIndex(p=>dist(p,s.player)<300);
  if(r.realm==='tide'&&highTide(s)&&onPath(s.player,g.shortcut,85)&&!onPath(s.player,g.points,g.road)&&zone<0)s.wilderness.wetness=clamp(s.wilderness.wetness+dt*(hasModule(s,'waterproof')?.4:2));
  if(r.realm==='fungus'&&zone>0&&!r.anchors[zone]){s.player.clarity=clamp(s.player.clarity-dt*.1);s.player.hp=Math.max(0,s.player.hp-dt*.12*(follows(s,'botanist')?.5:1)*(r.deep?2:r.weather==='扰动'?1.3:1));}
  // 涨潮不会将站在浅滩上的角色困住；移至同段永久高架路。
  if(!riftWalkable(s,s.player.x,s.player.y)){let point=g.points.reduce((a,b)=>dist(a,s.player)<dist(b,s.player)?a:b);s.player.x=point.x;s.player.y=point.y;s.path=[];s.target=null;}
 }
 for(const[id,c]of Object.entries(e.companions)){
  const d=COMPANIONS[id],following=e.following===id;if(!following&&!G.inHome(s))continue;
  const station=s.buildings.find(b=>b.type===d.station),camp=s.buildings.find(b=>b.type==='campfire'),rest=G.phase(s)==='night',target=following?{x:s.player.x-55,y:s.player.y+25}:rest?camp:station||camp;
  if(target){const distance=dist(c,target);if(distance>35){const step=Math.min(distance-35,dt*155);const x=c.x+(target.x-c.x)/distance*step,y=c.y+(target.y-c.y)/distance*step;if(G.walkable(s,x,y)){c.x=x;c.y=y;}else if(following&&distance>500){c.x=s.player.x-25;c.y=s.player.y;}}}
  if(!following&&c.job&&!rest&&station&&dist(c,station)<100){station.inventory??={};const bag=station.inventory;
   if(station.coTask){station.coTask.remaining=Math.max(0,station.coTask.remaining-dt);if(!station.coTask.remaining&&fit(bag,d.output)){give(bag,d.output);if(id==='engineer'){const tool=['axe','pickaxe',G.equippedWeapon(s)].find(k=>s.inventory[k]&&s.durability[k]<G.ITEMS[k].durability);if(tool)s.durability[tool]=Math.min(G.ITEMS[tool].durability,s.durability[tool]+20);}station.coTask=null;c.produced++;}continue;}
   const output=Object.keys(d.output)[0];if(output&&(bag[output]||0)>=20)continue;if(!output&&!['axe','pickaxe',G.equippedWeapon(s)].some(k=>s.inventory[k]&&s.durability[k]<G.ITEMS[k].durability))continue;
   if(Object.entries(d.input).every(([k,n])=>(bag[k]||0)>=n)&&fit(bag,d.output)){for(const[k,n]of Object.entries(d.input))bag[k]-=n;station.coTask={companion:id,remaining:20};}
  }
 }
 e.assistClock+=dt;const interval=hasModule(s,'partner')?20:30;if(e.assistClock>=interval){e.assistClock=0;
  if(follows(s,'keeper')&&s.player.hp<G.maxHealth(s)&&(s.inventory.berry||0)>0){s.inventory.berry--;s.player.hp=Math.min(G.maxHealth(s),s.player.hp+5);}
  if(follows(s,'engineer')){const k=G.equippedWeapon(s);if(k&&s.durability[k]<G.ITEMS[k].durability&&(s.inventory.flint||0)>0){s.inventory.flint--;s.durability[k]=Math.min(G.ITEMS[k].durability,s.durability[k]+8);}}
 }
 e.facilityClock+=dt;if(e.facilityClock>=20){e.facilityClock=0;const r=e.run;if(r&&inRift(s))for(const b of s.buildings){const correct=r.realm==='tide'?'tidewell':'purifier',item=r.realm==='tide'?'wood':'sporepod';if(b.type!==correct||!(b.inventory?.[item]>0))continue;const i=riftGeometry(r).zones.findIndex(z=>dist(z,b)<300);if(i>=0&&!r.anchors[i]){b.inventory[item]--;r.anchors[i]=true;s.insight+=4;s.resonance=Math.min(100,s.resonance+2);}}}
}
export function validateSymbiosis(s,num){
 const e=s.symbiosis,integer=(v,min=0,max=1e9)=>Number.isInteger(v)&&num(v,min,max),list=(a,valid,max)=>Array.isArray(a)&&a.length<=max&&new Set(a).size===a.length&&a.every(v=>valid.includes(v));
 if(!e||!integer(e.sequence)||!(e.nextSeed===null||integer(e.nextSeed,0,4294967295))||typeof e.deep!=='boolean'||!num(e.assistClock,0,30)||!num(e.facilityClock,0,20))throw Error('共生远征进度无效');
 if(!e.companions||Array.isArray(e.companions)||Object.entries(e.companions).some(([k,c])=>!own(COMPANIONS,k)||typeof c.job!=='boolean'||typeof c.story!=='boolean'||!num(c.x,0,3600)||!num(c.y,0,2800)||!integer(c.produced)||!num(c.clock)))throw Error('伙伴进度无效');
 if(e.following!==null&&!own(e.companions,e.following))throw Error('随行伙伴无效');
 if(!list(e.unlocked,Object.keys(MODULES),12)||!e.loadout||['gear','weapon','arms'].some(k=>!list(e.loadout[k],e.unlocked.filter(id=>MODULES[id].slot===k),2)))throw Error('模块装配无效');
 if(!e.mail||Array.isArray(e.mail)||Object.entries(e.mail).some(([k,n])=>!own(G.ITEMS,k)||!integer(n,0,9999))||!list(e.projects,['water','spores'],2)||!list(e.signals,['home','verdant','cinder','frost','mirror','orbit'],6)||!integer(e.endless))throw Error('共建记录无效');
 const choices=(o,events)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,v])=>events.includes(k)&&RIFT_EVENTS.find(e=>e.id===k)?.options.some(q=>q.id===v));
 if(!Array.isArray(e.history)||e.history.length>30||e.history.some(h=>!integer(h.id,1,e.sequence)||!integer(h.seed,0,4294967295)||!own(RIFT_REALMS,h.realm)||!integer(h.template,0,2)||!integer(h.anchors,0,3)||typeof h.guardian!=='boolean'||typeof h.deep!=='boolean'||typeof h.emergency!=='boolean'||!num(h.elapsed)||!choices(h.choices,RIFT_EVENTS.map(v=>v.id))))throw Error('远征历史无效');
 if(e.run){const r=e.run;if(!inRift(s)||r.realm!==s.expedition.current||!integer(r.id,1,e.sequence)||!integer(r.seed,0,4294967295)||!integer(r.template,0,2)||!num(r.elapsed)||typeof r.deep!=='boolean'||typeof r.guardian!=='boolean'||typeof r.emergency!=='boolean'||!['平静','扰动'].includes(r.weather)||!Array.isArray(r.anchors)||r.anchors.length!==3||r.anchors.some(v=>typeof v!=='boolean')||!Array.isArray(r.switches)||r.switches.length!==3||r.switches.some(a=>!Array.isArray(a)||a.length!==3||a.some(v=>v!==0&&v!==1))||!Array.isArray(r.hints)||r.hints.length!==3||r.hints.some(v=>!integer(v,0,3))||!list(r.events,RIFT_EVENTS.filter((_,i)=>r.realm==='tide'?i<9:i>=9).map(v=>v.id),3)||r.events.length!==3||!choices(r.choices,r.events))throw Error('裂隙快照无效');
  for(const n of s.nodes)if(n.type==='riftanchor'&&!integer(n.anchor,0,2)||n.type==='riftevent'&&!r.events.includes(n.eventId))throw Error('裂隙地点无效');
 }else if(inRift(s))throw Error('缺少裂隙快照');
 for(const map of [s,...Object.values(s.expedition.worlds)])for(const b of map.buildings)if(b.coTask){const c=b.coTask;if(!own(COMPANIONS,c.companion)||COMPANIONS[c.companion].station!==b.type||!own(e.companions,c.companion)||!num(c.remaining,0,20))throw Error('伙伴工作订单无效');}
}
