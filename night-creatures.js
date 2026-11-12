import {terrainPush,boarKnockback} from './terrain-impact.js';
// 出现阶段、机制与反制共用同一份数据；瞬移和吞火均先预警，不直接命中。
export const NIGHT_ROSTER={
 scorpion:{name:'影蝎',hp:36,speed:62,windup:1.25,reach:215,damage:8,level:1,day:1,role:'潜伏 · 毒液区域',tip:'近处会显形，绿圈落定后持续5秒；离开毒区，火光能压制它。'},
 howler:{name:'夜嚎者',hp:48,speed:70,windup:1.1,reach:140,damage:8,level:2,day:2,role:'支援光环 · 预警瞬移',tip:'周围240步夜怪伤害提升20%，同类不叠加。优先击倒或用火光把它赶离同伴；瞬移不造成伤害。'},
 boneboar:{name:'碎骨野猪',hp:58,speed:86,windup:1.05,reach:240,damage:14,level:1,day:3,role:'锁定冲锋 · 撞树硬直',tip:'沿虚线冲向蓄势时的落点。侧移或引向成树，撞树后硬直2秒；被撞到树上会额外损失生命和意识。'},
 bloodbats:{name:'血蝠群',hp:34,speed:94,windup:1.2,reach:190,damage:0,level:2,day:3,role:'短暂扰视 · 意识消耗',tip:'红圈中的蝠雾持续4秒。只对蝠雾的意识消耗采用火外每秒1点、火内0.5点；不降低移速，不增加武器损耗。'},
 devourer:{name:'蚀者',hp:82,speed:78,windup:1.4,reach:180,damage:16,level:4,day:6,role:'吞火蓄势 · 低血狂暴',tip:'吞火前蓄势1.8秒，任何命中都可打断；每12秒最多吃掉8燃料，并至少留下8。不能吞火炬、长明灯或自身心光。残血不逃跑，蓄势变快，仍畏光。'}
};
const LEGACY={stalker:{name:'苔影',hp:35,speed:68,windup:1.1,reach:105,damage:9},lancer:{name:'棘影',hp:35,speed:100,windup:.9,reach:210,damage:12},prowler:{name:'羽影',hp:35,speed:88,windup:1.3,reach:150,damage:10}};
export const NIGHT_KINDS={...LEGACY,...NIGHT_ROSTER};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function nightProfile(e){return NIGHT_KINDS[e.kind]||LEGACY.stalker;}
export function selectNightKind(s,roll){
 const day=Math.floor(s.time/300)+1,allowed=Object.entries(NIGHT_ROSTER).filter(([id,d])=>s.level>=d.level&&day>=d.day&&(!['howler','devourer'].includes(id)||!s.enemies.some(e=>e.kind===id&&e.hp>0)));
 return allowed[Math.min(allowed.length-1,Math.floor(Math.max(0,Math.min(.99999,roll))*allowed.length))]?.[0]||'scorpion';
}
function encounter(s){if(!s.nightEncounter||s.nightEncounter.realm!==s.expedition.current)s.nightEncounter={realm:s.expedition.current,hazards:[],fogUntil:0};return s.nightEncounter;}
function text(s,e,label){s.fx.push({x:e.x,y:e.y,at:s.time,text:label});}
function hit(s,e,damage){
 if(s.expedition.invulnerable>0)return false;const p=s.player,armor=s.inventory.armor&&s.durability.armor>0;p.hp-=armor?Math.ceil(damage*.55):damage;p.clarity=Math.max(0,p.clarity-3);
 if(armor){s.durability.armor=Math.max(0,s.durability.armor-6);if(!s.durability.armor)s.inventory.armor=0;}s.hurtUntil=s.time+.3;return true;
}
export function interruptNightAttack(s,e){if(e.warning?.kind==='snuff'){e.warning=null;e.cooldown=2;e.snuffUntil=s.time+12;text(s,e,'吞火被打断');}}
function blinkLanding(s,e,walkable,lightAt){
 const angle=Math.atan2(e.y-s.player.y,e.x-s.player.x)+1.2;
 for(let i=0;i<8;i++){const a=angle+i*Math.PI/4,x=s.player.x+Math.cos(a)*220,y=s.player.y+Math.sin(a)*220;if(walkable(s,x,y)&&!lightAt(s,x,y))return{x,y};}return null;
}
export function stepNightCreatures(s,dt,{walkable,lightAt}){
 const state=encounter(s),p=s.player,lit=lightAt(s,p.x,p.y);
 state.hazards=state.hazards.filter(h=>h.until>s.time);
 // 同类区域按最大值生效，不因重叠叠加；毒区只在无光处伤人，闪避无敌可以挡住毒伤。
 const poison=state.hazards.some(h=>h.kind==='poison'&&distance(h,p)<h.radius),bats=state.hazards.some(h=>h.kind==='bats'&&distance(h,p)<h.radius);
 if(poison&&!lit&&!s.expedition.invulnerable){p.hp-=dt*1.5;state.poisonUntil=s.time+.3;}
 if(bats){p.clarity=Math.max(0,p.clarity-dt*(lit?.5:1));state.fogUntil=s.time+.3;}
 const howlers=s.enemies.filter(e=>e.kind==='howler'&&e.hp>12&&!lightAt(s,e.x,e.y)&&e.state!=='retreat');
 const move=(e,tx,ty,speed)=>{const d=distance(e,{x:tx,y:ty})||1,step=Math.min(d,speed*dt),x=e.x+(tx-e.x)/d*step,y=e.y+(ty-e.y)/d*step;if(walkable(s,x,y)){e.x=x;e.y=y;}};
 for(const e of s.enemies){
  const d=nightProfile(e);e.kind??='stalker';e.cooldown=Math.max(0,(e.cooldown||0)-dt);const gap=distance(e,p),inLight=lightAt(s,e.x,e.y),rage=e.kind==='devourer'&&e.hp<=d.hp*.35;
  if(gap<280&&Object.hasOwn(NIGHT_ROSTER,e.kind)&&!s.discoveries.includes('night:'+e.kind))s.discoveries.push('night:'+e.kind);
  const flee=!rage&&e.hp<=d.hp*.3||inLight;
  if(flee){e.warning=null;e.state='retreat';e.boosted=false;move(e,e.x+(e.x-p.x||1),e.y+(e.y-p.y),155);continue;}
  e.boosted=e.kind!=='howler'&&howlers.some(h=>h.id!==e.id&&distance(h,e)<240);
  if(e.warning){
   const w=e.warning;w.left-=dt;if(w.left>0)continue;e.warning=null;
   if(w.kind==='blink'){
    if(walkable(s,w.x,w.y)&&!lightAt(s,w.x,w.y)){e.x=w.x;e.y=w.y;}e.blinkUntil=s.time+8;e.cooldown=.8;
   }else if(w.kind==='snuff'){
    const fire=s.buildings.find(b=>b.id===w.fireId&&b.type==='campfire'&&b.fuel>0);
    if(fire&&distance(e,fire)<330){const drain=Math.min(8,Math.max(0,fire.fuel-8));fire.fuel-=drain;text(s,fire,drain?'营火被蚕食 · 燃料 −'+Math.round(drain):'余火仍在');}e.snuffUntil=s.time+12;e.cooldown=2;
   }else if(w.kind==='poison'||w.kind==='bats'){
    if(state.hazards.length<8)state.hazards.push({kind:w.kind,x:w.x,y:w.y,radius:w.kind==='poison'?65:105,until:s.time+(w.kind==='poison'?5:4)});e.cooldown=w.kind==='poison'?4.5:5;
   }else{
    let blocked=false;
    if(e.kind==='boneboar'){const r=terrainPush(s,e,w,walkable);blocked=r.blocked;if(r.tree){text(s,e,'撞树硬直 · 2秒');e.cooldown=2;}}
    else{const dx=w.x-e.x,dy=w.y-e.y,len=Math.hypot(dx,dy)||1;for(let n=0;n<Math.ceil(len/10);n++){const step=Math.min(10,len-n*10),x=e.x+dx/len*step,y=e.y+dy/len*step;if(!walkable(s,x,y)||lightAt(s,x,y))break;e.x=x;e.y=y;}}
    if(!blocked&&distance(e,p)<48&&!lit&&hit(s,e,Math.round(d.damage*(e.boosted?1.2:1)))&&e.kind==='boneboar')boarKnockback(s,{x:w.ox,y:w.oy},walkable);
    e.cooldown=Math.max(e.cooldown,rage?1.5:2.2);
   }
   e.state='recover';continue;
  }
  if(e.cooldown>0){e.state='recover';continue;}
  // 蚀者只能在安全圈外蓄势蚕食营火；手持火炬和永久光源始终是可靠反制。
  if(e.kind==='devourer'&&(e.snuffUntil||0)<=s.time){const fire=s.buildings.find(b=>b.type==='campfire'&&b.fuel>12&&distance(b,e)<310);if(fire){e.state='windup';e.warning={kind:'snuff',fireId:fire.id,x:fire.x,y:fire.y,ox:e.x,oy:e.y,left:1.8,total:1.8};continue;}}
  if((e.kind==='howler'&&gap<140||rage&&gap<240)&&(e.blinkUntil||0)<=s.time){const to=blinkLanding(s,e,walkable,lightAt);if(to){e.state='windup';e.warning={kind:'blink',...to,left:rage?.95:1.1,total:rage?.95:1.1};continue;}}
  if(!lit&&gap<d.reach){const kind=e.kind==='scorpion'?'poison':e.kind==='bloodbats'?'bats':'charge',windup=rage?.95:d.windup;e.state='windup';e.warning={kind,x:p.x,y:p.y,ox:e.x,oy:e.y,left:windup,total:windup};continue;}
  e.state=e.kind==='scorpion'&&gap>270?'burrow':'stalk';const angle=Math.atan2(p.y-e.y,p.x-e.x)+(gap<250?(e.kind==='prowler'||e.kind==='bloodbats'?1.1:['stalker','howler'].includes(e.kind)?.65:0):0);
  move(e,e.x+Math.cos(angle)*300,e.y+Math.sin(angle)*300,d.speed*(rage?1.25:1)*(e.boosted?1.1:1));
 }
 s.enemies=s.enemies.filter(e=>e.hp>0&&!(e.kind!=='devourer'&&e.hp<=nightProfile(e).hp*.3&&distance(e,p)>650));
}
