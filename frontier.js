import * as G from './survival.js';
import {craftAffordable,payCraft} from './homestead.js';
import {FRONTIER_RECIPES,JOBS,ENCOUNTERS,AID_MAPS,IMPROVE_COST} from './frontier-data.js';
export * from './frontier-data.js';
const fail=reason=>({ok:false,reason});
const hasStock=b=>Object.values(b.inventory||{}).some(n=>n>0);
const fit=(bag,drop)=>Object.entries(drop).every(([id,n])=>(bag[id]||0)+n<=9999);
function give(bag,drop){for(const[id,n]of Object.entries(drop))bag[id]=(bag[id]||0)+n;}
function say(s,text){s.message={id:++s.messageSeq,text};s.journal.unshift({day:G.day(s),text});s.journal=s.journal.slice(0,80);}
function definition(id){return ENCOUNTERS.find(e=>e.id===id);}
export function initFrontier(s){
 s.frontier??={choices:{},deliveries:[],aidDone:{},aidCooldown:{},care:0,orders:0};
 const add=(map,id)=>{if(id==='home')return;for(const e of ENCOUNTERS.filter(e=>e.map===id)){
  const nid='event-'+e.id;if(map.nodes.some(n=>n.id===nid))continue;let spot=null;
  for(const r of [0,80,160,240,320]){for(let i=0;i<16;i++){const p={x:e.x+Math.cos(i*Math.PI/8)*r,y:e.y+Math.sin(i*Math.PI/8)*r};if(G.isLand(p.x,p.y)&&!map.nodes.some(n=>(n.available||n.sapling)&&G.distance(n,p)<62)&&!map.buildings.some(b=>G.distance(b,p)<95)){spot=p;break;}}if(spot)break;}
  // 空地不足时保留可达的基础落点；事件只交互，不阻挡移动。
  map.nodes.push({id:nid,type:'encounter',eventId:e.id,realm:id,...(spot||{x:e.x,y:e.y}),hp:1,available:!Object.hasOwn(s.frontier.choices,e.id),respawnAt:0});
 }};add(s,s.expedition.current);for(const[id,map]of Object.entries(s.expedition.worlds))add(map,id);
}
export function encounterReason(s,id,choice){
 const e=definition(id),o=e?.options.find(o=>o.id===choice),n=s.nodes.find(n=>n.type==='encounter'&&n.eventId===id);
 if(s.status!=='playing'||!e||!o||!n||e.map!==s.expedition.current)return'请在事件所在地图互动';
 if(Object.hasOwn(s.frontier.choices,id)||!n.available)return'这段遭遇已经结束';
 if(G.distance(s.player,n)>140)return'请先走近事件';
 if(!G.affordable(s,o.cost))return'背包材料不足，远征不调用营地箱子';
 if(!fit(s.inventory,o.drop))return'请先腾出背包空间';return'';
}
export function chooseEncounter(s,id,choice){
 const reason=encounterReason(s,id,choice);if(reason)return fail(reason);const e=definition(id),o=e.options.find(o=>o.id===choice),n=s.nodes.find(n=>n.eventId===id);
 for(const[k,v]of Object.entries(o.cost))s.inventory[k]-=v;
 give(s.inventory,o.drop);s.insight+=o.insight||0;s.resonance=Math.min(100,s.resonance+(o.resonance||0));s.ecology=Math.min(100,s.ecology+(o.eco||0));if(o.warmth)s.living.temperature+=(25-s.living.temperature)*.5;
 s.frontier.choices[id]=choice;n.available=false;
 if(o.later)s.frontier.deliveries.push({id,remaining:o.delay});
 say(s,'「'+e.name+'」：'+o.name+(o.later?'。后续物资可在营地手记台领取。':'。选择已记入旅程。'));return{ok:true,reason:s.message.text};
}
export function claimDelivery(s,id){const d=s.frontier.deliveries.find(d=>d.id===id),e=definition(id),o=e?.options.find(o=>o.id===s.frontier.choices[id]);if(s.status!=='playing'||!G.inHome(s)||!G.nearby(s,'fielddesk',180))return fail('回原岛手记台领取回信');if(!d||d.remaining>0||!o?.later)return fail('回信仍在途中，返回荒野后计时');if(!fit(s.inventory,o.later))return fail('请先腾出背包空间');give(s.inventory,o.later);s.frontier.deliveries=s.frontier.deliveries.filter(x=>x.id!==id);say(s,'收到「'+e.name+'」的回信与物资。');return{ok:true,reason:s.message.text};}
export function jobReason(s,b,id,count=1){const j=Object.hasOwn(JOBS,id)?JOBS[id]:null;if(s.status!=='playing'||!b||!j||b.type!==j.station||G.distance(s.player,b)>180)return'走近对应设施安排生产';if(![1,3].includes(count))return'订单只能选择一批或三批';if(s.level<j.level)return'需要 '+j.level+' 级';if(b.project||b.aid||b.crop||hasStock(b))return'先完成并领取当前产物';const cost=Object.fromEntries(Object.entries(j.cost).map(([k,n])=>[k,n*count]));if(!craftAffordable(s,cost))return'材料不足（可用附近储物箱）';return'';}
export function startJob(s,b,id,count=1){const reason=jobReason(s,b,id,count);if(reason)return fail(reason);const j=JOBS[id];payCraft(s,Object.fromEntries(Object.entries(j.cost).map(([k,n])=>[k,n*count])));b.project={id,count,remaining:j.seconds*count*(b.improved?.75:1)};b.inventory??={};return{ok:true,reason:'已安排 '+count+' 批「'+j.name+'」。材料已投入，当前地图活动时生产。'};}
export function improveReason(s,b){if(s.status!=='playing'||!b||!Object.hasOwn(IMPROVE_COST,b.type)||G.distance(s.player,b)>180)return'走近可改良的设施';if(b.improved)return'已改良';if(b.project||b.crop||hasStock(b))return'先完成并领取当前产物再改良';if(!craftAffordable(s,IMPROVE_COST[b.type]))return'改良材料不足';return'';}
export function improve(s,b){const reason=improveReason(s,b);if(reason)return fail(reason);payCraft(s,IMPROVE_COST[b.type]);b.improved=true;return{ok:true,reason:'设施已改良：育苗与晾晒耗时减少 20%，生产工坊耗时减少 25%。'};}
export function aidReason(s,b,map,choice){const a=Object.hasOwn(AID_MAPS,map)?AID_MAPS[map]:null,o=a?.options.find(o=>o.id===choice);if(s.status!=='playing'||s.level<7||!b||b.type!=='aidbeacon'||G.distance(s.player,b)>180)return'七级后走近远方守护台';if(!o)return'未知援助方案';if(!ENCOUNTERS.some(e=>e.map===map&&Object.hasOwn(s.frontier.choices,e.id)))return'先到这片远征地图完成一段遭遇，了解对方';if(b.aid||hasStock(b))return'先完成并领取当前援助回赠';if((s.frontier.aidCooldown[map]||0)>0)return'对方正在安顿，稍后再提供援助';if(!craftAffordable(s,o.cost))return'援助物资不足（可用附近箱子）';return'';}
export function startAid(s,b,map,choice){const reason=aidReason(s,b,map,choice);if(reason)return fail(reason);const o=AID_MAPS[map].options.find(o=>o.id===choice);payCraft(s,o.cost);b.aid={map,choice,remaining:100};b.inventory??={};return{ok:true,reason:'援助物资已交付，100 秒当前地图活动后可收回信。'};}
export function frontierAction(s,b,action){
 if(s.status!=='playing'||!b||G.distance(s.player,b)>180)return fail('先走近设施');
 if(action.startsWith('job:')){const[,id,n]=action.split(':');return startJob(s,b,id,Number(n));}
 if(action.startsWith('aid:')){const[,map,choice]=action.split(':');return startAid(s,b,map,choice);}
 if(action==='improve')return improve(s,b);
 if(action==='fertilize'){if(b.type!=='nursery'||!b.crop||b.crop.fertilized)return fail('每轮生长中的育苗床只能追肥一次');if(!craftAffordable(s,{compost:1}))return fail('需要 1 份堆肥');payCraft(s,{compost:1});b.crop.readyAt=s.time+Math.max(0,b.crop.readyAt-s.time)*.6;b.crop.fertilized=true;s.frontier.care++;return{ok:true,reason:'追肥完成：剩余生长时间减少 40%。'};}
 if(action==='soil'){if(b.type!=='composter')return fail('在堆肥箱旁补养土地');if(s.ecology>=100)return fail('当前生态已满');if(!craftAffordable(s,{compost:1}))return fail('需要 1 份堆肥');payCraft(s,{compost:1});s.ecology=Math.min(100,s.ecology+4);s.frontier.care++;return{ok:true,reason:'营地土壤得到照料，生态 +4。'};}
 if(action==='frontier-collect'){if(!FRONTIER_RECIPES.some(r=>r.building===b.type)||!hasStock(b))return fail('这里没有可领取的产物');let n=0;for(const[id,v]of Object.entries(b.inventory)){const take=Math.min(v,9999-(s.inventory[id]||0));if(take){give(s.inventory,{[id]:take});b.inventory[id]-=take;n+=take;}}return n?{ok:true,reason:'已收好营地产物与回赠。'}:fail('背包空间不足');}
 return fail('未知营地经营操作');
}
export function stepFrontier(s,dt){const f=s.frontier;for(const d of f.deliveries)d.remaining=Math.max(0,d.remaining-dt);for(const k of Object.keys(f.aidCooldown))f.aidCooldown[k]=Math.max(0,f.aidCooldown[k]-dt);
 for(const b of s.buildings){if(b.project){b.project.remaining=Math.max(0,b.project.remaining-dt);if(!b.project.remaining){const j=JOBS[b.project.id],drop=Object.fromEntries(Object.entries(j.drop).map(([id,n])=>[id,n*b.project.count]));if(fit(b.inventory,drop)){give(b.inventory,drop);f.orders+=b.project.count;b.project=null;say(s,'「'+G.BUILDING_NAMES[b.type]+'」订单完成，可回营领取。');}}}
 if(b.aid){b.aid.remaining=Math.max(0,b.aid.remaining-dt);if(!b.aid.remaining){const a=b.aid,o=AID_MAPS[a.map].options.find(o=>o.id===a.choice);if(fit(b.inventory,o.drop)){give(b.inventory,o.drop);f.aidDone[a.map]=(f.aidDone[a.map]||0)+1;f.aidCooldown[a.map]=180;s.ecology=Math.min(100,s.ecology+3);b.aid=null;say(s,'收到远方营地的回信。守护台可领取回赠。');}}}
 }
}
export function validateFrontier(s,num){
 const f=s.frontier;if(!f)return;
 if(typeof f!=='object'||Array.isArray(f)||!f.choices||typeof f.choices!=='object'||Array.isArray(f.choices)||Object.entries(f.choices).some(([id,c])=>!definition(id)?.options.some(o=>o.id===c)))throw Error('远征事件选择无效');
 if(!Array.isArray(f.deliveries)||f.deliveries.length>9||new Set(f.deliveries.map(x=>x.id)).size!==f.deliveries.length||f.deliveries.some(d=>!d||!num(d.remaining,0,90)||!definition(d.id)?.options.find(o=>o.id===f.choices[d.id])?.later))throw Error('远征回信无效');
 for(const k of ['care','orders'])if(!Number.isInteger(f[k])||!num(f[k]))throw Error('营地经营计数无效');
 for(const k of ['aidDone','aidCooldown'])if(!f[k]||typeof f[k]!=='object'||Array.isArray(f[k])||Object.entries(f[k]).some(([id,n])=>!Object.hasOwn(AID_MAPS,id)||!num(n,0,k==='aidDone'?1000000000:180)||(k==='aidDone'&&!Number.isInteger(n))))throw Error('守护援助进度无效');
 for(const[id,map]of [[s.expedition?.current||'home',s],...Object.entries(s.expedition?.worlds||{})]){
 for(const n of map.nodes)if(n.type==='encounter'&&(!definition(n.eventId)||definition(n.eventId).map!==id||n.realm!==id||n.id!=='event-'+n.eventId||n.available===Object.hasOwn(f.choices,n.eventId)))throw Error('远征事件地图无效');
 for(const b of map.buildings){if(b.improved!==undefined&&(typeof b.improved!=='boolean'||!Object.hasOwn(IMPROVE_COST,b.type)))throw Error('设施改良无效');
 if(b.project){const j=Object.hasOwn(JOBS,b.project.id)?JOBS[b.project.id]:null;if(!j||j.station!==b.type||s.level<j.level||![1,3].includes(b.project.count)||!num(b.project.remaining,0,j.seconds*3)||hasStock(b)||b.aid||b.crop)throw Error('生产订单无效');}
 if(b.aid){const a=b.aid;if(b.type!=='aidbeacon'||s.level<7||!Object.hasOwn(AID_MAPS,a.map)||!AID_MAPS[a.map].options.some(o=>o.id===a.choice)||!num(a.remaining,0,100)||hasStock(b)||b.project)throw Error('守护订单无效');}
 if(b.crop?.fertilized!==undefined&&typeof b.crop.fertilized!=='boolean')throw Error('育苗追肥数据无效');
 }
 }
}
