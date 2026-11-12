import {terrainPush,boarKnockback} from './terrain-impact.js';
import {interruptNightAttack} from './night-creatures.js';
import {RIFT_REALMS,CO_CREATURES} from './symbiosis-data.js';
import {createRiftMap,finishRift,hasModule,follows} from './symbiosis.js';
import {NEW_REALMS,NEW_CREATURES,NEW_WEAPONS,NEW_ITEMS} from './odyssey-data.js';
// 裂隙远征：区域状态独立保存，世界只推进当前地图的时间。
export const REALMS = {
 home:{name:'苔湾原岛',subtitle:'把荒野变成家',level:1,color:'#9ead81',temperature:0,tip:'九级主线与六处遗迹仍在原岛。东边的虫洞通往新的荒野。'},
 verdant:{name:'苔痕林海',subtitle:'树冠之下，万物有声',level:1,color:'#70a98b',temperature:-2,tip:'林猪会冲撞，织网蛛会远程吐丝。用弓保持距离，收集兽牙与蛛丝。'},
 cinder:{name:'烬岩荒原',subtitle:'熄灭的山脉仍在呼吸',level:2,color:'#cc8964',temperature:12,tip:'岩甲兽惧怕钝击，余烬灵惧怕霜晶。庇护所和鱼汤适合炎热远征。'},
 frost:{name:'霜月冻土',subtitle:'雪地里的每一步都有回声',level:3,color:'#9ac6d9',temperature:-14,tip:'霜狼扑击前会蓄势，冰壳蟹披着厚甲。备好披肩、火炬与鱼汤再出发。'}
};
Object.assign(REALMS,NEW_REALMS,RIFT_REALMS);
export const EXPEDITION_ITEMS = {
 bandage:{name:'蛛丝绷带',icon:'silk',health:35},fang:{name:'兽牙',icon:'fang'},silk:{name:'蛛丝',icon:'silk'},shell:{name:'岩甲',icon:'shell'},ember:{name:'余烬核',icon:'ember'},frostshard:{name:'霜晶',icon:'frostshard'},riftcore:{name:'裂隙之心',icon:'riftcore'},
 arrow:{name:'箭矢',icon:'arrow'},bow:{name:'林语弓',icon:'bow',durability:100},hammer:{name:'碎岩锤',icon:'hammer',durability:120},frostSpear:{name:'霜晶长矛',icon:'frostSpear',durability:150},emberStaff:{name:'余烬法杖',icon:'emberStaff',durability:120}
};
Object.assign(EXPEDITION_ITEMS,NEW_ITEMS);
export const WEAPONS = {
 spear:{damage:20,range:105,cooldown:.55,kind:'pierce',text:'均衡的近战武器'},
 copperSpear:{damage:30,range:115,cooldown:.55,kind:'pierce',text:'更高伤害的近战长矛'},
 bow:{damage:19,range:350,cooldown:.7,kind:'pierce',ammo:'arrow',text:'每次射击消耗 1 箭矢；远距离攻击单个目标'},
 hammer:{damage:27,range:100,cooldown:.95,kind:'blunt',area:100,text:'近身横扫；克制岩甲与冰壳，短暂打断蓄力'},
 frostSpear:{damage:31,range:145,cooldown:.65,kind:'frost',text:'命中减速 2 秒；克制余烬灵'},
 emberStaff:{damage:34,range:290,cooldown:1,kind:'fire',area:85,ammo:'ember',text:'每次消耗 1 余烬核；在目标处爆裂，克制霜狼与织网蛛'}
};
Object.assign(WEAPONS,NEW_WEAPONS);
export const EXPEDITION_RECIPES = [
 {id:'bow',name:'林语弓',category:'weapons',cost:{wood:5,grass:8,twig:4},item:'bow',desc:'射程 350 步。每次消耗 1 箭矢，适合在冲锋前拉开距离。'},
 {id:'arrow',name:'箭矢束',category:'weapons',cost:{twig:2,flint:1},item:'arrow',count:8,desc:'一次制作 8 支箭。箭矢用尽时无法射击。'},
 {id:'hammer',name:'碎岩锤',category:'weapons',cost:{stone:12,wood:4,fang:2},item:'hammer',desc:'慢速横扫与短暂眩晕。对岩甲兽和冰壳蟹伤害翻倍。'},
 {id:'frostSpear',name:'霜晶长矛',category:'weapons',cost:{frostshard:5,ingot:2,silk:3},item:'frostSpear',tech:'smelting',desc:'射程 145 步，命中减速。对余烬灵造成双倍伤害。'},
 {id:'emberStaff',name:'余烬法杖',category:'weapons',cost:{ember:6,wood:5,riftcore:1},item:'emberStaff',desc:'远程范围攻击，单次消耗 1 余烬核。需要击败一名区域守卫取得裂隙之心。'},
 {id:'silkBandage',name:'蛛丝绷带',category:'survival',cost:{silk:2,flower:1},item:'bandage',desc:'用蛛丝与荧光花制作绷带，恢复生命。'}
];
export const EXPEDITION_NODES = {
 wormhole:{name:'裂隙虫洞',hp:1,time:0,drop:{}},
 emberstone:{name:'余烬矿',tool:'pickaxe',hp:4,time:.7,drop:{ember:3,stone:2},regrow:360},
 froststone:{name:'霜晶矿',tool:'pickaxe',hp:4,time:.7,drop:{frostshard:3,stone:2},regrow:360}
};
export const CREATURES = {
 boar:{name:'苔角林猪',hp:60,damage:12,speed:70,range:170,windup:.85,cooldown:2.4,kind:'charge',weak:'pierce',drop:{meat:2,fang:1},color:'#9d8b60',tip:'冲锋方向在蓄力时锁定，侧移躲开后反击。'},
 spider:{name:'织网蛛',hp:42,damage:8,speed:48,range:250,windup:1.1,cooldown:2.8,kind:'ranged',weak:'fire',drop:{silk:3},color:'#b292a6',tip:'蛛网落点会提前显现，走出圆圈可以避开减速。'},
 rockling:{name:'岩甲兽',hp:110,damage:17,speed:40,range:90,windup:1.1,cooldown:2.7,kind:'slam',weak:'blunt',armor:true,drop:{shell:2,ore:3},color:'#b5a28a',tip:'岩甲抵挡穿刺，碎岩锤能击穿护甲并打断蓄力。'},
 emberling:{name:'余烬灵',hp:65,damage:13,speed:55,range:270,windup:1.2,cooldown:2.7,kind:'ranged',weak:'frost',drop:{ember:4},color:'#e3a16d',tip:'远程火点在地面预警；霜晶命中后减速并造成双倍伤害。'},
 frostwolf:{name:'霜尾狼',hp:84,damage:15,speed:95,range:200,windup:.85,cooldown:2.3,kind:'charge',weak:'fire',drop:{fur:2,fang:2},color:'#a8d8df',tip:'速度很快，横向闪避蓄力扑击；火焰是它的弱点。'},
 icecrab:{name:'冰壳蟹',hp:120,damage:18,speed:38,range:110,windup:1.3,cooldown:3,kind:'slam',weak:'blunt',armor:true,drop:{frostshard:3,shell:1},color:'#a3bde0',tip:'慢速重甲守卫。绕开砸地预警，用钝击破壳。'},
 mosswarden:{name:'苔冠守卫',hp:240,damage:22,speed:48,range:160,windup:1.5,cooldown:3.2,kind:'slam',weak:'fire',boss:true,drop:{riftcore:1,silk:6,fang:4},color:'#82ae7e',tip:'大范围砸地前蓄力明显，留出撤退空间，勿在墙角交战。'},
 cinderwarden:{name:'烬岩守卫',hp:300,damage:25,speed:40,range:210,windup:1.6,cooldown:3.4,kind:'slam',weak:'frost',boss:true,drop:{riftcore:1,ember:12,shell:5},color:'#d59971',tip:'岩环蓄力期间退出警示圈，霜晶武器可缩短战斗。'},
 frostwarden:{name:'霜月守卫',hp:320,damage:24,speed:65,range:240,windup:1.5,cooldown:3.2,kind:'charge',weak:'fire',boss:true,drop:{riftcore:2,frostshard:12,fur:5},color:'#b5d8e4',tip:'长距离冲锋会锁定落点，侧向躲避，再用火焰反击。'}
};
Object.assign(CREATURES,NEW_CREATURES,CO_CREATURES);
export function creatureProfile(m){const d=CREATURES[m.kind];if(!d?.phases)return d;const phase=Math.min(2,Math.floor((1-Math.max(0,m.hp)/d.hp)*3));return{...d,phase,kind:d.phases[phase],weak:(d.phaseWeak||(m.kind==='prismwarden'?['blunt','frost','fire']:['energy','blunt','frost']))[phase],windup:d.windup*(phase===2?.9:1),cooldown:d.cooldown*(phase===2?.8:1)};}
export function warningHits(w,p){if(w.kind==='beam'){const dx=w.x-w.ox,dy=w.y-w.oy,len=Math.hypot(dx,dy)||1,t=((p.x-w.ox)*dx+(p.y-w.oy)*dy)/(len*len);return t>=0&&t<=1&&Math.abs((p.x-w.ox)*dy-(p.y-w.oy)*dx)/len<w.radius;}const d=dist(p,w);return d<w.radius&&d>=(w.innerRadius||0);}
export function realm(s){return REALMS[s.expedition?.current||'home'];}
export const inHome=s=>(s.expedition?.current||'home')==='home';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const portal=(id,x,y,destination)=>({id,type:'wormhole',x,y,destination,hp:1,available:true,respawnAt:0});
export function portalsFor(id){
 const routes=id==='home'?[['verdant',1680,1560],['cinder',2210,1220],['frost',2850,820],['mirror',2370,2050],['orbit',3000,1730]]:[['home',1180,1640],...(id==='verdant'?[['cinder',2650,1380]]:id==='cinder'?[['frost',2650,1380],['mirror',2550,2050]]:id==='mirror'?[['orbit',2650,1380]]:[])];
 return routes.map(([to,x,y])=>portal('rift-'+to,x,y,to));
}
export function initExpedition(s){
 if(!s.expedition)s.expedition={current:'home',worlds:{},visited:['home'],equipped:null,kills:{},bosses:[],crossings:0,cooldown:0,dodgeCooldown:0,invulnerable:0,slowed:0,creatures:[]};
 if(Object.hasOwn(RIFT_REALMS,s.expedition.current))return;
 for(const n of portalsFor(s.expedition.current))if(!s.nodes.some(x=>x.id===n.id))s.nodes.push(n);
}
function createRealm(s,id,nodes,isLand){
 if(Object.hasOwn(RIFT_REALMS,id))return createRiftMap(s,id);
 let seed=(s.seed+Object.keys(REALMS).indexOf(id)*1234567)>>>0;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const result={nodes:portalsFor(id),buildings:[],explored:[],creatures:[],savedAt:s.time};
 const add=(type,x,y)=>result.nodes.push({id:id+'-n'+result.nodes.length,type,x,y,hp:nodes[type].hp,available:true,respawnAt:0});
 const counts={tree:id==='verdant'?120:45,rock:40,grass:45,twig:32,flint:30,bush:32,flower:24,mushroom:20,ore:25,crystal:16,pond:5,burrow:6,...(id==='cinder'?{emberstone:24}:id==='frost'?{froststone:24}:id==='mirror'?{tree:30,mirrorsand:30,meteor:12}:id==='orbit'?{tree:25,starroot:30,lumen:18,meteor:20}:{})};
 for(const[type,count]of Object.entries(counts))for(let i=0;i<count;i++)for(let attempt=0;attempt<300;attempt++){
  const x=320+rnd()*2920,y=350+rnd()*2050;
  if(!isLand(x,y)||dist({x,y},{x:1260,y:1640})<130||result.nodes.some(n=>dist(n,{x,y})<58))continue;
  add(type,x,y);break;
 }
 // 入口有明确补给，回程虫洞永不消耗材料。
 for(const [type,x,y]of[['bush',1380,1630],['twig',1320,1750],['grass',1410,1760],['flint',1140,1780]])add(type,x,y);
 const kinds=({verdant:['boar','spider'],cinder:['rockling','emberling'],frost:['frostwolf','icecrab'],mirror:['sandskitter','prismMoth'],orbit:['sentinel','voidRay']})[id];
 const spawn=(kind,x,y)=>result.creatures.push({id:id+'-m'+result.creatures.length,kind,x,y,homeX:x,homeY:y,hp:CREATURES[kind].hp,cooldown:1,slow:0,stun:0,respawnAt:0,warning:null});
 for(let i=0;i<18;i++)for(let a=0;a<150;a++){const x=500+rnd()*2500,y=550+rnd()*1700;if(!isLand(x,y)||dist({x,y},{x:1260,y:1640})<460||result.creatures.some(m=>dist(m,{x,y})<210)||result.nodes.filter(n=>n.type==='wormhole').some(n=>dist(n,{x,y})<200))continue;spawn(kinds[i%2],x,y);break;}
 spawn({verdant:'mosswarden',cinder:'cinderwarden',frost:'frostwarden',mirror:'prismwarden',orbit:'orbitwarden'}[id],2380,1950);
 return result;
}
export function portalReason(s,n){if(s.status!=='playing')return'旅程已结束';if(!n||n.type!=='wormhole'||!REALMS[n.destination])return'虫洞不存在';if(dist(s.player,n)>110)return'走近虫洞后才能穿越';if(s.expedition.cooldown>0)return'等待裂隙稳定 '+Math.ceil(s.expedition.cooldown)+' 秒';if(s.level<REALMS[n.destination].level)return'需要 '+REALMS[n.destination].level+' 级文明';return'';}
export function travel(s,id,{nodes,isLand,say}){
 if(s.rural?.visit)return{ok:false,reason:'先离开聚落内部，再穿越虫洞'};
 const n=s.nodes.find(n=>n.id===id),reason=portalReason(s,n);if(reason)return{ok:false,reason};
 return switchRealm(s,n.destination,{nodes,isLand,say});
}
export function switchRealm(s,to,{nodes,isLand,say}){
 const e=s.expedition,from=e.current;
 e.worlds[from]={nodes:s.nodes,buildings:s.buildings,explored:s.explored,creatures:e.creatures,savedAt:s.time};
 const next=e.worlds[to]||createRealm(s,to,nodes,isLand);delete e.worlds[to];
 // 不在场的区域暂停；进入时平移全部计时，防止反复穿越刷产物。
 const gap=Math.max(0,s.time-next.savedAt);
 for(const n of next.nodes)if(n.respawnAt)n.respawnAt+=gap;
 for(const b of next.buildings){for(const k of ['readyAt','productionAt','workingUntil','baitAt'])if(b[k])b[k]+=gap;if(b.kitchen)b.kitchen.readyAt+=gap;if(b.crop)b.crop.readyAt+=gap;}
 for(const m of next.creatures){if(m.respawnAt)m.respawnAt+=gap;m.warning=null;}
 s.nodes=next.nodes;s.buildings=next.buildings;s.explored=next.explored;e.creatures=next.creatures;e.current=to;e.crossings++;e.cooldown=3;e.invulnerable=3;
 if(!e.visited.includes(to)){e.visited.push(to);s.insight+=5;}
 const exit=to==='home'?s.nodes.find(n=>n.destination===from):s.nodes.find(n=>n.destination==='home');
 s.player.x=(exit?.x||1180)+75;s.player.y=(exit?.y||1640)+20;
 s.enemies=[];s.nightEncounter=null;s.action=null;s.channel=null;s.target=null;s.path=[];s.request=null;s.fx=[];s.wilderness.particles=[];
 if(Object.hasOwn(RIFT_REALMS,from)&&to==='home')finishRift(s,from);
 if(s.symbiosis?.following){const c=s.symbiosis.companions[s.symbiosis.following];c.x=s.player.x-30;c.y=s.player.y+20;}
 say(s,'抵达「'+REALMS[to].name+'」。营地与探索记录已保存。',true);return{ok:true,teleported:true,traveled:true};
}
const eRealm=s=>s.expedition.current;
export function equippedWeapon(s){const e=s.expedition?.equipped;if(e&&s.inventory[e]&&s.durability[e]>0)return e;return ['copperSpear','spear'].find(k=>s.inventory[k]&&s.durability[k]>0)||null;}
export function effectiveWeapon(s,id){const base=WEAPONS[id];if(!base)return null;const spec=s.homestead?.specialty[id];const w={...base,...(id==='bow'?(spec==='steady'?{damage:25,range:410,cooldown:.95}:spec==='rapid'?{damage:15,cooldown:.5}:{}):id==='hammer'?(spec==='stagger'?{damage:23}:spec==='crack'?{damage:35,area:65,cooldown:1.2}:{}):{})};return{...w,damage:w.damage*(hasModule(s,'precision')?1.15:1),cooldown:w.cooldown*(hasModule(s,'precision')?1.1:1),range:w.range*(hasModule(s,'reach')?1.15:1),...(w.power?{power:w.power*(hasModule(s,'capacitor')?.75:1)}:{})};}
export function equip(s,id){if(s.status!=='playing'||!WEAPONS[id]||!s.inventory[id]||!s.durability[id])return{ok:false,reason:'这件武器暂时无法使用'};s.expedition.equipped=id;return{ok:true};}
export function expeditionAttack(s,{give,say,walkable}){
 if(s.status!=='playing'||s.attackCooldown>0)return{ok:false};
 const id=equippedWeapon(s),w=effectiveWeapon(s,id)||{damage:5,range:85,cooldown:.6,kind:'blunt'};
 // 翻滚后的短窗口只允许一次近战突进；不能穿越海岸，也不刷新无敌或冷却。
 const combo=!!(id&&!w.ammo&&w.range<200&&s.expedition.rollCombo?.until>=s.time&&walkable);
 const origin={x:s.player.x,y:s.player.y};
 if(combo){const roll=s.expedition.rollCombo;for(let i=0;i<6;i++){const x=s.player.x+roll.dx*10,y=s.player.y+roll.dy*10;if(!walkable(s,x,y))break;s.player.x=x;s.player.y=y;}}
 s.expedition.rollCombo=null;
 const candidates=[...s.expedition.creatures.filter(m=>m.hp>0&&!m.pacified),...s.enemies].filter(m=>dist(m,s.player)<=w.range).sort((a,b)=>dist(a,s.player)-dist(b,s.player));
 if(!candidates.length){s.attackCooldown=.25;s.swingUntil=s.time+.2;return{ok:false,reason:'攻击范围内没有目标'};}
 if(w.power&&(s.odyssey?.power||0)<w.power&&!s.odyssey?.creative)return{ok:false,reason:'便携晶能不足，使用晶能电池或换回普通武器'};
 if(w.ammo&&!s.inventory[w.ammo])return{ok:false,reason:'缺少'+EXPEDITION_ITEMS[w.ammo].name};
 if(w.ammo)s.inventory[w.ammo]--;if(w.power&&s.odyssey&&!s.odyssey.creative)s.odyssey.power=Math.max(0,s.odyssey.power-w.power);
 s.attackCooldown=w.cooldown;s.swingUntil=s.time+.25;
 const main=candidates[0],targets=w.area?candidates.filter(m=>dist(m,main)<=w.area):[main];
 s.expedition.shot={x:s.player.x,y:s.player.y-30,tx:main.x,ty:main.y-25,at:s.time,until:s.time+.42,duration:.42,kind:w.kind,weapon:id,combo,origin,label:combo?'翻滚突进 · 双倍伤害':['bow','prismBow'].includes(id)?'远程命中':id==='hammer'?'钝击 · 打断':w.kind==='frost'?'霜晶 · 减速':''};
 for(const m of targets){const d=creatureProfile(m),mult=d?.weak===w.kind?2:d?.armor&&w.kind==='pierce'?(d.behavior==='armor'&&m.cooldown>1?.85:.55):1;const damage=Math.round(w.damage*mult*(combo?2:1));m.hp-=damage;interruptNightAttack(s,m);
  if(d){if(d.phases&&d.phase!==creatureProfile(m).phase){m.warning=null;m.cooldown=1.5;say(s,d.name+'进入第 '+(creatureProfile(m).phase+1)+' 阶段，攻击与弱点已改变。');}if(w.kind==='frost')m.slow=2;if(w.kind==='blunt'&&id==='hammer'){m.stun=s.homestead?.specialty.hammer==='stagger'?1.2:.6;m.warning=null;}m.alert=4;}
  s.fx.push({x:m.x,y:m.y,at:s.time,text:(mult>1?'克制 ':'')+'−'+damage});
  if(m.hp<=0){s.stats.defeated++;s.insight+=d?.boss?8:2;if(d){give(s,d.drop);s.expedition.kills[m.kind]=(s.expedition.kills[m.kind]||0)+1;m.warning=null;m.respawnAt=d.boss||Object.hasOwn(RIFT_REALMS,eRealm(s))?0:s.time+240;if(d.boss&&!s.expedition.bosses.includes(m.kind))s.expedition.bosses.push(m.kind);say(s,'击败'+d.name+' · '+Object.entries(d.drop).map(([key,n])=>(EXPEDITION_ITEMS[key]?.name||({meat:'生肉',fur:'毛皮',ore:'铜矿'}[key]||key))+' ×'+n).join('、'),d.boss);}else say(s,'夜影消散 · 洞见 +2');}
 }
 if(id){s.durability[id]--;if(s.durability[id]<=0){s.inventory[id]=0;s.expedition.equipped=null;say(s,'武器损坏，请返回营地重新制作。');}}
 s.enemies=s.enemies.filter(e=>e.hp>0);return{ok:true};
}
export function dodge(s,dx,dy,walkable){
 const e=s.expedition;if(s.status!=='playing'||e.dodgeCooldown>0||s.player.hunger<3)return{ok:false,reason:'闪避需要 3 饱食，并有 3 秒冷却'};
 const length=Math.hypot(dx,dy);if(!length){dx=0;dy=s.player.face||1;}else{dx/=length;dy/=length;}
 let moved=false;for(let i=0;i<12;i++){if(!walkable(s,s.player.x+dx*10,s.player.y+dy*10))break;s.player.x+=dx*10;s.player.y+=dy*10;moved=true;}
 if(!moved)return{ok:false,reason:'前方无法闪避'};s.player.hunger-=3;e.invulnerable=.65;e.dodgeCooldown=3;e.rollCombo={dx,dy,until:s.time+.55};s.action=null;s.channel=null;s.path=[];s.target=null;return{ok:true};
}
export function stepExpedition(s,dt,walkable){
 const e=s.expedition;for(const k of ['cooldown','dodgeCooldown','invulnerable','slowed'])e[k]=Math.max(0,e[k]-dt);
 for(const m of e.creatures){const d=creatureProfile(m);if(m.pacified)continue;if(m.hp<=0){if(m.respawnAt&&s.time>=m.respawnAt){m.hp=d.hp;m.x=m.homeX;m.y=m.homeY;m.respawnAt=0;m.warning=null;m.cooldown=2;}continue;}
  m.cooldown=Math.max(0,m.cooldown-dt);m.slow=Math.max(0,m.slow-dt);m.stun=Math.max(0,m.stun-dt);m.alert=Math.max(0,(m.alert||0)-dt);if(m.stun)continue;
  if(m.warning){m.warning.left-=dt;if(m.warning.left<=0){const w=m.warning;m.warning=null;
    let blockedCharge=false;
    if((w.kind||d.kind)==='charge'&&m.kind==='boar'){const impact=terrainPush(s,m,w,walkable);blockedCharge=impact.blocked;if(impact.tree){m.stun=2;s.fx.push({x:m.x,y:m.y,at:s.time,text:'撞树硬直 · 2秒'});}}
    else if((w.kind||d.kind)==='charge'&&walkable(s,w.x,w.y)){m.x=w.x;m.y=w.y;}
    if(!blockedCharge&&warningHits(w,s.player)&&!e.invulnerable){const armor=s.inventory.armor&&s.durability.armor>0;s.player.hp-=Math.round((w.damage||d.damage)*(armor?.55:1)*(s.symbiosis?.run?.deep?1.25:1));if(armor){s.durability.armor=Math.max(0,s.durability.armor-6);if(!s.durability.armor)s.inventory.armor=0;}if(m.kind==='spider')e.slowed=2;if(m.kind==='boar')boarKnockback(s,{x:w.ox,y:w.oy},walkable);s.hurtUntil=s.time+.3;}m.cooldown=d.cooldown;
   }continue;}
  const distance=dist(m,s.player),home={x:m.homeX,y:m.homeY};
  // 回程虫洞附近是落脚地，野怪不会追入入口安全圈。
  const safe=s.nodes.some(n=>n.type==='wormhole'&&dist(s.player,n)<160);
  const alarm=e.creatures.some(other=>CREATURES[other.kind]?.behavior==='alarm'&&other.hp>0&&other.alert>0&&dist(other,m)<400);
  const pack=m.kind==='frostwolf'&&e.creatures.some(other=>other.kind==='frostwolf'&&other.hp>0&&other.alert>0&&dist(other,m)<420);
  const guarding=['boar','spider'].includes(m.kind);
  const lure=!d.boss&&!m.alert?s.homestead?.lures.find(l=>l.realm===e.current&&l.until>s.time&&dist(l,m)<450):null;
  const radius=(d.boss?340:guarding?140:d.behavior==='light'?(s.torchOn?380:100):280)*(d.boss?1:(follows(s,'ranger')?.75:1)*(hasModule(s,'calm')?.8:1));
  const aggro=!safe&&!lure&&(!d.neutral||m.alert>0)&&distance<(m.alert||pack||alarm?550:radius)&&dist(m,home)<600;
  if(aggro&&d.behavior==='alarm')m.alert=Math.max(m.alert,1);
  if(aggro&&distance<=d.range&&m.cooldown<=0){m.warning={kind:d.kind,damage:d.damage,ox:m.x,oy:m.y,x:['slam','ring'].includes(d.kind)?m.x:s.player.x,y:['slam','ring'].includes(d.kind)?m.y:s.player.y,radius:d.kind==='beam'?(d.boss?40:26):['slam','ring'].includes(d.kind)?(d.boss?170:105):d.boss?88:58,innerRadius:d.kind==='ring'?(d.boss?70:40):0,left:d.windup,total:d.windup};continue;}
  const patrol={x:home.x+Math.cos(s.time*.15+m.homeX)*32,y:home.y+Math.sin(s.time*.15+m.homeY)*25};
  const target=lure|| (aggro?s.player:patrol),dd=dist(m,target);if(dd>16){const speed=d.speed*(m.slow?.45:1)*dt,x=m.x+(target.x-m.x)/dd*speed,y=m.y+(target.y-m.y)/dd*speed;if(walkable(s,x,y)){m.x=x;m.y=y;}}
 }
}
export function validateExpedition(s,num,validateMap){
 const e=s.expedition;if(!e)return;if(!Object.hasOwn(REALMS,e.current)||!Array.isArray(e.visited)||e.visited.length>Object.keys(REALMS).length||e.visited.some(k=>!Object.hasOwn(REALMS,k))||new Set(e.visited).size!==e.visited.length||!e.visited.includes(e.current))throw new Error('远征地图无效');
 if(![null,...Object.keys(WEAPONS)].includes(e.equipped)||['crossings','cooldown','dodgeCooldown','invulnerable','slowed'].some(k=>!num(e[k])))throw new Error('远征装备状态无效');
 if(!e.kills||Object.entries(e.kills).some(([k,v])=>!Object.hasOwn(CREATURES,k)||!Number.isInteger(v)||!num(v))||!Array.isArray(e.bosses)||e.bosses.some(k=>!CREATURES[k]?.boss)||new Set(e.bosses).size!==e.bosses.length)throw new Error('野怪图鉴无效');
 const creatures=list=>{if(!Array.isArray(list)||list.length>40||new Set(list.map(m=>m?.id)).size!==list.length||list.some(m=>!m||!Object.hasOwn(CREATURES,m.kind)||typeof m.id!=='string'||m.id.length>80||!num(m.hp,-100,CREATURES[m.kind]?.hp||400)||(m.pacified!==undefined&&typeof m.pacified!=='boolean')||!num(m.x,0,3600)||!num(m.y,0,2800)||!num(m.homeX,0,3600)||!num(m.homeY,0,2800)||['cooldown','slow','stun','respawnAt'].some(k=>!num(m[k]))))throw new Error('野怪数据无效');for(const m of list){m.warning=null;m.alert=0;}};
 creatures(e.creatures);
 if(!e.worlds||Array.isArray(e.worlds)||Object.keys(e.worlds).length>Object.keys(REALMS).length-1)throw new Error('远征存档无效');
 for(const[id,w]of Object.entries(e.worlds)){if(!Object.hasOwn(REALMS,id)||id===e.current||!num(w.savedAt,0,s.time))throw new Error('区域存档无效');validateMap({...s,...w});creatures(w.creatures);}
 for(const map of [s,...Object.values(e.worlds)])for(const n of map.nodes.filter(n=>n.type==='wormhole'))if(!Object.hasOwn(REALMS,n.destination))throw new Error('虫洞目的地无效');
 e.shot=null;e.rollCombo=null;
}
