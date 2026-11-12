import {STEAM_JOBS} from './steam-data.js';
const fail=reason=>({ok:false,reason});
export function steamState(b){return b.steam??={enabled:false,recipe:'board',heat:0,job:null,batches:0};}
const fits=(bag,drop)=>Object.entries(drop).every(([id,n])=>(bag[id]||0)+n<=9999);
export function steamStatus(b){const m=steamState(b),r=STEAM_JOBS[m.job?.recipe||m.recipe];if(!m.enabled)return'已停机 · 在制品保留';if(m.job?.remaining===0)return'产物等候出仓 · 先腾出空间';if(m.job)return m.heat>0?'加工中 · '+Math.ceil(m.job.remaining)+' 秒':'缺少燃料 · 等待 1 木材';if((b.inventory?.[Object.keys(r.drop)[0]]||0)>=20)return'达到 20 件目标库存';return'等待原料与木柴';}
export function steamAction(s,action,id,value){
 const b=s.buildings.find(b=>b.id===id&&b.type==='steamworks');if(s.status!=='playing'||s.rural?.visit||!b||Math.hypot(b.x-s.player.x,b.y-s.player.y)>180)return fail('先走近本图蒸汽工坊');const m=steamState(b);
 if(action==='toggle')m.enabled=!m.enabled;
 else if(action==='recipe'){if(!Object.hasOwn(STEAM_JOBS,value))return fail('未知加工配方');if(m.job)return fail('先完成在制品，再切换配方');m.recipe=value;}
 else if(action==='cool'){if(m.job)return fail('先完成在制品，再排出余热');m.enabled=false;m.heat=0;}
 else return fail('未知工坊操作');return{ok:true,reason:action==='cool'?'已停机排出余热，燃料不返还。':'工坊设置已保存，回到荒野后继续。'};
}
export function stepSteam(s,dt){
 for(const b of s.buildings){if(b.type!=='steamworks')continue;const m=steamState(b),bag=b.inventory??={};if(!m.enabled)continue;
  if(!m.job){const r=STEAM_JOBS[m.recipe],out=Object.keys(r.drop)[0];if((bag[out]||0)>=20||!fits(bag,r.drop)||!Object.entries(r.cost).every(([k,n])=>(bag[k]||0)>=n+(k==='wood'&&m.heat<=0?1:0))||m.heat<=0&&!(bag.wood>0))continue;
   for(const[k,n]of Object.entries(r.cost))bag[k]-=n;m.job={recipe:m.recipe,remaining:r.seconds};
  }
  const r=STEAM_JOBS[m.job.recipe];if(m.job.remaining>0){if(m.heat<=0){if(!(bag.wood>0))continue;bag.wood--;m.heat=24;}const spent=Math.min(dt,m.heat,m.job.remaining);m.heat=Math.max(0,m.heat-spent);m.job.remaining=Math.max(0,m.job.remaining-spent);}
  if(m.job.remaining<=1e-7&&fits(bag,r.drop)){for(const[k,n]of Object.entries(r.drop))bag[k]=(bag[k]||0)+n;m.job=null;m.batches++;s.ecology=Math.max(0,s.ecology-.1);}
 }
}
export function validateSteam(s,num){
 for(const map of [s,...Object.values(s.expedition?.worlds||{})])for(const b of map.buildings){if(!b.steam)continue;const m=b.steam;if(b.type!=='steamworks'||typeof m.enabled!=='boolean'||!Object.hasOwn(STEAM_JOBS,m.recipe)||!num(m.heat,0,24)||!Number.isInteger(m.batches)||!num(m.batches)||m.job&&(!Object.hasOwn(STEAM_JOBS,m.job.recipe)||!num(m.job.remaining,0,STEAM_JOBS[m.job.recipe].seconds)))throw Error('蒸汽工坊进度无效');}
}
